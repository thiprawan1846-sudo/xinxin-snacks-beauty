"use client";

import { SafeImage as Image } from "@/components/ui/safe-image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import type { CartItem } from "@/types";
import { formatTHB } from "@/lib/utils";
import { useCart } from "@/hooks/use-cart";

interface CartItemRowProps {
  item: CartItem;
  compact?: boolean;
}

export function CartItemRow({ item, compact = false }: CartItemRowProps) {
  const updateQty = useCart((s) => s.updateQty);
  const remove = useCart((s) => s.remove);

  return (
    <div className="flex gap-3 py-4">
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
        <p className="line-clamp-1 text-xs text-ink-muted">{item.name}</p>

        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="font-display text-sm font-bold text-sakura-600">
            {formatTHB(item.price)}
          </span>

          {!compact && (
            <div className="flex items-center gap-2">
              <div className="flex items-center rounded-full bg-sakura-50 p-1">
                <button
                  onClick={() => updateQty(item.productId, item.quantity - 1)}
                  className="grid h-7 w-7 place-items-center rounded-full bg-white text-ink-soft shadow-sm transition-all hover:bg-sakura-100 active:scale-90"
                  aria-label="ลดจำนวน"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="w-8 text-center text-sm font-semibold text-ink">
                  {item.quantity}
                </span>
                <button
                  onClick={() => updateQty(item.productId, item.quantity + 1)}
                  disabled={item.quantity >= item.stock}
                  className="grid h-7 w-7 place-items-center rounded-full bg-white text-ink-soft shadow-sm transition-all hover:bg-sakura-100 active:scale-90 disabled:opacity-40"
                  aria-label="เพิ่มจำนวน"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
              <button
                onClick={() => remove(item.productId)}
                className="grid h-7 w-7 place-items-center rounded-full text-ink-muted transition-colors hover:bg-rose-50 hover:text-rose-500"
                aria-label="ลบสินค้า"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
