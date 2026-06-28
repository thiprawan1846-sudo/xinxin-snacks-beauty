import { NextResponse } from "next/server";
import {
  deleteProduct,
  restoreProduct,
  updateProduct,
} from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import type { ProductStatus } from "@/types";

/**
 * PATCH /api/admin/products/:id
 * Body: partial product fields (name, brand, price, stock, status,
 *       isFeatured, isHot, imageUrl, tags, description, ...)
 * Updates an existing product. Works on live and soft-deleted rows.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;
  const body = await request.json();

  // Coerce category slug → handled in createProduct only; for updates we
  // accept the raw fields. status must be a valid enum if provided.
  const data: Record<string, unknown> = {};
  const allowed: string[] = [
    "name",
    "nameTh",
    "description",
    "descriptionTh",
    "price",
    "originalPrice",
    "stock",
    "imageUrl",
    "tags",
    "reason",
    "brand",
    "isFeatured",
    "isHot",
  ];
  for (const k of allowed) {
    if (body[k] !== undefined) data[k] = body[k];
  }
  if (body.status !== undefined) {
    data.status = body.status as ProductStatus;
  }

  const product = await updateProduct(id, data);
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  return NextResponse.json({ data: product });
}

/**
 * DELETE /api/admin/products/:id
 * Soft-deletes the product (sets deletedAt). The row is preserved so
 * historical orders remain valid and the product can be restored.
 * Query: ?restore=true to undo a soft delete.
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;
  const restore = new URL(request.url).searchParams.get("restore") === "true";

  const ok = restore
    ? await restoreProduct(id)
    : await deleteProduct(id);
  if (!ok) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }
  return NextResponse.json({ data: { id, restored: restore } });
}
