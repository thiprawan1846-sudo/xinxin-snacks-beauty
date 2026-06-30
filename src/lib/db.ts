/**
 * Database access layer — Supabase REST API implementation.
 *
 * Bypasses PostgreSQL TCP (port 5432) which is blocked in this environment.
 * All reads/writes go through PostgREST over HTTPS.
 *
 * Exposes the same async signatures as the previous Prisma version so
 * callers don't change.
 */
import type {
  CategoryInfo,
  Order,
  OrderItem as AppOrderItem,
  Product,
  ProductSize,
  ProductColor,
  ProductStatus,
  ProductVariant,
} from "@/types";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_KEY) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env",
  );
}

const headers = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  "Content-Type": "application/json",
};

// ───────────────────── low-level helpers ─────────────────────

async function restSelect<T>(
  table: string,
  opts: {
    columns?: string;
    filter?: Record<string, string | number | boolean | null>;
    order?: { column: string; ascending?: boolean };
    limit?: number;
  } = {},
): Promise<T[]> {
  const params = new URLSearchParams();
  params.set("select", opts.columns ?? "*");
  for (const [k, v] of Object.entries(opts.filter ?? {})) {
    if (v === null) params.set(k, "is.null");
    else params.set(k, `eq.${v}`);
  }
  if (opts.order) {
    params.set(
      "order",
      `${opts.order.column}.${opts.order.ascending === false ? "desc" : "asc"}`,
    );
  }
  if (opts.limit) params.set("limit", String(opts.limit));

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/${table}?${params.toString()}`,
    { headers },
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GET ${table} failed: ${res.status} ${text}`);
  }
  return (await res.json()) as T[];
}

async function restInsert<T>(
  table: string,
  rows: unknown | unknown[],
): Promise<T[]> {
  const body = Array.isArray(rows) ? rows : [rows];
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      ...headers,
      Prefer: "return=representation",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`POST ${table} failed: ${res.status} ${text}`);
  }
  return (await res.json()) as T[];
}

async function restUpdate<T>(
  table: string,
  filter: Record<string, string | number>,
  data: Record<string, unknown>,
): Promise<T[]> {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(filter)) params.set(k, `eq.${v}`);
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/${table}?${params.toString()}`,
    {
      method: "PATCH",
      headers: { ...headers, Prefer: "return=representation" },
      body: JSON.stringify(data),
    },
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PATCH ${table} failed: ${res.status} ${text}`);
  }
  return (await res.json()) as T[];
}

