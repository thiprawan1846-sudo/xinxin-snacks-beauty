-- ══════════════════════════════════════════════════════════════
-- Migration: 多图 + 英文名 + 美妆自定义规格
-- Idempotent — safe to re-run. Paste into Supabase SQL Editor.
--
-- 1. Product: gallery TEXT[] (多图) / englishName TEXT / options JSONB (美妆自定义规格)
-- 2. CartItem: optionLabel TEXT (美妆规格快照)
-- 3. OrderItem: optionLabel TEXT / englishName TEXT (订单快照)
-- ══════════════════════════════════════════════════════════════

-- ── 1. Product 多图 / 英文名 / 美妆自定义规格 ───────────────
-- gallery 已存在则跳过；不存在则新增
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "gallery" TEXT[];

-- 英文名（可选）。与 name (英文) 区分：englishName 用于显示更友好的英文标签，
-- name 字段保留为后台管理用英文标识。
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "englishName" TEXT;

-- 美妆自定义规格（string 数组的 JSON 表示）。
-- 例：["04 乌龙冻","03 蔷薇冻","05 奶杏色"]
-- 空值/[] 表示该商品没有自定义规格（用户无需选择即可加购）。
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "options" JSONB;

-- ── 2. CartItem: 美妆规格快照 ───────────────────────────────
ALTER TABLE "CartItem" ADD COLUMN IF NOT EXISTS "optionLabel" TEXT;

-- ── 3. OrderItem: 美妆规格快照 + 英文名快照 ─────────────────
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "optionLabel" TEXT;
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "englishName" TEXT;

-- ── 4. 回填 gallery：旧商品把 imageUrl 作为唯一一张图 ───────
-- 仅当 gallery IS NULL 时填充，避免覆盖已有数据。
UPDATE "Product"
SET "gallery" = ARRAY["imageUrl"]
WHERE "gallery" IS NULL AND "imageUrl" IS NOT NULL;
