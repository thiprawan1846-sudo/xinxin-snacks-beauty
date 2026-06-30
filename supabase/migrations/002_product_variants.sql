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

-- 外键（同商品删除时连带删除 SKU）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ProductVariant_productId_fkey'
    ) THEN
        ALTER TABLE "ProductVariant"
            ADD CONSTRAINT "ProductVariant_productId_fkey"
            FOREIGN KEY ("productId") REFERENCES "Product"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- ── 2. CartItem 规格列 ──────────────────────────────────────
ALTER TABLE "CartItem" ADD COLUMN IF NOT EXISTS "variantId" TEXT;
ALTER TABLE "CartItem" ADD COLUMN IF NOT EXISTS "size" TEXT;
ALTER TABLE "CartItem" ADD COLUMN IF NOT EXISTS "color" TEXT;

-- 放宽原唯一约束 (cartId, productId)：同一商品不同 SKU 可同时入购物车
-- 改为 (cartId, productId, COALESCE(variantId, ''))
DROP INDEX IF EXISTS "CartItem_cartId_productId_key";
CREATE UNIQUE INDEX IF NOT EXISTS "CartItem_cartId_productId_variant_key"
    ON "CartItem"("cartId", "productId", COALESCE("variantId", ''));

-- ── 3. OrderItem 规格列（订单快照） ─────────────────────────
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "variantId" TEXT;
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "size" TEXT;
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "color" TEXT;

-- ── 4. (可选) clothing 分类 ─────────────────────────────────
-- 通过 REST/seed 插入，这里不强制；保留 idempotent 占位注释。
INSERT INTO "Category" ("id", "slug", "label", "labelTh", "emoji", "description", "descriptionTh", "gradient", "createdAt", "updatedAt")
SELECT 'cat_clothing', 'clothing', 'Clothing', 'เสื้อผ้า', '👕',
       'Cross-border trending apparel', 'เสื้อผ้าแฟชั่นข้ามแดน',
       'from-sakura-300 to-sakura-500',
       NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Category" WHERE "slug" = 'clothing');