async function restDelete(
  table: string,
  filter: Record<string, string | number>,
): Promise<boolean> {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(filter)) params.set(k, `eq.${v}`);
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/${table}?${params.toString()}`,
    { method: "DELETE", headers },
  );
  return res.ok;
}

// ───────────────────── types from DB ─────────────────────

interface CategoryRow {
  id: string;
  slug: string;
  label: string;
  labelTh: string;
  emoji: string;
  description: string | null;
  gradient: string | null;
}

interface ProductRow {
  id: string;
  name: string;
  nameTh: string;
  englishName?: string | null;
  description: string;
  descriptionTh: string;
  categoryId: string;
  price: string | number;
  originalPrice: string | number | null;
  stock: number;
  imageUrl: string;
  gallery: string[] | null;
  options: string[] | null;
  tags: string[];
  status: string;
  rating: number;
  reviewCount: number;
  reason: string | null;
  brand: string | null;
  isFeatured: boolean;
  isHot: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface OrderRow {
  id: string;
  userId: string;
  totalAmount: string | number;
  status: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  createdAt: string;
  updatedAt: string;
}

interface OrderItemRow {
  id: string;
  orderId: string;
  productId: string;
  name: string;
  nameTh: string;
  englishName?: string | null;
  quantity: number;
  price: string | number;
  imageUrl: string;
  variantId?: string | null;
  size?: string | null;
  color?: string | null;
  optionLabel?: string | null;
}

interface ProductVariantRow {
  id: string;
  productId: string;
  size: string | null;
  color: string | null;
  stock: number;
  priceOverride: string | number | null;
  sku: string | null;
  createdAt: string;
  updatedAt: string;
}

// Cache slug → categoryId
let categoryCache: Map<string, string> | null = null;

async function loadCategoryCache(): Promise<Map<string, string>> {
  if (categoryCache) return categoryCache;
  const rows = await restSelect<CategoryRow>("Category", {
    columns: "id,slug",
  });
  categoryCache = new Map(rows.map((r) => [r.slug, r.id]));
  return categoryCache;
}

async function categoryIdToSlug(id: string): Promise<string> {
  const cache = await loadCategoryCache();
  for (const [slug, cid] of cache) if (cid === id) return slug;
  return "snacks";
}

async function slugToCategoryId(slug: string): Promise<string | null> {
  const cache = await loadCategoryCache();
  return cache.get(slug) ?? null;
}

// ───────────────────── mappers ─────────────────────

function toVariant(v: ProductVariantRow): ProductVariant {
  return {
    id: v.id,
    productId: v.productId,
    size: (v.size as ProductSize | null) ?? null,
    color: (v.color as ProductColor | null) ?? null,
    stock: v.stock,
    priceOverride:
      v.priceOverride != null ? Number(v.priceOverride) : null,
    sku: v.sku ?? null,
  };
}

function toProduct(p: ProductRow, categorySlug: string, variants?: ProductVariant[]): Product {
  // gallery 优先；为空则用 imageUrl 单图。封面 = gallery[0] ?? imageUrl。
  const gallery = p.gallery && p.gallery.length > 0 ? p.gallery : [p.imageUrl];
  const cover = gallery[0] ?? p.imageUrl;
  return {
    id: p.id,
    name: p.name,
    nameTh: p.nameTh,
    englishName: p.englishName ?? null,
    description: p.description,
    descriptionTh: p.descriptionTh,
    category: categorySlug as Product["category"],
    price: Number(p.price),
    originalPrice: p.originalPrice != null ? Number(p.originalPrice) : undefined,
    stock: p.stock,
    imageUrl: cover,
    gallery,
    options: p.options ?? null,
    tags: p.tags ?? [],
    status: p.status as ProductStatus,
    rating: p.rating,
    reviewCount: p.reviewCount,
    reason: p.reason ?? undefined,
    brand: p.brand ?? undefined,
    isFeatured: p.isFeatured ?? false,
    isHot: p.isHot ?? false,
    deletedAt: p.deletedAt ?? null,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    variants,
  };
}

function toOrderItem(i: OrderItemRow): AppOrderItem {
  return {
    id: i.id,
    productId: i.productId,
    name: i.name,
    nameTh: i.nameTh,
    englishName: i.englishName ?? null,
    quantity: i.quantity,
    price: Number(i.price),
    imageUrl: i.imageUrl,
    variantId: i.variantId ?? null,
    size: (i.size as ProductSize | null) ?? null,
    color: (i.color as ProductColor | null) ?? null,
    optionLabel: i.optionLabel ?? null,
  };
}

function toOrder(o: OrderRow, items: OrderItemRow[]): Order {
  return {
    id: o.id,
    userId: o.userId,
    items: items.map(toOrderItem),
    totalAmount: Number(o.totalAmount),
    status: o.status as Order["status"],
    customerName: o.customerName,
    customerPhone: o.customerPhone,
    customerAddress: o.customerAddress,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  };
}

// ───────────────────── public API ─────────────────────

export async function getCategories(): Promise<CategoryInfo[]> {
  const rows = await restSelect<CategoryRow>("Category", {
    order: { column: "slug", ascending: true },
  });
  return rows.map((c) => ({
    slug: c.slug as CategoryInfo["slug"],
    label: c.label,
    labelTh: c.labelTh,
    emoji: c.emoji,
    description: c.description ?? "",
    gradient: c.gradient ?? "",
  }));
}

export async function getProductById(
  id: string,
): Promise<Product | undefined> {
  const rows = await restSelect<ProductRow>("Product", {
    filter: { id, deletedAt: null },
  });
  if (rows.length === 0) return undefined;
  const p = rows[0];
  const slug = await categoryIdToSlug(p.categoryId);
  const variants = slug === "clothing" ? await getVariantsByProduct(p.id) : undefined;
  return toProduct(p, slug, variants);
}

/** Admin read — includes soft-deleted rows. */
export async function getAdminProductById(
  id: string,
): Promise<Product | undefined> {
  const rows = await restSelect<ProductRow>("Product", { filter: { id } });
  if (rows.length === 0) return undefined;
  const p = rows[0];
  const slug = await categoryIdToSlug(p.categoryId);
  const variants = slug === "clothing" ? await getVariantsByProduct(p.id) : undefined;
  return toProduct(p, slug, variants);
}

// ───────────────────── Product Variants (SKU) ─────────────────────

/** 读取单个商品的全部 SKU。 */
export async function getVariantsByProduct(
  productId: string,
): Promise<ProductVariant[]> {
  const rows = await restSelect<ProductVariantRow>("ProductVariant", {
    filter: { productId },
    order: { column: "createdAt", ascending: true },
  });
  return rows.map(toVariant);
}

/**
 * 全量替换某商品的 SKU 列表（admin 保存用）。
 * 实现：删除旧 SKU → 插入新 SKU。被订单引用的旧 SKU 通过 variantId
 * 字符串字段保留在 OrderItem 中（无 FK），历史订单不受影响。
 */
export async function replaceVariants(
  productId: string,
  variants: {
    size: ProductSize | null;
    color: ProductColor | null;
    stock: number;
    priceOverride?: number | null;
    sku?: string | null;
  }[],
): Promise<ProductVariant[]> {
  // 1. 删除旧
  const params = new URLSearchParams();
  params.set("productId", `eq.${productId}`);
  await fetch(`${SUPABASE_URL}/rest/v1/ProductVariant?${params.toString()}`, {
    method: "DELETE",
    headers,
  });

  // 2. 插入新
  if (variants.length === 0) return [];
  const now = new Date().toISOString();
  const payload = variants.map((v) => ({
    id: crypto.randomUUID(),
    productId,
    size: v.size,
    color: v.color,
    stock: v.stock,
    priceOverride: v.priceOverride ?? null,
    sku: v.sku ?? null,
    createdAt: now,
    updatedAt: now,
  }));
  const inserted = await restInsert<ProductVariantRow>("ProductVariant", payload);
  return inserted.map(toVariant);
}

export async function getProductsByCategory(
  category: string,
): Promise<Product[]> {
  let rows: ProductRow[];
  if (category === "all") {
    rows = await restSelect<ProductRow>("Product", {
      filter: { status: "ACTIVE", deletedAt: null },
    });
  } else {
    const catId = await slugToCategoryId(category);
    if (!catId) return [];
    rows = await restSelect<ProductRow>("Product", {
      filter: { status: "ACTIVE", categoryId: catId, deletedAt: null },
    });
  }
  return Promise.all(
    rows.map(async (p) => toProduct(p, await categoryIdToSlug(p.categoryId))),
  );
}

export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
  const rows = await restSelect<ProductRow>("Product", {
    filter: { status: "ACTIVE", deletedAt: null, isFeatured: true },
    order: { column: "rating", ascending: false },
    limit,
  });
  return Promise.all(
    rows.map(async (p) => toProduct(p, await categoryIdToSlug(p.categoryId))),
  );
}

export async function getNewArrivals(limit = 4): Promise<Product[]> {
  const rows = await restSelect<ProductRow>("Product", {
    filter: { status: "ACTIVE", deletedAt: null },
    order: { column: "createdAt", ascending: false },
    limit,
  });
  return Promise.all(
    rows.map(async (p) => toProduct(p, await categoryIdToSlug(p.categoryId))),
  );
}

export async function getOrderById(id: string): Promise<Order | undefined> {
  const orders = await restSelect<OrderRow>("Order", { filter: { id } });
  if (orders.length === 0) return undefined;
  const items = await restSelect<OrderItemRow>("OrderItem", {
    filter: { orderId: id },
  });
  return toOrder(orders[0], items);
}

export async function searchProducts(query: string): Promise<Product[]> {
  const q = query.trim();
  // PostgREST OR filter across ilike columns: name / nameTh / brand.
  // IMPORTANT: encodeURIComponent the whole `or=(...)` value ONCE and append
  // manually. Using URLSearchParams.set would double-encode the % wildcards
  // inside the ilike patterns, turning the search term into garbage and
  // silently matching nothing.
  const orVal = `(name.ilike.%${q}%,nameTh.ilike.%${q}%,brand.ilike.%${q}%)`;
  const qs = [
    "select=*",
    "status=eq.ACTIVE",
    "deletedAt=is.null",
    `or=${encodeURIComponent(orVal)}`,
  ].join("&");
  const res = await fetch(`${SUPABASE_URL}/rest/v1/Product?${qs}`, { headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`search Product failed: ${res.status} ${text}`);
  }
  const rows = (await res.json()) as ProductRow[];
  return Promise.all(
    rows.map(async (p) => toProduct(p, await categoryIdToSlug(p.categoryId))),
  );
}

// ───────────────────── mutations ─────────────────────

export async function createOrder(input: {
  userId: string;
  items: {
    productId: string;
    name: string;
    nameTh: string;
    englishName?: string | null;
    quantity: number;
    price: number;
    imageUrl: string;
    variantId?: string | null;
    size?: ProductSize | null;
    color?: ProductColor | null;
    optionLabel?: string | null;
  }[];
  totalAmount: number;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
}): Promise<Order> {
  const now = new Date().toISOString();
  const orderId = crypto.randomUUID();

  // 1. Create order
  await restInsert("Order", {
    id: orderId,
    userId: input.userId,
    totalAmount: input.totalAmount,
    status: "PENDING",
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    customerAddress: input.customerAddress,
    createdAt: now,
    updatedAt: now,
  });

  // 2. Create order items（含规格快照，便于发货核对）
  const itemsPayload = input.items.map((i) => ({
    id: crypto.randomUUID(),
    orderId,
    productId: i.productId,
    name: i.name,
    nameTh: i.nameTh,
    englishName: i.englishName ?? null,
    quantity: i.quantity,
    price: i.price,
    imageUrl: i.imageUrl,
    variantId: i.variantId ?? null,
    size: i.size ?? null,
    color: i.color ?? null,
    optionLabel: i.optionLabel ?? null,
  }));
  await restInsert("OrderItem", itemsPayload);

  // 3. 扣库存：有 variantId 扣 SKU 库存，否则扣 Product.stock
  await Promise.all(
    input.items.map(async (i) => {
      if (i.variantId) {
        const rows = await restSelect<ProductVariantRow>("ProductVariant", {
          columns: "id,stock",
          filter: { id: i.variantId },
        });
        const current = rows[0]?.stock ?? 0;
        await restUpdate(
          "ProductVariant",
          { id: i.variantId },
          { stock: Math.max(0, current - i.quantity), updatedAt: now },
        );
      } else {
        const rows = await restSelect<ProductRow>("Product", {
          columns: "id,stock",
          filter: { id: i.productId },
        });
        const current = rows[0]?.stock ?? 0;
        await restUpdate(
          "Product",
          { id: i.productId },
          { stock: Math.max(0, current - i.quantity) },
        );
      }
    }),
  );

  return {
    id: orderId,
    userId: input.userId,
    items: itemsPayload.map((i) => ({
      id: i.id,
      productId: i.productId,
      name: i.name,
      nameTh: i.nameTh,
      englishName: i.englishName ?? null,
      quantity: i.quantity,
      price: i.price,
      imageUrl: i.imageUrl,
      variantId: i.variantId,
      size: (i.size as ProductSize | null) ?? null,
      color: (i.color as ProductColor | null) ?? null,
      optionLabel: i.optionLabel ?? null,
    })),
    totalAmount: input.totalAmount,
    status: "PENDING",
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    customerAddress: input.customerAddress,
    createdAt: now,
    updatedAt: now,
  };
}

export async function listOrdersByUser(userId: string): Promise<Order[]> {
  const orders = await restSelect<OrderRow>("Order", {
    filter: { userId },
    order: { column: "createdAt", ascending: false },
  });
  if (orders.length === 0) return [];
  const orderIds = orders.map((o) => o.id);
  // PostgREST `in` filter
  const params = new URLSearchParams();
  params.set("select", "*");
  params.set("orderId", `in.(${orderIds.join(",")})`);
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/OrderItem?${params.toString()}`,
    { headers },
  );
  const allItems = (await res.json()) as OrderItemRow[];
  return orders.map((o) =>
    toOrder(o, allItems.filter((i) => i.orderId === o.id)),
  );
}

