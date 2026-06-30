import { NextResponse } from "next/server";
import { updateProduct, getAdminProductById } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { categoryHasVariants } from "@/lib/constants";

/**
 * PATCH /api/admin/inventory/:id
 * Body: { stock: number }
 * Adjusts stock for a product. Returns the new stock level.
 * 服饰商品拒绝直接修改，必须通过 variants 管理库存
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;
  const { stock } = await request.json();

  // 检查是否为服饰商品
  const product = await getAdminProductById(id);
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  if (categoryHasVariants(product.category)) {
    return NextResponse.json(
      { error: "服饰商品库存必须通过规格管理，请在商品编辑页面修改 SKU 库存" },
      { status: 400 },
    );
  }

  if (typeof stock !== "number" || stock < 0) {
    return NextResponse.json(
      { error: "stock must be a non-negative number" },
      { status: 400 },
    );
  }

  const updated = await updateProduct(id, { stock: Math.max(0, Math.floor(stock)) });
  if (!updated) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  return NextResponse.json({ data: { id, stock: updated.stock } });
}
