"use client";

import { useState, useEffect } from "react";
import { SafeImage as Image } from "@/components/ui/safe-image";
import { useOrders } from "@/hooks/use-orders";
import { formatTHB, formatThaiDate, cn } from "@/lib/utils";
import { AdminTable } from "@/components/admin/admin-table";
import { Badge } from "@/components/ui/badge";
import {
  ORDER_STATUS_META,
  ORDER_STATUS_FLOW,
} from "@/lib/constants";
import type { Order, OrderStatus, ProductColor } from "@/types";

/** 颜色 → 色块 CSS（管理后台订单缩略图角标用） */
function colorSwatch(color: ProductColor): string {
  switch (color) {
    case "White":
      return "bg-white";
    case "Black":
      return "bg-ink-soft";
    case "Pink":
      return "bg-sakura-400";
    case "Blue":
      return "bg-sky-400";
    case "Green":
      return "bg-emerald-400";
    case "Beige":
      return "bg-amber-200";
    default:
      return "bg-zinc-300";
  }
}

export default function AdminOrdersPage() {
  const orders = useOrders((s) => s.orders);
  const setOrders = useOrders((s) => s.setOrders);
  const updateStatusLocal = useOrders((s) => s.updateStatus);
  const [filter, setFilter] = useState<OrderStatus | "ALL">("ALL");

  // Admin view must always show every user's orders. The shared `useOrders`
  // store is persisted to localStorage and may already hold the admin's own
  // user-scoped orders, so we cannot rely on "fetch only when empty".
  // Force-refresh from /api/admin/orders on every mount instead.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/orders")
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && d.data) setOrders(d.data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [setOrders]);

  // Update order status: optimistic local update + API call to persist to DB.
  const handleUpdateStatus = (id: string, status: OrderStatus) => {
    updateStatusLocal(id, status);
    fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    }).catch((err) => console.error("Failed to persist order status:", err));
  };

  const filtered =
    filter === "ALL" ? orders : orders.filter((o) => o.status === filter);

  const counts = orders.reduce(
    (acc, o) => {
      acc[o.status] = (acc[o.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<OrderStatus, number>,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink md:text-3xl">
          จัดการคำสั่งซื้อ
        </h1>
        <p className="mt-1 text-sm text-ink-soft">
          ดูและอัปเดตสถานะคำสั่งซื้อทั้งหมด
        </p>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        <FilterChip
          active={filter === "ALL"}
          onClick={() => setFilter("ALL")}
          label={`ทั้งหมด (${orders.length})`}
        />
        {(Object.keys(ORDER_STATUS_META) as OrderStatus[]).map((s) => (
          <FilterChip
            key={s}
            active={filter === s}
            onClick={() => setFilter(s)}
            label={`${ORDER_STATUS_META[s].emoji} ${ORDER_STATUS_META[s].labelTh} (${counts[s] ?? 0})`}
          />
        ))}
      </div>

      {/* Orders table */}
      <AdminTable<Order>
        data={filtered}
        emptyMessage="ไม่มีคำสั่งซื้อในสถานะนี้"
        columns={[
          {
            key: "id",
            header: "เลขคำสั่ง",
            render: (o) => (
              <div>
                <p className="font-display text-sm font-bold text-ink">
                  {o.id}
                </p>
                <p className="text-xs text-ink-muted">
                  {formatThaiDate(o.createdAt)}
                </p>
              </div>
            ),
          },
          {
            key: "customer",
            header: "ลูกค้า",
            render: (o) => (
              <div>
                <p className="text-sm font-medium text-ink">
                  {o.customerName}
                </p>
                <p className="text-xs text-ink-muted">{o.customerPhone}</p>
              </div>
            ),
          },
          {
            key: "items",
            header: "สินค้า",
            render: (o) => (
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5">
                  {o.items.slice(0, 3).map((item) => (
                    <div
                      key={item.id}
                      className="relative h-9 w-9 overflow-hidden rounded-lg bg-sakura-50 ring-2 ring-white"
                    >
                      <Image
                        src={item.imageUrl}
                        alt={item.nameTh}
                        fill
                        sizes="36px"
                        className="object-cover"
                      />
                      {item.color && (
                        <span
                          className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-tl border border-white ${colorSwatch(item.color)}`}
                          title={item.color}
                        />
                      )}
                    </div>
                  ))}
                  {o.items.length > 3 && (
                    <span className="text-xs text-ink-muted">
                      +{o.items.length - 3}
                    </span>
                  )}
                </div>
                {/* 规格摘要，便于发货核对 */}
                {o.items.some((i) => i.color || i.size || i.optionLabel) && (
                  <div className="flex flex-wrap gap-1">
                    {o.items.slice(0, 3).map((item) =>
                      item.size || item.color || item.optionLabel ? (
                        <span
                          key={item.id}
                          className="rounded-full bg-sakura-50 px-1.5 py-0.5 text-[10px] text-ink-soft"
                        >
                          {[
                            item.color,
                            item.size && `ไซส์ ${item.size}`,
                            item.optionLabel,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      ) : null,
                    )}
                  </div>
                )}
              </div>
            ),
          },
          {
            key: "totalAmount",
            header: "ยอดรวม",
            render: (o) => (
              <span className="font-display text-sm font-bold text-sakura-600">
                {formatTHB(o.totalAmount)}
              </span>
            ),
          },
          {
            key: "status",
            header: "สถานะ",
            render: (o) => (
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-xs font-semibold",
                    ORDER_STATUS_META[o.status].className,
                  )}
                >
                  {ORDER_STATUS_META[o.status].emoji}{" "}
                  {ORDER_STATUS_META[o.status].labelTh}
                </span>
              </div>
            ),
          },
          {
            key: "actions",
            header: "อัปเดต",
            className: "w-44",
            render: (o) => {
              if (o.status === "DELIVERED" || o.status === "CANCELLED") {
                return (
                  <span className="text-xs text-ink-muted">—</span>
                );
              }
              const currentIdx = ORDER_STATUS_FLOW.indexOf(o.status);
              const nextStatus = ORDER_STATUS_FLOW[currentIdx + 1];
              return (
                <div className="flex items-center gap-1.5">
                  {nextStatus && (
                    <button
                      onClick={() => handleUpdateStatus(o.id, nextStatus)}
                      className="rounded-full bg-gradient-to-r from-sakura-500 to-peach-500 px-3 py-1.5 text-xs font-semibold text-white shadow-soft transition-all hover:brightness-105 active:scale-95"
                    >
                      → {ORDER_STATUS_META[nextStatus].labelTh}
                    </button>
                  )}
                  <button
                    onClick={() => handleUpdateStatus(o.id, "CANCELLED")}
                    className="rounded-full bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-500 transition-colors hover:bg-rose-100"
                    title="ยกเลิก"
                  >
                    ยกเลิก
                  </button>
                </div>
              );
            },
          },
        ]}
      />
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full px-4 py-2 text-sm font-medium transition-all",
        active
          ? "bg-gradient-to-r from-sakura-500 to-peach-500 text-white shadow-soft"
          : "bg-white text-ink-soft ring-1 ring-sakura-100 hover:bg-sakura-50",
      )}
    >
      {label}
    </button>
  );
}