export async function listAllOrders(): Promise<Order[]> {
  const orders = await restSelect<OrderRow>("Order", {
    order: { column: "createdAt", ascending: false },
  });
  if (orders.length === 0) return [];
  const items = await restSelect<OrderItemRow>("OrderItem");
  return orders.map((o) =>
    toOrder(o, items.filter((i) => i.orderId === o.id)),
  );
}

export async function updateOrderStatus(
  id: string,
  status: Order["status"],
): Promise<Order | undefined> {
  const updated = await restUpdate<OrderRow>(
    "Order",
    { id },
    { status, updatedAt: new Date().toISOString() },
  );
  if (updated.length === 0) return undefined;
  const items = await restSelect<OrderItemRow>("OrderItem", {
    filter: { orderId: id },
  });
  return toOrder(updated[0], items);
}

export async function listAllProducts(): Promise<Product[]> {
  const rows = await restSelect<ProductRow>("Product", {
    filter: { deletedAt: null },
    order: { column: "createdAt", ascending: false },
  });
  return Promise.all(
    rows.map(async (p) => toProduct(p, await categoryIdToSlug(p.categoryId))),
  );
}

// ───────────────────── Admin product query ─────────────────────

export interface AdminProductQuery {
  search?: string; // name / nameTh / brand (ilike)
  categorySlug?: string; // snacks / beauty / drinks
  status?: ProductStatus | "ALL";
  featured?: boolean | "ALL";
  hot?: boolean | "ALL";
  deleted?: boolean; // true = only soft-deleted, false/undef = only live
  sort?: "createdAt" | "name" | "price" | "stock";
  order?: "asc" | "desc";
  page?: number; // 1-based
  pageSize?: number;
}

