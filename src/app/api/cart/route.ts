import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getCart, setCart, clearCart } from "@/lib/db";

/**
 * Cart API — all endpoints require a logged-in user.
 * The user's cart is keyed by their user id.
 *
 * GET    /api/cart            → { data: CartItem[] }
 * PUT    /api/cart            → body { items: {productId,quantity}[] } replace all
 * DELETE /api/cart            → clear all items
 */

async function requireUser() {
  const session = await getSession();
  if (!session) return null;
  return session.sub;
}

export async function GET() {
  const userId = await requireUser();
  if (!userId) {
    return NextResponse.json({ data: [] }, { status: 200 });
  }
  const items = await getCart(userId);
  return NextResponse.json({ data: items });
}

export async function PUT(request: Request) {
  const userId = await requireUser();
  if (!userId) {
    return NextResponse.json(
      { error: "กรุณาเข้าสู่ระบบเพื่อบันทึกตะกร้า" },
      { status: 401 },
    );
  }
  const body = (await request.json()) as {
    items?: { productId: string; quantity: number }[];
  };
  const items = Array.isArray(body.items) ? body.items : [];
  await setCart(userId, items);
  return NextResponse.json({ data: { ok: true } });
}

export async function DELETE() {
  const userId = await requireUser();
  if (!userId) {
    return NextResponse.json({ data: { ok: true } });
  }
  await clearCart(userId);
  return NextResponse.json({ data: { ok: true } });
}
