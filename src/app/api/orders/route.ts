import { NextResponse } from "next/server";
import { createOrder, listOrdersByUser } from "@/lib/db";

/**
 * GET /api/orders
 * Optional query: userId
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  const result = userId ? await listOrdersByUser(userId) : [];

  return NextResponse.json({ data: result, total: result.length });
}

/**
 * POST /api/orders
 * Body: { userId, items, customerName, customerPhone, customerAddress }
 * Creates a new order with PENDING status.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const totalAmount = body.items.reduce(
      (sum: number, i: { price: number; quantity: number }) =>
        sum + i.price * i.quantity,
      0,
    );

    const order = await createOrder({
      userId: body.userId ?? "user_customer",
      items: body.items.map(
        (i: {
          productId: string;
          name: string;
          nameTh: string;
          quantity: number;
          price: number;
          imageUrl: string;
        }) => ({
          productId: i.productId,
          name: i.name,
          nameTh: i.nameTh,
          quantity: i.quantity,
          price: i.price,
          imageUrl: i.imageUrl,
        }),
      ),
      totalAmount,
      customerName: body.customerName,
      customerPhone: body.customerPhone,
      customerAddress: body.customerAddress,
    });

    return NextResponse.json({ data: order }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/orders] failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
