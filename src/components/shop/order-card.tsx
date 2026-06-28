import Link from "next/link";
import { SafeImage as Image } from "@/components/ui/safe-image";
import type { Order } from "@/types";
import { formatTHB, formatThaiDate } from "@/lib/utils";
import { ORDER_STATUS_META } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";

interface OrderCardProps {
  order: Order;
}

export function OrderCard({ order }: OrderCardProps) {
  const status = ORDER_STATUS_META[order.status];
  const totalItems = order.items.reduce((n, i) => n + i.quantity, 0);

  return (
    <Link
      href={`/orders/${order.id}`}
      className="group block overflow-hidden rounded-3xl border border-sakura-100/70 bg-white/80 p-5 shadow-soft backdrop-blur-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-float"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-sm font-bold text-ink">{order.id}</p>
          <p className="mt-0.5 text-xs text-ink-muted">
            {formatThaiDate(order.createdAt)}
          </p>
        </div>
        <Badge
          className={`border ${status.className} gap-1`}
          variant="outline"
        >
          <span>{status.emoji}</span>
          {status.labelTh}
        </Badge>
      </div>

      {/* Items preview */}
      <div className="mt-4 flex items-center gap-2">
        {order.items.slice(0, 3).map((item) => (
          <div
            key={item.id}
            className="relative h-14 w-14 overflow-hidden rounded-2xl border-2 border-white bg-sakura-50 shadow-sm"
          >
            <Image
              src={item.imageUrl}
              alt={item.nameTh}
              fill
              sizes="56px"
              className="object-cover"
            />
          </div>
        ))}
        {order.items.length > 3 && (
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-sakura-50 text-xs font-semibold text-sakura-600">
            +{order.items.length - 3}
          </div>
        )}
        <div className="ml-2 text-xs text-ink-muted">
          {totalItems} ชิ้น · {order.items.length} รายการ
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-sakura-100/60 pt-3">
        <span className="text-xs text-ink-soft">ยอดรวม</span>
        <span className="font-display text-lg font-bold text-sakura-600">
          {formatTHB(order.totalAmount)}
        </span>
      </div>
    </Link>
  );
}
