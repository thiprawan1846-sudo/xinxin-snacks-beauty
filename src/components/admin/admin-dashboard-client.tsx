"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  Package,
  Boxes,
  ClipboardList,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { useProducts } from "@/hooks/use-products";
import { useOrders } from "@/hooks/use-orders";
import { formatTHB } from "@/lib/utils";
import { ORDER_STATUS_META, LOW_STOCK_THRESHOLD } from "@/lib/constants";

/**
 * Client-side admin dashboard body: stats, recent orders, low-stock alerts,
 * quick actions. Kept as a client component because it reads from the
 * hydrated zustand stores (products/orders). The surrounding `admin/page.tsx`
 * is a server component that fetches the featured-product hero images.
 */
export function AdminDashboardClient() {
  const products = useProducts((s) => s.products);
  const setProducts = useProducts((s) => s.setProducts);
  const orders = useOrders((s) => s.orders);
  const setOrders = useOrders((s) => s.setOrders);

  // Admin views must always reflect the full DB state. The shared stores are
  // persisted to localStorage and may already hold user-scoped data, so we
  // force-refresh from the admin endpoints on every mount instead of relying
  // on useHydrate's "fetch only when empty" behavior.
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch("/api/admin/products").then((r) => r.json()),
      fetch("/api/admin/orders").then((r) => r.json()),
    ])
      .then(([p, o]) => {
        if (cancelled) return;
        if (p.data) setProducts(p.data);
        if (o.data) setOrders(o.data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [setProducts, setOrders]);

  const totalRevenue = orders
    .filter((o) => o.status !== "CANCELLED")
    .reduce((sum, o) => sum + o.totalAmount, 0);
  const pendingOrders = orders.filter((o) => o.status === "PENDING").length;
  const lowStock = products.filter(
    (p) => p.stock > 0 && p.stock <= LOW_STOCK_THRESHOLD,
  );
  const outOfStock = products.filter((p) => p.stock === 0);
  const totalStock = products.reduce((sum, p) => sum + p.stock, 0);

  const stats = [
    {
      label: "ยอดขายรวม",
      value: formatTHB(totalRevenue),
      icon: TrendingUp,
      gradient: "from-sakura-400 to-sakura-500",
      hint: `จาก ${orders.length} คำสั่งซื้อ`,
    },
    {
      label: "คำสั่งซื้อรอดำเนินการ",
      value: String(pendingOrders),
      icon: ClipboardList,
      gradient: "from-peach-300 to-peach-500",
      hint: "ต้องยืนยัน",
    },
    {
      label: "สินค้าทั้งหมด",
      value: String(products.length),
      icon: Package,
      gradient: "from-violet-400 to-sakura-400",
      hint: `${totalStock} ชิ้นในสต็อก`,
    },
    {
      label: "สต็อกต่ำ / หมด",
      value: `${lowStock.length} / ${outOfStock.length}`,
      icon: AlertTriangle,
      gradient: "from-amber-400 to-rose-400",
      hint: "ต้องเติมสต็อก",
    },
  ];

  const recentOrders = orders.slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="overflow-hidden rounded-3xl border border-sakura-100/70 bg-white/80 p-5 shadow-soft backdrop-blur-sm transition-all hover:shadow-float"
          >
            <div className="flex items-center justify-between">
              <span
                className={`grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br ${stat.gradient} text-white shadow-soft`}
              >
                <stat.icon className="h-5 w-5" />
              </span>
            </div>
            <p className="mt-4 font-display text-2xl font-bold text-ink">
              {stat.value}
            </p>
            <p className="text-sm font-medium text-ink-soft">{stat.label}</p>
            <p className="mt-1 text-xs text-ink-muted">{stat.hint}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent orders */}
        <div className="lg:col-span-2">
          <div className="overflow-hidden rounded-3xl border border-sakura-100/70 bg-white/80 shadow-soft backdrop-blur-sm">
            <div className="flex items-center justify-between border-b border-sakura-100/70 px-5 py-4">
              <h2 className="font-display text-lg font-semibold text-ink">
                คำสั่งซื้อล่าสุด
              </h2>
              <Link
                href="/admin/orders"
                className="text-xs font-semibold text-sakura-600 hover:underline"
              >
                ดูทั้งหมด →
              </Link>
            </div>
            <div className="divide-y divide-sakura-50">
              {recentOrders.map((order) => {
                const meta = ORDER_STATUS_META[order.status];
                return (
                  <Link
                    key={order.id}
                    href="/admin/orders"
                    className="flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-sakura-50/50"
                  >
                    <div>
                      <p className="text-sm font-semibold text-ink">
                        {order.id}
                      </p>
                      <p className="text-xs text-ink-muted">
                        {order.customerName} · {order.items.length} รายการ
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-display text-sm font-bold text-sakura-600">
                        {formatTHB(order.totalAmount)}
                      </span>
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${meta.className}`}
                      >
                        {meta.emoji} {meta.labelTh}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Low stock alerts */}
        <div className="overflow-hidden rounded-3xl border border-sakura-100/70 bg-white/80 shadow-soft backdrop-blur-sm">
          <div className="flex items-center gap-2 border-b border-sakura-100/70 px-5 py-4">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <h2 className="font-display text-lg font-semibold text-ink">
              แจ้งเตือนสต็อก
            </h2>
          </div>
          <div className="max-h-80 divide-y divide-sakura-50 overflow-y-auto">
            {[...outOfStock, ...lowStock].slice(0, 8).map((p) => (
              <Link
                key={p.id}
                href="/admin/inventory"
                className="flex items-center justify-between px-5 py-3 transition-colors hover:bg-sakura-50/50"
              >
                <div className="min-w-0">
                  <p className="line-clamp-1 text-sm font-medium text-ink">
                    {p.nameTh}
                  </p>
                  <p className="text-xs text-ink-muted">{p.name}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                    p.stock === 0
                      ? "bg-rose-100 text-rose-600"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {p.stock === 0 ? "หมด" : `${p.stock} ชิ้น`}
                </span>
              </Link>
            ))}
            {outOfStock.length === 0 && lowStock.length === 0 && (
              <div className="px-5 py-10 text-center text-sm text-ink-muted">
                <span className="block text-3xl">✨</span>
                สต็อกปกติทั้งหมด
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            href: "/admin/products",
            icon: Package,
            label: "เพิ่มสินค้าใหม่",
            desc: "เพิ่มสินค้าลงร้าน",
          },
          {
            href: "/admin/inventory",
            icon: Boxes,
            label: "ปรับสต็อก",
            desc: "จัดการคลังสินค้า",
          },
          {
            href: "/admin/orders",
            icon: ClipboardList,
            label: "จัดการคำสั่งซื้อ",
            desc: "อัปเดตสถานะ",
          },
        ].map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="group flex items-center gap-4 rounded-3xl border border-sakura-100/70 bg-white/80 p-5 shadow-soft backdrop-blur-sm transition-all hover:-translate-y-1 hover:shadow-float"
          >
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-sakura-50 text-sakura-500 transition-colors group-hover:bg-sakura-100">
              <a.icon className="h-6 w-6" />
            </span>
            <div>
              <p className="font-display text-base font-semibold text-ink">
                {a.label}
              </p>
              <p className="text-xs text-ink-muted">{a.desc}</p>
            </div>
            <ArrowRight className="ml-auto h-4 w-4 text-ink-muted transition-transform group-hover:translate-x-1 group-hover:text-sakura-500" />
          </Link>
        ))}
      </div>
    </div>
  );
}