export interface AdminProductResult {
  data: Product[];
  total: number;
  page: number;
  pageSize: number;
}

export async function listProductsAdmin(
  q: AdminProductQuery = {},
): Promise<AdminProductResult> {
  const page = Math.max(1, q.page ?? 1);
  const pageSize = Math.max(1, q.pageSize ?? 10);
  const sort = q.sort ?? "createdAt";
  const order = q.order === "asc" ? "asc" : "desc";

  const params = new URLSearchParams();
  params.set("select", "*");

  // soft-delete filter
  if (q.deleted) {
    params.set("deletedAt", "not.is.null");
  } else {
    params.set("deletedAt", "is.null");
  }

  // status
  if (q.status && q.status !== "ALL") {
    params.set("status", `eq.${q.status}`);
  }

  // featured / hot
  if (q.featured === true) params.set("isFeatured", "eq.true");
  if (q.featured === false) params.set("isFeatured", "eq.false");
  if (q.hot === true) params.set("isHot", "eq.true");
  if (q.hot === false) params.set("isHot", "eq.false");

  // search across name / nameTh / brand.
  // IMPORTANT: encodeURIComponent the whole `or=(...)` value ONCE and append
  // manually below — URLSearchParams.set double-encodes the % wildcards and
  // silently breaks ilike matching (see searchProducts for the same fix).
  const s = q.search?.trim();
  let orParam = "";
  if (s) {
    orParam = `&or=${encodeURIComponent(`(name.ilike.%${s}%,nameTh.ilike.%${s}%,brand.ilike.%${s}%)`)}`;
  }

  // order + pagination
  params.set("order", `${sort}.${order}`);
  const offset = (page - 1) * pageSize;
  params.set("limit", String(pageSize));
  params.set("offset", String(offset));

  // category filter needs id; if set, do a second-pass client filter is wrong
  // for pagination. Instead resolve id and add to params.
  if (q.categorySlug && q.categorySlug !== "all") {
    const catId = await slugToCategoryId(q.categorySlug);
    if (catId) params.set("categoryId", `eq.${catId}`);
  }

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/Product?${params.toString()}${orParam}`,
    { headers: { ...headers, Prefer: "count=exact" } },
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`listProductsAdmin failed: ${res.status} ${text}`);
  }
  const rows = (await res.json()) as ProductRow[];

  // total count via Content-Range header (requires Prefer: count=exact)
  const total = parseTotalCount(res);

  const data = await Promise.all(
    rows.map(async (p) => toProduct(p, await categoryIdToSlug(p.categoryId))),
  );
  return { data, total, page, pageSize };
}

/** Parse the PostgREST content-range header for total count. */
function parseTotalCount(res: Response): number {
  // Content-Range: <range-start>-<range-end>/<total>  OR  */<total>
  const range = res.headers.get("content-range");
  if (!range) return 0;
  const slash = range.lastIndexOf("/");
  if (slash === -1) return 0;
  const total = range.slice(slash + 1);
  return total === "*" ? 0 : Number(total) || 0;
}

export async function createProduct(input: {
  name: string;
  nameTh: string;
  englishName?: string | null;
  description: string;
  descriptionTh: string;
  categorySlug: string;
  price: number;
  originalPrice?: number;
  stock: number;
  imageUrl: string;
  gallery?: string[] | null;
  options?: string[] | null;
  tags: string[];
  status?: ProductStatus;
  rating?: number;
  reviewCount?: number;
  reason?: string;
  brand?: string;
  isFeatured?: boolean;
  isHot?: boolean;
}): Promise<Product> {
  const catId = await slugToCategoryId(input.categorySlug);
  if (!catId) throw new Error(`Category "${input.categorySlug}" not found`);

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  // gallery 至少 1 张；若未提供则用 imageUrl 兜底
  const gallery =
    input.gallery && input.gallery.length > 0 ? input.gallery : [input.imageUrl];
  const row: ProductRow = {
    id,
    name: input.name,
    nameTh: input.nameTh,
    englishName: input.englishName ?? null,
    description: input.description,
    descriptionTh: input.descriptionTh,
    categoryId: catId,
    price: input.price,
    originalPrice: input.originalPrice ?? null,
    stock: input.stock,
    imageUrl: gallery[0] ?? input.imageUrl,
    gallery,
    options: input.options ?? null,
    tags: input.tags,
    status: input.status ?? "ACTIVE",
    rating: input.rating ?? 0,
    reviewCount: input.reviewCount ?? 0,
    reason: input.reason ?? null,
    brand: input.brand ?? null,
    isFeatured: input.isFeatured ?? false,
    isHot: input.isHot ?? false,
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
  };
  await restInsert("Product", row);
  return toProduct(row, input.categorySlug);
}

/**
 * Soft delete: set deletedAt. Never removes the row, so historical orders
 * stay intact and the product can be restored or viewed in the admin bin.
 */
export async function deleteProduct(id: string): Promise<boolean> {
  const now = new Date().toISOString();
  const updated = await restUpdate<ProductRow>(
    "Product",
    { id },
    { deletedAt: now, updatedAt: now },
  );
  return updated.length > 0;
}

/** Restore a soft-deleted product. */
export async function restoreProduct(id: string): Promise<boolean> {
  const now = new Date().toISOString();
  const updated = await restUpdate<ProductRow>(
    "Product",
    { id },
    { deletedAt: null, updatedAt: now },
  );
  return updated.length > 0;
}

export async function updateProduct(
  id: string,
  data: Partial<
    Pick<
      Product,
      | "name"
      | "nameTh"
      | "englishName"
      | "description"
      | "descriptionTh"
      | "price"
      | "originalPrice"
      | "stock"
      | "status"
      | "imageUrl"
      | "gallery"
      | "options"
      | "tags"
      | "reason"
      | "brand"
      | "isFeatured"
      | "isHot"
    >
  >,
): Promise<Product | undefined> {
  const patch: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  if (data.name !== undefined) patch.name = data.name;
  if (data.nameTh !== undefined) patch.nameTh = data.nameTh;
  if (data.englishName !== undefined) patch.englishName = data.englishName;
  if (data.description !== undefined) patch.description = data.description;
  if (data.descriptionTh !== undefined) patch.descriptionTh = data.descriptionTh;
  if (data.price !== undefined) patch.price = data.price;
  if (data.originalPrice !== undefined) patch.originalPrice = data.originalPrice;
  if (data.stock !== undefined) patch.stock = data.stock;
  if (data.status !== undefined) patch.status = data.status;
  if (data.imageUrl !== undefined) patch.imageUrl = data.imageUrl;
  if (data.gallery !== undefined) patch.gallery = data.gallery;
  if (data.options !== undefined) patch.options = data.options;
  if (data.tags !== undefined) patch.tags = data.tags;
  if (data.reason !== undefined) patch.reason = data.reason;
  if (data.brand !== undefined) patch.brand = data.brand;
  if (data.isFeatured !== undefined) patch.isFeatured = data.isFeatured;
  if (data.isHot !== undefined) patch.isHot = data.isHot;

  // gallery 不为空时同步 imageUrl 为第一张（保持封面一致）
  if (data.gallery && data.gallery.length > 0) {
    patch.imageUrl = data.gallery[0];
  }

  const updated = await restUpdate<ProductRow>("Product", { id }, patch);
  if (updated.length === 0) return undefined;
  const p = updated[0];
  const slug = await categoryIdToSlug(p.categoryId);
  return toProduct(p, slug);
}

// ───────────────────── Cart (per-user, persisted) ─────────────────────

interface CartRow {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

interface CartItemRow {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
  variantId?: string | null;
  size?: string | null;
  color?: string | null;
  optionLabel?: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Find or create the Cart row for a user. Returns cartId. */
async function ensureCart(userId: string): Promise<string> {
  // Try find
  const existing = await restSelect<CartRow>("Cart", {
    columns: "id",
    filter: { userId },
    limit: 1,
  });
  if (existing.length > 0) return existing[0].id;

  // Create
  const now = new Date().toISOString();
  const id = `cart_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const row: CartRow = { id, userId, createdAt: now, updatedAt: now };
  await restInsert("Cart", row);
  return id;
}

