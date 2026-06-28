import { NextResponse } from "next/server";
import { getOrderById } from "@/lib/db";

/**
 * GET /api/orders/[id]
 * Returns a single order by id, including its line items.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const order = await getOrderById(id);

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json({ data: order });
}
