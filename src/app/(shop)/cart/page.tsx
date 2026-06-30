"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShoppingBag, ArrowRight, Check, Trash2 } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useOrders } from "@/hooks/use-orders";
import { useAuth } from "@/hooks/use-auth";
import { formatTHB } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CartItemRow } from "@/components/shop/cart-item";

export default function CartPage() {
  const router = useRouter();
  const { items, totalAmount, clear, remove, updateQty } = useCart();
  const createOrder = useOrders((s) => s.create);
  const user = useAuth((s) => s.user);

  const [placing, setPlacing] = useState(false);
  const [placed, setPlaced] = useState(false);
  const [form, setForm] = useState({
    name: user?.name ?? "",
    phone: "",
    address: "",
  });

  // 全店包邮，不收运费
  const grandTotal = totalAmount();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0 || !form.name || !form.phone || !form.address) return;

    // Orders table has FK userId -> User.id, so a login is required to place
    // an order. Guests are redirected to login and come back after auth.
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent("/cart")}`);
      return;
    }

    setPlacing(true);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          items: items.map((i) => ({
            productId: i.productId,
            name: i.name,
            nameTh: i.nameTh,
            quantity: i.quantity,
            price: i.price,
            imageUrl: i.imageUrl,
            variantId: i.variantId ?? null,
            size: i.size ?? null,
            color: i.color ?? null,
          })),
          customerName: form.name,
          customerPhone: form.phone,
          customerAddress: form.address,
        }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || `Order API returned ${res.status}`);
      }

      const { data: order } = await res.json();

      // Persist to local store so /orders/[id] can render immediately,
      // but the source of truth is now the database row returned by the API.
      createOrder(order);
      setPlaced(true);
      clear();
      setTimeout(() => router.push(`/orders/${order.id}`), 1200);
    } catch (err) {
      console.error("Place order failed:", err);
      alert("สั่งซื้อไม่สำเร็จ กรุณาลองอีกครั้ง");
    } finally {
      setPlacing(false);
    }
  };

  // Empty cart state
  if (items.length === 0 && !placed) {
    return (
      <div className="container-x flex flex-col items-center justify-center py-20 text-center">
        <span className="grid h-24 w-24 place-items-center rounded-full bg-sakura-100 text-5xl">
          🛒
        </span>
        <h1 className="mt-6 font-display text-2xl font-bold text-ink">
          ตะกร้ายังว่างอยู่
        </h1>
        <p className="mt-2 max-w-sm text-sm text-ink-muted">
          ยังไม่มีสินค้าในตะกร้า มาเลือกขนมและเครื่องสำอางจีนกันเถอะ!
        </p>
        <Button variant="gradient" size="lg" className="mt-6" asChild>
          <Link href="/products">
            เริ่มช้อปเลย
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    );
  }

  // Order placed success
  if (placed) {
    return (
      <div className="container-x flex flex-col items-center justify-center py-20 text-center">
        <span className="grid h-24 w-24 place-items-center rounded-full bg-emerald-100 text-5xl animate-pulse-soft">
          ✅
        </span>
        <h1 className="mt-6 font-display text-2xl font-bold text-ink">
          สั่งซื้อสำเร็จ!
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          กำลังนำคุณไปยังหน้าคำสั่งซื้อ...
        </p>
      </div>
    );
  }

  return (
    <div className="container-x py-8 md:py-12">
      <h1 className="mb-8 font-display text-3xl font-bold text-ink md:text-4xl">
        ตะกร้าสินค้า
      </h1>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Items */}
        <div className="lg:col-span-2">
          <div className="overflow-hidden rounded-3xl border border-sakura-100/70 bg-white/80 shadow-soft backdrop-blur-sm">
            <div className="flex items-center justify-between border-b border-sakura-100/70 px-5 py-4">
              <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-ink">
                <ShoppingBag className="h-5 w-5 text-sakura-500" />
                {items.length} รายการ
              </h2>
              <button
                onClick={clear}
                className="flex items-center gap-1 text-xs text-ink-muted transition-colors hover:text-rose-500"
              >
                <Trash2 className="h-3.5 w-3.5" />
                ล้างตะกร้า
              </button>
            </div>
            <div className="divide-y divide-sakura-100/70 px-5">
              {items.map((item) => (
                <CartItemRow key={item.productId} item={item} />
              ))}
            </div>
            <div className="border-t border-sakura-100/70 px-5 py-4">
              <Link
                href="/products"
                className="inline-flex items-center gap-1 text-sm font-medium text-sakura-600 hover:underline"
              >
                ← เพิ่มสินค้าอื่น
              </Link>
            </div>
          </div>
        </div>

        {/* Summary + checkout */}
        <div className="lg:col-span-1">
          <form
            onSubmit={handleSubmit}
            className="sticky top-24 space-y-5 rounded-3xl border border-sakura-100/70 bg-white/80 p-6 shadow-soft backdrop-blur-sm"
          >
            <h2 className="font-display text-lg font-semibold text-ink">
              ข้อมูลการจัดส่ง
            </h2>

            <div className="space-y-3">
              <Input
                placeholder="ชื่อ-นามสกุล"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <Input
                placeholder="เบอร์โทรศัพท์"
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                required
              />
              <textarea
                placeholder="ที่อยู่จัดส่ง (บ้านเลขที่ ซอย ถนน แขวง เขต จังหวัด รหัสไปรษณีย์)"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                required
                rows={3}
                className="w-full rounded-2xl border border-sakura-200 bg-white/80 px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-ink-muted/70 focus:border-sakura-400 focus:ring-2 focus:ring-sakura-200"
              />
            </div>

            <div className="space-y-2 border-t border-sakura-100/70 pt-4 text-sm">
              <div className="flex justify-between text-ink-soft">
                <span>ยอดสินค้า</span>
                <span>{formatTHB(totalAmount())}</span>
              </div>
              <div className="flex justify-between text-ink-soft">
                <span>ค่าจัดส่ง</span>
                <span className="font-semibold text-emerald-600">ฟรี</span>
              </div>
              <div className="flex justify-between border-t border-sakura-100/70 pt-3">
                <span className="font-display font-semibold text-ink">
                  ยอดรวมทั้งหมด
                </span>
                <span className="font-display text-xl font-bold text-sakura-600">
                  {formatTHB(grandTotal)}
                </span>
              </div>
            </div>

            <Button
              type="submit"
              variant="gradient"
              size="lg"
              className="w-full [&>*]:pointer-events-none"
              disabled={placing}
            >
              {placing ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  กำลังสั่งซื้อ...
                </>
              ) : (
                <>
                  <Check className="h-5 w-5" />
                  ยืนยันคำสั่งซื้อ
                </>
              )}
            </Button>

            <p className="text-center text-xs text-ink-muted">
              🔒 ชำระเงินปลายทาง · ไม่ต้องจ่ายล่วงหน้า
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
