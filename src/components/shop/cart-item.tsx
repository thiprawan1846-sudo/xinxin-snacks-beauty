"use client";

import { SafeImage as Image } from "@/components/ui/safe-image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import type { CartItem } from "@/types";
import { COLOR_META } from "@/lib/constants";
import { formatTHB } from "@/lib/utils";
import { useCart } from "@/hooks/use-cart";

interface CartItemRowProps {
  item: CartItem;
  compact?: boolean;
}

export function CartItemRow({ item, compact = false }: CartItemRowProps) {
  const updateQty = useCart((s) => s.updateQty);
  const remove = useCart((s) => s.remove);
  const colorMeta = item.color ? COLOR_META[item.color] : undefined;

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
        {/* 友好英文名快照（如果有） */}
        {item.englishName && (
          <p className="line-clamp-1 text-[11px] text-ink-soft/70">
            {item.englishName}
          </p>
        )}

        {/* 规格标签（服饰：颜色×尺码 / 美妆：自定义规格） */}
        {(item.color || item.size || item.optionLabel) && (
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {colorMeta && (
              <span className="inline-flex items-center gap-1 rounded-full bg-sakura-50 px-2 py-0.5 text-[11px] font-medium text-ink-soft">
                <span
                  className={`h-2.5 w-2.5 rounded-full border ${colorMeta.swatch}`}
                />
                {colorMeta.labelTh}
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

        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="font-display text-sm font-bold text-sakura-600">
            {formatTHB(item.price)}
          </span>

          {!compact && (
            <div className="flex items-center gap-2">
              <div className="flex items-center rounded-full bg-sakura-50 p-1">
                <button
                  onClick={() =>
                    updateQty(
                      item.productId,
                      item.quantity - 1,
                      item.variantId,
                      item.optionLabel,
                    )
                  }
                  className="grid h-7 w-7 place-items-center rounded-full bg-white text-ink-soft shadow-sm transition-all hover:bg-sakura-100 active:scale-90"
                  aria-label="ลดจำนวน"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="w-8 text-center text-sm font-semibold text-ink">
                  {item.quantity}
                </span>
                <button
                  onClick={() =>
                    updateQty(
                      item.productId,
                      item.quantity + 1,
                      item.variantId,
                      item.optionLabel,
                    )
                  }
                  disabled={item.quantity >= item.stock}
                  className="grid h-7 w-7 place-items-center rounded-full bg-white text-ink-soft shadow-sm transition-all hover:bg-sakura-100 active:scale-90 disabled:opacity-40"
                  aria-label="เพิ่มจำนวน"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
              <button
                onClick={() =>
                  remove(item.productId, item.variantId, item.optionLabel)
                }
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
