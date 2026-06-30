"use client";

import { useMemo, useState } from "react";
import { Minus, Plus, ShoppingBag, Check, Heart, Share2 } from "lucide-react";
import type { Product, ProductColor, ProductSize } from "@/types";
import { useCart } from "@/hooks/use-cart";
import { formatTHB } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  PRODUCT_SIZES,
  PRODUCT_COLORS,
  COLOR_META,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

interface AddToCartSectionProps {
  product: Product;
}

export function AddToCartSection({ product }: AddToCartSectionProps) {
  const add = useCart((s) => s.add);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  // 服饰规格选择状态
  const isClothing = product.category === "clothing" && product.variants && product.variants.length > 0;
  const [selectedColor, setSelectedColor] = useState<ProductColor | null>(null);
  const [selectedSize, setSelectedSize] = useState<ProductSize | null>(null);
  const [touched, setTouched] = useState(false);

  // 美妆自定义规格选择状态：仅当 product.options 非空数组时启用
  const hasBeautyOptions =
    product.category === "beauty" &&
    Array.isArray(product.options) &&
    product.options.length > 0;
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  // 从 variants 反推可选的 color / size（只展示有 SKU 的）
  const availableColors = useMemo<ProductColor[]>(() => {
    if (!product.variants) return [];
    const set = new Set<ProductColor>();
    for (const v of product.variants) {
      if (v.color) set.add(v.color);
    }
    return PRODUCT_COLORS.map((c) => c.value).filter((c) => set.has(c));
  }, [product.variants]);

  const availableSizes = useMemo<ProductSize[]>(() => {
    if (!product.variants) return [];
    const set = new Set<ProductSize>();
    for (const v of product.variants) {
      if (v.size) set.add(v.size);
    }
    return PRODUCT_SIZES.map((s) => s.value).filter((s) => set.has(s));
  }, [product.variants]);

  // 当前选中 SKU
  const selectedVariant = useMemo(() => {
    if (!product.variants || !selectedColor || !selectedSize) return null;
    return (
      product.variants.find(
        (v) => v.color === selectedColor && v.size === selectedSize,
      ) ?? null
    );
  }, [product.variants, selectedColor, selectedSize]);

  // 某个 color 在当前选中的 size 下是否有库存（用于禁用不可选 color）
  const colorHasStock = (color: ProductColor): boolean => {
    if (!selectedSize || !product.variants) {
      // 未选 size：只要任意 size 下有该 color 即可选
      return product.variants!.some((v) => v.color === color && v.stock > 0);
    }
    const v = product.variants.find(
      (vv) => vv.color === color && vv.size === selectedSize,
    );
    return v ? v.stock > 0 : false;
  };

  const sizeHasStock = (size: ProductSize): boolean => {
    if (!selectedColor || !product.variants) {
      return product.variants!.some((v) => v.size === size && v.stock > 0);
    }
    const v = product.variants.find(
      (vv) => vv.color === selectedColor && vv.size === size,
    );
    return v ? v.stock > 0 : false;
  };

  // 服饰：库存取自选中 SKU；非服饰：取 product.stock
  const effectiveStock = isClothing
    ? selectedVariant
      ? selectedVariant.stock
      : 0
    : product.stock;

  const needSelect =
    (isClothing && (!selectedColor || !selectedSize)) ||
    (hasBeautyOptions && !selectedOption);
  const soldOut = !isClothing
    ? product.stock <= 0
    : availableColors.length === 0 || availableSizes.length === 0;
  const variantSoldOut = isClothing && !needSelect && effectiveStock <= 0;

  const canAdd =
    !soldOut && !variantSoldOut && !needSelect && effectiveStock > 0 && !added;

  const handleAdd = () => {
    if (!canAdd) {
      setTouched(true);
      return;
    }
    if (isClothing && selectedVariant) {
      add(product, qty, {
        id: selectedVariant.id,
        size: selectedVariant.size,
        color: selectedVariant.color,
      });
    } else if (hasBeautyOptions && selectedOption) {
      add(product, qty, { optionLabel: selectedOption });
    } else {
      add(product, qty);
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <div className="space-y-5">
      {/* 服饰：颜色选择 */}
      {isClothing && availableColors.length > 0 && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-ink-soft">
              สี <span className="text-rose-500">*</span>
            </span>
            {selectedColor && (
              <span className="text-xs text-ink-muted">
                {COLOR_META[selectedColor].labelTh} ({selectedColor})
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {availableColors.map((color) => {
              const meta = COLOR_META[color];
              const disabled = !colorHasStock(color);
              const active = selectedColor === color;
              return (
                <button
                  key={color}
                  type="button"
                  disabled={disabled}
                  onClick={() => setSelectedColor(color)}
                  className={cn(
                    "group relative flex h-11 items-center gap-2 rounded-2xl border-2 px-3 text-sm font-medium transition-all active:scale-95",
                    "hover:shadow-soft",
                    active
                      ? "border-sakura-400 bg-sakura-50 text-sakura-700 shadow-soft"
                      : "border-sakura-100 bg-white text-ink-soft",
                    disabled && "cursor-not-allowed opacity-40 hover:shadow-none",
                  )}
                  title={meta.labelTh}
                >
                  <span
                    className={cn(
                      "h-5 w-5 rounded-full border shadow-inner",
                      meta.swatch,
                    )}
                  />
                  <span>{meta.labelTh}</span>
                  {active && (
                    <Check className="h-3.5 w-3.5 text-sakura-500" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 服饰：尺码选择 */}
      {isClothing && availableSizes.length > 0 && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-ink-soft">
              ไซส์ <span className="text-rose-500">*</span>
            </span>
            {selectedSize && (
              <span className="text-xs text-ink-muted">ไซส์ {selectedSize}</span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {availableSizes.map((size) => {
              const disabled = !sizeHasStock(size);
              const active = selectedSize === size;
              return (
                <button
                  key={size}
                  type="button"
                  disabled={disabled}
                  onClick={() => setSelectedSize(size)}
                  className={cn(
                    "grid h-11 min-w-11 place-items-center rounded-2xl border-2 px-3 text-sm font-semibold transition-all active:scale-95",
                    "hover:shadow-soft",
                    active
                      ? "border-sakura-400 bg-sakura-50 text-sakura-700 shadow-soft"
                      : "border-sakura-100 bg-white text-ink-soft",
                    disabled && "cursor-not-allowed opacity-40 hover:shadow-none",
                  )}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 必选提示 */}
      {isClothing && touched && needSelect && (
        <p className="rounded-2xl bg-rose-50 px-4 py-2 text-xs font-medium text-rose-500">
          กรุณาเลือกสีและไซส์ก่อนเพิ่มลงตะกร้า
        </p>
      )}

      {/* 服饰 SKU 缺货提示 */}
      {isClothing && !needSelect && variantSoldOut && (
        <p className="rounded-2xl bg-amber-50 px-4 py-2 text-xs font-medium text-amber-600">
          สีและไซส์นี้หมดสต็อก กรุณาเลือกใหม่
        </p>
      )}

      {/* 美妆自定义规格：仅当 product.options 非空时显示，必须选择后才能加购 */}
      {hasBeautyOptions && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-ink-soft">
              กรุณาเลือกข้อมูลสินค้า <span className="text-rose-500">*</span>
              <span className="ml-1 text-xs text-ink-muted">请选择规格</span>
            </span>
            {selectedOption && (
              <span className="text-xs text-sakura-600">{selectedOption}</span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {(product.options ?? []).map((option) => {
              const active = selectedOption === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setSelectedOption(option)}
                  className={cn(
                    "flex h-11 items-center gap-2 rounded-2xl border-2 px-4 text-sm font-medium transition-all active:scale-95",
                    "hover:shadow-soft",
                    active
                      ? "border-sakura-400 bg-sakura-50 text-sakura-700 shadow-soft"
                      : "border-sakura-100 bg-white text-ink-soft",
                  )}
                >
                  <span
                    className={cn(
                      "grid h-4 w-4 place-items-center rounded-full border-2",
                      active
                        ? "border-sakura-500 bg-sakura-500"
                        : "border-sakura-200",
                    )}
                  >
                    {active && <Check className="h-2.5 w-2.5 text-white" />}
                  </span>
                  <span>{option}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 美妆规格未选提示 */}
      {hasBeautyOptions && touched && !selectedOption && (
        <p className="rounded-2xl bg-rose-50 px-4 py-2 text-xs font-medium text-rose-500">
          กรุณาเลือกข้อมูลสินค้าก่อนเพิ่มลงตะกร้า
        </p>
      )}

      {/* 数量 */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-ink-soft">จำนวน</span>
        <div className="flex items-center rounded-full bg-sakura-50 p-1.5">
          <button
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            disabled={effectiveStock <= 0}
            className="grid h-9 w-9 place-items-center rounded-full bg-white text-ink-soft shadow-sm transition-all hover:bg-sakura-100 active:scale-90 disabled:opacity-40"
            aria-label="ลด"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-12 text-center font-display text-base font-bold text-ink">
            {qty}
          </span>
          <button
            onClick={() => setQty((q) => Math.min(effectiveStock, q + 1))}
            disabled={effectiveStock <= 0 || qty >= effectiveStock}
            className="grid h-9 w-9 place-items-center rounded-full bg-white text-ink-soft shadow-sm transition-all hover:bg-sakura-100 active:scale-90 disabled:opacity-40"
            aria-label="เพิ่ม"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <span className="text-xs text-ink-muted">
          {effectiveStock <= 0
            ? "สินค้าหมด"
            : `เหลือ ${effectiveStock} ชิ้น`}
        </span>
      </div>

      {/* 总价 */}
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
          disabled={soldOut || variantSoldOut}
        >
          {added ? (
            <>
              <Check className="h-5 w-5" /> เพิ่มแล้ว!
            </>
          ) : soldOut || variantSoldOut ? (
            "สินค้าหมด"
          ) : needSelect ? (
            <>
              <ShoppingBag className="h-5 w-5" />
              {hasBeautyOptions ? "เลือกข้อมูลสินค้า" : "เลือกสีและไซส์"}
            </>
          ) : (
            <>
              <ShoppingBag className="h-5 w-5" />
              เพิ่มลงตะกร้า
            </>
          )}
        </Button>
        <Button
          variant="secondary"
          size="lg"
          className="px-5"
          aria-label="ถูกใจ"
        >
          <Heart className="h-5 w-5" />
        </Button>
        <Button
          variant="secondary"
          size="lg"
          className="px-5"
          aria-label="แชร์"
        >
          <Share2 className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
