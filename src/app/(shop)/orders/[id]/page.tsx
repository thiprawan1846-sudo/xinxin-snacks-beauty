"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { SafeImage as Image } from "@/components/ui/safe-image";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Phone, User } from "lucide-react";
import { useOrders } from "@/hooks/use-orders";
import { formatTHB, formatThaiDate } from "@/lib/utils";
import { ORDER_STATUS_FLOW, ORDER_STATUS_META } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { Order } from "@/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function OrderDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const storeOrder = useOrders((s) => s.orders.find((o) => o.id === id));
  const createOrder = useOrders((s) => s.create);
  const [order, setOrder] = useState<Order | undefined>(storeOrder);
  const [loading, setLoading] = useState(!storeOrder);

  // Always fetch the single order from the API so the page works even after a
  // hard refresh (when localStorage may not have this order cached).
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/orders/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (d.data) {
          setOrder(d.data);
          // Keep the store in sync so /orders list shows it too.
          createOrder(d.data);
        } else {
          setOrder(undefined);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, createOrder]);

  if (loading) {
    return (
      <div className="container-x flex items-center justify-center py-20">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-sakura-200 border-t-sakura-500" />
      </div>
    );
  }

  if (!order) notFound();

  const status = ORDER_STATUS_META[order.status];
  const currentStep = ORDER_STATUS_FLOW.indexOf(order.status);

  return (
    <div className="container-x py-8 md:py-12">
      <Link
        href="/orders"
        className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-sakura-600 hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        กลับหน้าคำสั่งซื้อ
      </Link>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main */}
        <div className="space-y-6 lg:col-span-2">
          {/* Header */}
          <div className="rounded-3xl border border-sakura-100/70 bg-white/80 p-6 shadow-soft backdrop-blur-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs text-ink-muted">เลขคำสั่งซื้อ</p>
                <h1 className="font-display text-2xl font-bold text-ink">
                  {order.id}
                </h1>
                <p className="mt-1 text-xs text-ink-muted">
                  สั่งซื้อเมื่อ {formatThaiDate(order.createdAt)}
                </p>
              </div>
              <span
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm font-semibold",
                  status.className,
                )}
              >
                {status.emoji} {status.labelTh}
              </span>
            </div>

            {/* Status tracker */}
            {order.status !== "CANCELLED" && (
              <div className="mt-6">
                <div className="flex justify-between">
                  {ORDER_STATUS_FLOW.map((s, i) => {
                    const meta = ORDER_STATUS_META[s];
                    const done = i <= currentStep;
                    return (
                      <div
                        key={s}
                        className="flex flex-1 flex-col items-center text-center"
                      >
                        <div className="flex w-full items-center">
                          <span
                            className={cn(
                              "h-1 flex-1 rounded-full",
                              i === 0
                                ? "bg-transparent"
                                : done
                                  ? "bg-sakura-400"
                                  : "bg-sakura-100",
                            )}
                          />
                          <span
                            className={cn(
                              "grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm transition-colors",
                              done
                                ? "bg-sakura-500 text-white shadow-soft"
                                : "bg-sakura-50 text-ink-muted",
                            )}
                          >
                            {meta.emoji}
                          </span>
                          <span
                            className={cn(
                              "h-1 flex-1 rounded-full",
                              i === ORDER_STATUS_FLOW.length - 1
                                ? "bg-transparent"
                                : i < currentStep
                                  ? "bg-sakura-400"
                                  : "bg-sakura-100",
                            )}
                          />
                        </div>
                        <span
                          className={cn(
                            "mt-2 text-[11px] font-medium",
                            done ? "text-sakura-600" : "text-ink-muted",
                          )}
                        >
                          {meta.labelTh}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Items */}
          <div className="overflow-hidden rounded-3xl border border-sakura-100/70 bg-white/80 shadow-soft backdrop-blur-sm">
            <div className="border-b border-sakura-100/70 px-6 py-4">
              <h2 className="font-display text-lg font-semibold text-ink">
                สินค้าในคำสั่งซื้อ ({order.items.length})
              </h2>
            </div>
            <div className="divide-y divide-sakura-100/70">
              {order.items.map((item) => (
                <div key={item.id} className="flex gap-4 px-6 py-4">
                  <Link
                    href={`/products/${item.productId}`}
                    className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-sakura-50"
                  >
                    <Image
                      src={item.imageUrl}
                      alt={item.nameTh}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </Link>
                  <div className="flex flex-1 flex-col">
                    <Link
                      href={`/products/${item.productId}`}
                      className="line-clamp-1 font-display text-sm font-semibold text-ink hover:text-sakura-600"
                    >
                      {item.nameTh}
                    </Link>
                    <p className="text-xs text-ink-muted">{item.name}</p>
                    {/* 英文名快照（如果有） */}
                    {item.englishName && (
                      <p className="text-[11px] text-ink-soft/70">
                        {item.englishName}
                      </p>
                    )}
                    {(item.color || item.size || item.optionLabel) && (
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        {item.color && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-sakura-50 px-2 py-0.5 text-[11px] font-medium text-ink-soft">
                            สี {item.color}
                          </span>
                        )}
                        {item.size && (
                          <span className="rounded-full bg-sakura-50 px-2 py-0.5 text-[11px] font-medium text-ink-soft">
                            ไซส์ {item.size}
                          </span>
                        )}
                        {item.optionLabel && (
                          <span className="rounded-full bg-peach-100 px-2 py-0.5 text-[11px] font-medium text-peach-600">
                            {item.optionLabel}
                          </span>
                        )}
                      </div>
                    )}
                    <div className="mt-auto flex items-center justify-between">
                      <span className="text-xs text-ink-muted">
                        จำนวน {item.quantity} ชิ้น
                      </span>
                      <span className="font-display text-sm font-bold text-sakura-600">
                        {formatTHB(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Summary */}
          <div className="rounded-3xl border border-sakura-100/70 bg-white/80 p-6 shadow-soft backdrop-blur-sm">
            <h2 className="font-display text-lg font-semibold text-ink">
              สรุปยอดชำระ
            </h2>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between text-ink-soft">
                <span>ยอดสินค้า</span>
                <span>{formatTHB(order.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-ink-soft">
                <span>ค่าจัดส่ง</span>
                <span className="font-semibold text-emerald-600">ฟรี</span>
              </div>
              <div className="flex justify-between border-t border-sakura-100/70 pt-3">
                <span className="font-display font-semibold text-ink">
                  ยอดรวม
                </span>
                <span className="font-display text-xl font-bold text-sakura-600">
                  {formatTHB(order.totalAmount)}
                </span>
              </div>
            </div>
            <p className="mt-4 rounded-xl bg-sakura-50/60 p-3 text-center text-xs text-ink-muted">
              💵 เก็บเงินปลายทาง (COD)
            </p>
          </div>

          {/* Shipping info */}
          <div className="rounded-3xl border border-sakura-100/70 bg-white/80 p-6 shadow-soft backdrop-blur-sm">
            <h2 className="font-display text-lg font-semibold text-ink">
              ที่อยู่จัดส่ง
            </h2>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <User className="mt-0.5 h-4 w-4 shrink-0 text-sakura-500" />
                <span className="text-ink-soft">{order.customerName}</span>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-sakura-500" />
                <span className="text-ink-soft">{order.customerPhone}</span>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-sakura-500" />
                <span className="text-ink-soft">{order.customerAddress}</span>
              </div>
            </div>
          </div>

          <Button variant="secondary" className="w-full" asChild>
            <Link href="/products">ช้อปต่อ</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
