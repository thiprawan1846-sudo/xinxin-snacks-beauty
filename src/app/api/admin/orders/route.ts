import { NextResponse } from "next/server";
import { listAllOrders } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

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
