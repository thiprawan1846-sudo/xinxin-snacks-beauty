"use client";

import { useState } from "react";
import { SafeImage as Image } from "@/components/ui/safe-image";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ProductGalleryProps {
  images: string[];
  alt: string;
  discount?: number;
}

/**
 * 商品详情页图片画廊：
 * - 主图 + 缩略图切换
 * - 第一张默认作为封面（与后台 gallery[0] 一致）
 * - 单图时不显示缩略图列表
 * - 缩略图点击切换主图；当前选中项有边框高亮
 */
export function ProductGallery({ images, alt, discount = 0 }: ProductGalleryProps) {
  const safeImages = images.length > 0 ? images : ["/placeholder.svg"];
  const [active, setActive] = useState(0);

  return (
    <div className="space-y-3">
      {/* 主图 */}
      <div className="relative aspect-square overflow-hidden rounded-3xl border border-sakura-100/70 bg-white shadow-soft">
        <Image
          key={safeImages[active]}
          src={safeImages[active]}
          alt={`${alt} - ${active + 1}`}
          fill
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority={active === 0}
          className="object-cover transition-opacity duration-300"
        />
        {discount > 0 && (
          <Badge
            variant="solid"
            className="absolute left-4 top-4 shadow-soft-lg"
          >
            -{discount}%
          </Badge>
        )}
        {/* 计数器：多图时显示当前序号 */}
        {safeImages.length > 1 && (
          <span className="absolute bottom-3 right-3 rounded-full bg-ink/60 px-2.5 py-1 text-[11px] font-medium text-white">
            {active + 1} / {safeImages.length}
          </span>
        )}
      </div>

      {/* 缩略图列表：仅多图时显示 */}
      {safeImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {safeImages.map((img, idx) => {
            const isActive = idx === active;
            return (
              <button
                key={img + idx}
                type="button"
                onClick={() => setActive(idx)}
                className={cn(
                  "relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border-2 bg-white transition-all active:scale-95",
                  isActive
                    ? "border-sakura-400 shadow-soft"
                    : "border-transparent opacity-70 hover:opacity-100",
                )}
                aria-label={`ดูรูปที่ ${idx + 1}`}
                aria-pressed={isActive}
              >
                <Image
                  src={img}
                  alt={`${alt} thumbnail ${idx + 1}`}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
