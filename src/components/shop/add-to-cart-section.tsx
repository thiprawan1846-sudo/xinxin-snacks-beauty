"use client";

import { useState } from "react";
import { Minus, Plus, ShoppingBag, Check, Heart, Share2 } from "lucide-react";
import type { Product } from "@/types";
import { useCart } from "@/hooks/use-cart";
import { formatTHB } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface AddToCartSectionProps {
  product: Product;
}

export function AddToCartSection({ product }: AddToCartSectionProps) {
  const add = useCart((s) => s.add);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const soldOut = product.stock <= 0;

  const handleAdd = () => {
    if (soldOut || added) return;
    add(product, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <div className="space-y-5">
      {/* Quantity */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-ink-soft">จำนวน</span>
        <div className="flex items-center rounded-full bg-sakura-50 p-1.5">
          <button
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            disabled={soldOut}
            className="grid h-9 w-9 place-items-center rounded-full bg-white text-ink-soft shadow-sm transition-all hover:bg-sakura-100 active:scale-90 disabled:opacity-40"
            aria-label="ลด"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-12 text-center font-display text-base font-bold text-ink">
            {qty}
          </span>
          <button
            onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
            disabled={soldOut || qty >= product.stock}
            className="grid h-9 w-9 place-items-center rounded-full bg-white text-ink-soft shadow-sm transition-all hover:bg-sakura-100 active:scale-90 disabled:opacity-40"
            aria-label="เพิ่ม"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <span className="text-xs text-ink-muted">
          {soldOut ? "สินค้าหมด" : `เหลือ ${product.stock} ชิ้น`}
        </span>
      </div>

      {/* Total */}
      <div className="flex items-baseline gap-2 rounded-2xl bg-sakura-50/60 p-4">
        <span className="text-xs text-ink-muted">รวมทั้งหมด</span>
        <span className="font-display text-2xl font-bold text-sakura-600">
          {formatTHB(product.price * qty)}
        </span>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          variant={added ? "secondary" : "gradient"}
          size="lg"
          className="flex-1"
          onClick={handleAdd}
          disabled={soldOut}
        >
          {added ? (
            <>
              <Check className="h-5 w-5" /> เพิ่มแล้ว!
            </>
          ) : soldOut ? (
            "สินค้าหมด"
          ) : (
            <>
              <ShoppingBag className="h-5 w-5" />
              เพิ่มลงตะกร้า
            </>
          )}
        </Button>
        <Button variant="secondary" size="lg" className="px-5" aria-label="ถูกใจ">
          <Heart className="h-5 w-5" />
        </Button>
        <Button variant="secondary" size="lg" className="px-5" aria-label="แชร์">
          <Share2 className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
