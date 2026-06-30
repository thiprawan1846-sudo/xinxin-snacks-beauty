"use client";

import { SafeImage as Image } from "@/components/ui/safe-image";
import Link from "next/link";
import { Star, Plus, Check } from "lucide-react";
import { useState } from "react";
import type { Product } from "@/types";
import { cn, formatTHB, truncate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/hooks/use-cart";

interface ProductCardProps {
  product: Product;
  className?: string;
  priority?: boolean;
}

export function ProductCard({ product, className, priority }: ProductCardProps) {
  const add = useCart((s) => s.add);
  const [added, setAdded] = useState(false);
  const soldOut = product.stock <= 0;
  // 美妆商品且配置了自定义规格：必须到详情页选择规格后才能加购
  const needsOptionSelection =
    product.category === "beauty" &&
    Array.isArray(product.options) &&
    product.options.length > 0;
  // 服饰商品有 SKU：必须到详情页选择颜色/尺码后才能加购
  const needsVariantSelection =
    product.category === "clothing" &&
    Array.isArray(product.variants) &&
    product.variants.length > 0;
  const quickAddDisabled = soldOut || needsOptionSelection || needsVariantSelection;
  const discount = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (quickAddDisabled || added) return;
    add(product, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  };

  return (
    <Link
      href={`/products/${product.id}`}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-3xl border border-sakura-100/70 bg-white/80 shadow-soft backdrop-blur-sm transition-all duration-500 hover:-translate-y-1.5 hover:shadow-float",
        className,
      )}
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-sakura-50">
        <Image
          src={product.imageUrl}
          alt={product.nameTh}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          priority={priority}
          className={cn(
            "object-cover transition-transform duration-700 ease-out group-hover:scale-110",
            soldOut && "opacity-60 grayscale",
          )}
        />

        {/* Top badges */}
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {discount > 0 && (
            <Badge variant="solid" className="shadow-soft">
              -{discount}%
            </Badge>
          )}
          {product.tags.includes("bestseller") && (
            <Badge variant="peach" className="shadow-soft">
              🔥 ขายดี
            </Badge>
          )}
        </div>

        {soldOut && (
          <div className="absolute inset-0 grid place-items-center bg-white/40 backdrop-blur-[2px]">
            <span className="rounded-full bg-ink/80 px-4 py-1.5 text-xs font-semibold text-white">
              สินค้าหมด
            </span>
          </div>
        )}

        {/* Quick add */}
        {!quickAddDisabled ? (
          <button
            onClick={handleAdd}
            aria-label="เพิ่มลงตะกร้า"
            className={cn(
              "absolute bottom-3 right-3 grid h-11 w-11 place-items-center rounded-full shadow-soft-lg transition-all duration-300 active:scale-90",
              added
                ? "bg-emerald-500 text-white"
                : "translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 bg-sakura-500 text-white hover:bg-sakura-600",
            )}
          >
            {added ? <Check className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
          </button>
        ) : (
          !soldOut && (
            // 需要选规格的商品：显示提示角标，引导用户进入详情页
            <span className="absolute bottom-3 right-3 rounded-full bg-ink/70 px-2.5 py-1 text-[10px] font-medium text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
              เลือกข้อมูลสินค้า
            </span>
          )
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-1 flex items-center gap-1 text-xs text-ink-muted">
          <Star className="h-3.5 w-3.5 fill-peach-300 text-peach-300" />
          <span className="font-semibold text-ink-soft">{product.rating}</span>
          <span>·</span>
          <span>{product.reviewCount} รีวิว</span>
        </div>

        <h3 className="line-clamp-1 font-display text-sm font-semibold text-ink">
          {product.nameTh}
        </h3>
        {/* 友好英文名（可选）：有值时以较小字体显示在主名下方 */}
        {product.englishName && (
          <p className="line-clamp-1 text-[11px] text-ink-soft/70">
            {product.englishName}
          </p>
        )}
        <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-ink-muted">
          {truncate(product.descriptionTh, 70)}
        </p>

        <div className="mt-3 flex items-end justify-between gap-2">
          <div className="flex flex-col">
            <span className="font-display text-lg font-bold text-sakura-600">
              {formatTHB(product.price)}
            </span>
            {product.originalPrice && (
              <span className="text-xs text-ink-muted line-through">
                {formatTHB(product.originalPrice)}
              </span>
            )}
          </div>
          {product.stock > 0 && product.stock <= 15 && (
            <Badge variant="outline" className="text-[10px]">
              เหลือ {product.stock}
            </Badge>
          )}
        </div>
      </div>
    </Link>
  );
}
