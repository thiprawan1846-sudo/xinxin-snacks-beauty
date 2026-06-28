"use client";

import Link from "next/link";
import { ShoppingBag, X, ArrowRight } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { formatTHB } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CartItemRow } from "@/components/shop/cart-item";
import { useEffect } from "react";

export function CartDrawer() {
  const { items, isOpen, setOpen, totalAmount } = useCart();

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      {/* Overlay */}
      <div
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-50 bg-ink/30 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden="true"
      />

      {/* Panel */}
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-cream-50 shadow-float transition-transform duration-500 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-label="ตะกร้าสินค้า"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-sakura-100/70 bg-white/80 px-5 py-4 backdrop-blur">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold text-ink">
            <ShoppingBag className="h-5 w-5 text-sakura-500" />
            ตะกร้าสินค้า
            {items.length > 0 && (
              <span className="rounded-full bg-sakura-100 px-2 py-0.5 text-xs font-semibold text-sakura-600">
                {items.length}
              </span>
            )}
          </h2>
          <button
            onClick={() => setOpen(false)}
            className="grid h-9 w-9 place-items-center rounded-full text-ink-soft transition-colors hover:bg-sakura-50"
            aria-label="ปิด"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <span className="grid h-20 w-20 place-items-center rounded-full bg-sakura-100 text-4xl">
                🛒
              </span>
              <p className="font-display text-lg font-semibold text-ink">
                ตะกร้ายังว่างอยู่
              </p>
              <p className="max-w-[240px] text-sm text-ink-muted">
                มาเลือกขนมและเครื่องสำอางจีนที่เพื่อนแนะนำกันเถอะ!
              </p>
              <Button
                variant="gradient"
                className="mt-2"
                onClick={() => setOpen(false)}
                asChild
              >
                <Link href="/products">
                  เริ่มช้อป
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-sakura-100/70">
              {items.map((item) => (
                <CartItemRow key={item.productId} item={item} />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-sakura-100/70 bg-white/80 px-5 py-4 backdrop-blur">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-ink-soft">ยอดรวมทั้งหมด</span>
              <span className="font-display text-xl font-bold text-sakura-600">
                {formatTHB(totalAmount())}
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setOpen(false)}
                asChild
              >
                <Link href="/cart">ดูตะกร้า</Link>
              </Button>
              <Button variant="gradient" className="flex-1" asChild>
                <Link href="/cart">
                  สั่งซื้อ
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
