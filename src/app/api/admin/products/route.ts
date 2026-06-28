import { NextResponse } from "next/server";
import {
  createProduct,
  listProductsAdmin,
  type AdminProductQuery,
} from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import type { ProductStatus } from "@/types";

/**
 * GET /api/admin/products
 * Query params (all optional):
 *   q          — search across name / nameTh / brand
 *   category   — snacks | beauty | drinks | all
 *   status     — ACTIVE | INACTIVE | DRAFT | ALL
 *   featured   — true | false | all
 *   hot        — true | false | all
 *   deleted    — true (show only soft-deleted) | false (default)
 *   sort       — createdAt | name | price | stock
 *   order      — asc | desc
 *   page       — 1-based page number
 *   pageSize   — items per page
 */
export async function GET(request: Request) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  const sp = new URL(request.url).searchParams;

  const toBool = (v: string | null): boolean | "ALL" | undefined => {
    if (v === null) return undefined;
    if (v === "true") return true;
    if (v === "false") return false;
    return "ALL";
  };

  const query: AdminProductQuery = {
    search: sp.get("q") ?? undefined,
    categorySlug: sp.get("category") ?? undefined,
    status: (sp.get("status") as ProductStatus | "ALL" | null) ?? undefined,
    featured: toBool(sp.get("featured")),
    hot: toBool(sp.get("hot")),
    deleted: sp.get("deleted") === "true",
    sort: (sp.get("sort") as AdminProductQuery["sort"]) ?? undefined,
    order: (sp.get("order") as "asc" | "desc") ?? undefined,
    page: sp.get("page") ? Number(sp.get("page")) : undefined,
    pageSize: sp.get("pageSize") ? Number(sp.get("pageSize")) : undefined,
  };

  const result = await listProductsAdmin(query);
  return NextResponse.json(result);
}

/**
 * POST /api/admin/products
 * Body: product fields (name, nameTh, category, price, stock, imageUrl, ...)
 * Creates a new product.
 */
export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  const body = await request.json();

  const product = await createProduct({
    name: body.name,
    nameTh: body.nameTh,
    description: body.description ?? "",
    descriptionTh: body.descriptionTh ?? "",
    categorySlug: body.category ?? "snacks",
    price: body.price,
    originalPrice: body.originalPrice,
    stock: body.stock ?? 0,
    imageUrl: body.imageUrl,
    tags: body.tags ?? [],
    status: body.status ?? "ACTIVE",
    rating: body.rating ?? 0,
    reviewCount: body.reviewCount ?? 0,
    reason: body.reason,
    brand: body.brand,
    isFeatured: body.isFeatured ?? false,
    isHot: body.isHot ?? false,
  });

  return NextResponse.json({ data: product }, { status: 201 });
}
