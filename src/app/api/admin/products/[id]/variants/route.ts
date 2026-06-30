import { NextResponse } from "next/server";
import { getVariantsByProduct, replaceVariants, updateProduct } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import type { ProductColor, ProductSize } from "@/types";

/**
 * GET /api/admin/products/:id/variants
 * 返回某商品的全部 SKU（admin drawer 加载用）。
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;
  const variants = await getVariantsByProduct(id);
  return NextResponse.json({ data: variants });
}

/**
 * PUT /api/admin/products/:id/variants
 * 全量替换某商品的 SKU 列表。
 * Body: { variants: [{ size, color, stock, priceOverride?, sku? }] }
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;
  const body = (await request.json()) as {
    variants?: {
      size: ProductSize | null;
      color: ProductColor | null;
      stock: number;
      priceOverride?: number | null;
      sku?: string | null;
    }[];
  };

  const variants = Array.isArray(body.variants) ? body.variants : [];
  // 基本校验：stock 非负；过滤 stock<=0 的组合（不生成空 SKU）
  const clean = variants
    .filter(
      (v) =>
        v &&
        typeof v.stock === "number" &&
        v.stock >= 0 &&
        (v.size || v.color),
    )
    .map((v) => ({
      size: v.size,
      color: v.color,
      stock: Math.floor(v.stock),
      priceOverride: v.priceOverride ?? null,
      sku: v.sku ?? null,
    }));

  const result = await replaceVariants(id, clean);

  // 同步 Product.stock = sum(variants.stock)
  const totalStock = result.reduce((sum, v) => sum + v.stock, 0);
  await updateProduct(id, { stock: totalStock });

  return NextResponse.json({ data: result });
}
