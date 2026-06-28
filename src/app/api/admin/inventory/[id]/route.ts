import { NextResponse } from "next/server";
import { updateProduct } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

/**
 * PATCH /api/admin/inventory/:id
 * Body: { stock: number }
 * Adjusts stock for a product. Returns the new stock level.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;
  const { stock } = await request.json();

  if (typeof stock !== "number" || stock < 0) {
    return NextResponse.json(
      { error: "stock must be a non-negative number" },
      { status: 400 },
    );
  }

  const product = await updateProduct(id, { stock: Math.max(0, Math.floor(stock)) });
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  return NextResponse.json({ data: { id, stock: product.stock } });
}
