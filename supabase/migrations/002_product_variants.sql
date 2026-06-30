-- ══════════════════════════════════════════════════════════════
-- Migration: 服饰商品规格 (SKU) 支持
-- Idempotent — safe to re-run. Paste into Supabase SQL Editor.
--
-- 1. 新增 ProductVariant 表（每行 = 一个 颜色×尺码 SKU）
-- 2. CartItem 增加 variantId / size / color 列
-- 3. OrderItem 增加 variantId / size / color 列（订单快照）
-- 4. 放宽 CartItem 唯一约束：同一商品不同 SKU 可同时入购物车
-- ══════════════════════════════════════════════════════════════

-- ── 1. ProductVariant 表 ────────────────────────────────────
CREATE TABLE IF NOT EXISTS "ProductVariant" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "size" TEXT,                       -- XS | S | M | L | XL | XXL (null = 不限尺码)
    "color" TEXT,                      -- White|Black|Pink|Blue|Green|Beige (null = 不限颜色)
    "stock" INTEGER NOT NULL DEFAULT 0,
    "priceOverride" DECIMAL(10,2),     -- null = 沿用 Product.price
    "sku" TEXT,                        -- 可选外部 SKU 编码
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

-- 索引
CREATE INDEX IF NOT EXISTS "ProductVariant_productId_idx"
    ON "ProductVariant"("productId");
CREATE UNIQUE INDEX IF NOT EXISTS "ProductVariant_productId_size_color_key"
    ON "ProductVariant"("productId", "size", "color");

-- ── 2. CartItem 增加 variant 列 ─────────────────────────────
ALTER TABLE "CartItem" ADD COLUMN IF NOT EXISTS "variantId" TEXT;
ALTER TABLE "CartItem" ADD COLUMN IF NOT EXISTS "size" TEXT;
ALTER TABLE "CartItem" ADD COLUMN IF NOT EXISTS "color" TEXT;

-- ── 3. OrderItem 增加 variant 列（订单快照） ────────────────
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "variantId" TEXT;
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "size" TEXT;
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "color" TEXT;

-- ── 4. 放宽 CartItem 唯一约束 ───────────────────────────────
-- 旧约束：(cartId, productId) 唯一 → 同一商品只能一行
-- 新策略：允许同一商品多行（不同 SKU 各占一行）。
-- 如果你的 DB 上有名为 CartItem_cartId_productId_key 的唯一约束，删除它：
ALTER TABLE "CartItem" DROP CONSTRAINT IF EXISTS "CartItem_cartId_productId_key";