/** Get all cart items for a user, joined with product info. */
export async function getCart(
  userId: string,
): Promise<import("@/types").CartItem[]> {
  const cartId = await ensureCart(userId);
  const rows = await restSelect<CartItemRow>("CartItem", {
    filter: { cartId },
  });
  if (rows.length === 0) return [];

  // Fetch product details separately (PostgREST embedded join requires a FK
  // constraint that isn't present in this DB, so we merge in code).
  const productIds = Array.from(new Set(rows.map((r) => r.productId)));
  const params = new URLSearchParams();
  params.set("select", "*");
  params.set("id", `in.(${productIds.join(",")})`);
  const pres = await fetch(
    `${SUPABASE_URL}/rest/v1/Product?${params.toString()}`,
    { headers },
  );
  if (!pres.ok) {
    const text = await pres.text();
    throw new Error(`GET Product for cart failed: ${pres.status} ${text}`);
  }
  const products = (await pres.json()) as ProductRow[];
  const productMap = new Map(products.map((p) => [p.id, p]));

  const out: import("@/types").CartItem[] = [];
  for (const r of rows) {
    const p = productMap.get(r.productId);
    if (!p) continue; // product may have been deleted
    // 服饰类商品 SKU 库存优先；非服饰沿用 Product.stock
    const stock = r.variantId
      ? await getVariantStock(r.variantId)
      : p.stock;
    // 封面图：gallery[0] ?? imageUrl
    const cover =
      p.gallery && p.gallery.length > 0 ? p.gallery[0] : p.imageUrl;
    out.push({
      productId: p.id,
      name: p.name,
      nameTh: p.nameTh,
      englishName: p.englishName ?? null,
      price: Number(p.price),
      imageUrl: cover,
      stock,
      quantity: r.quantity,
      variantId: r.variantId ?? null,
      size: (r.size as ProductSize | null) ?? null,
      color: (r.color as ProductColor | null) ?? null,
      optionLabel: r.optionLabel ?? null,
    });
  }
  return out;
}

