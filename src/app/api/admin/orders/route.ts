import { NextResponse } from "next/server";
import { listAllOrders, updateOrderStatus } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import type { OrderStatus } from "@/types";

/**
 * GET /api/admin/orders
 * Optional query: status
 */
export async function GET(request: Request) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  let result = await listAllOrders();
  if (status) result = result.filter((o) => o.status === status);

  return NextResponse.json({ data: result, total: result.length });
}

/**
 * PATCH /api/admin/orders
 * Body: { id, status }
 * Updates the status of a single order in the database.
 */
export async function PATCH(request: Request) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  const body = await request.json();
  const { id, status } = body as { id: string; status: OrderStatus };

  if (!id || !status) {
    return NextResponse.json(
      { error: "id and status are required" },
      { status: 400 },
    );
  }

  const updated = await updateOrderStatus(id, status);
  if (!updated) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json({ data: updated });
}
