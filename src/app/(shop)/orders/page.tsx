"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useOrders } from "@/hooks/use-orders";
import { useAuth } from "@/hooks/use-auth";
import { OrderCard } from "@/components/shop/order-card";
import { Button } from "@/components/ui/button";
import { ORDER_STATUS_FLOW, ORDER_STATUS_META } from "@/lib/constants";
import { cn } from "@/lib/utils";

export default function OrdersPage() {
  const user = useAuth((s) => s.user);
  const allOrders = useOrders((s) => s.orders);
  const setOrders = useOrders((s) => s.setOrders);
  const [loading, setLoading] = useState(true);

  // Force-fetch the current user's orders on every mount so the list reflects
  // the database, not stale localStorage cache.
  useEffect(() => {
    let cancelled = false;
    if (!user?.id) {
      setLoading(false);
      return;
    }
    fetch(`/api/orders?userId=${encodeURIComponent(user.id)}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && d.data) setOrders(d.data);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id, setOrders]);

  // Show only the current user's orders.
  const currentUserId = user?.id ?? "";
  const orders = allOrders.filter((o) => o.userId === currentUserId);

  if (loading) {
    return (
      <div className="container-x flex items-center justify-center py-20">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-sakura-200 border-t-sakura-500" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="container-x flex flex-col items-center justify-center py-20 text-center">
        <span className="grid h-24 w-24 place-items-center rounded-full bg-sakura-100 text-5xl">
          🧾
        </span>
        <h1 className="mt-6 font-display text-2xl font-bold text-ink">
          ยังไม่มีคำสั่งซื้อ
        </h1>
        <p className="mt-2 max-w-sm text-sm text-ink-muted">
          เมื่อคุณสั่งซื้อสินค้า คำสั่งซื้อจะแสดงที่นี่
        </p>
        <Button variant="gradient" size="lg" className="mt-6" asChild>
          <Link href="/products">เริ่มช้อปเลย</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container-x py-8 md:py-12">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-ink md:text-4xl">
          คำสั่งซื้อของฉัน
        </h1>
        <p className="mt-2 text-sm text-ink-soft">
          ติดตามสถานะคำสั่งซื้อทั้งหมดของคุณ
        </p>
      </div>

      {/* Status flow legend */}
      <div className="mb-6 flex flex-wrap items-center gap-2 rounded-2xl border border-sakura-100/70 bg-white/70 p-3 text-xs">
        <span className="font-medium text-ink-muted">สถานะ:</span>
        {ORDER_STATUS_FLOW.map((s, i) => {
          const meta = ORDER_STATUS_META[s];
          return (
            <span key={s} className="flex items-center gap-1">
              <span
                className={cn(
                  "rounded-full px-2.5 py-1 font-semibold",
                  meta.className,
                )}
              >
                {meta.emoji} {meta.labelTh}
              </span>
              {i < ORDER_STATUS_FLOW.length - 1 && (
                <span className="text-ink-muted">→</span>
              )}
            </span>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {orders.map((order) => (
          <OrderCard key={order.id} order={order} />
        ))}
      </div>
    </div>
  );
}