/** 读取单个 SKU 的库存（购物车展示用）。失败回退 0。 */
async function getVariantStock(variantId: string): Promise<number> {
  try {
    const rows = await restSelect<ProductVariantRow>("ProductVariant", {
      columns: "id,stock",
      filter: { id: variantId },
    });
    return rows[0]?.stock ?? 0;
  } catch {
    return 0;
  }
}

/**
 * Replace all cart items for a user with the given list.
 * 支持服饰规格：variantId/size/color 会一并写入 CartItem。
 * 支持美妆规格：optionLabel 会一并写入 CartItem。
 */
export async function setCart(
  userId: string,
  items: {
    productId: string;
    quantity: number;
    variantId?: string | null;
    size?: ProductSize | null;
    color?: ProductColor | null;
    optionLabel?: string | null;
  }[],
): Promise<void> {
  const cartId = await ensureCart(userId);

  // 1. Delete existing items
  const params = new URLSearchParams();
  params.set("cartId", `eq.${cartId}`);
  await fetch(`${SUPABASE_URL}/rest/v1/CartItem?${params.toString()}`, {
    method: "DELETE",
    headers,
  });

  // 2. Insert new items
  if (items.length === 0) return;
  const now = new Date().toISOString();
  const payload = items.map((i) => ({
    id: `ci_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    cartId,
    productId: i.productId,
    quantity: i.quantity,
    variantId: i.variantId ?? null,
    size: i.size ?? null,
    color: i.color ?? null,
    optionLabel: i.optionLabel ?? null,
    createdAt: now,
    updatedAt: now,
  }));
  await restInsert("CartItem", payload);
}

/** Remove all cart items for a user (keeps the Cart row). */
export async function clearCart(userId: string): Promise<void> {
  const cartId = await ensureCart(userId);
  const params = new URLSearchParams();
  params.set("cartId", `eq.${cartId}`);
  await fetch(`${SUPABASE_URL}/rest/v1/CartItem?${params.toString()}`, {
    method: "DELETE",
    headers,
  });
}
