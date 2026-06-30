/**
 * Seed clothing sample products + SKU variants via Supabase REST API.
 *
 * Prerequisites:
 *   - Migration 002_product_variants.sql applied (ProductVariant table exists)
 *   - 'clothing' category exists (id: cat_clothing)
 *
 * Run:
 *   npx tsx prisma/seed-clothing-variants.ts
 *
 * Idempotent: deletes existing variants for the target products first.
 */
import { readFileSync } from "fs";
import { resolve } from "path";

// Load .env
try {
  const content = readFileSync(resolve(process.cwd(), ".env"), "utf8");
  for (const line of content.split("\n")) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*"?(.*?)"?\s*$/i);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch {
  /* noop */
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const headers: Record<string, string> = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  "Content-Type": "application/json",
};

async function restDelete(filter: string) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/ProductVariant?${filter}`,
    { method: "DELETE", headers },
  );
  return res.ok;
}

async function restInsert<T>(rows: unknown[]): Promise<T[]> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/ProductVariant`, {
    method: "POST",
    headers: { ...headers, Prefer: "return=representation" },
    body: JSON.stringify(rows),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`POST ProductVariant failed: ${res.status} ${text}`);
  }
  return (await res.json()) as T[];
}

// ──────────── 服饰示例商品（如 DB 已存在则保留，仅补 SKU） ────────────
// 这里直接使用 DB 中已有的 prod_clothing_01..05 的 id（上一步已确认存在）。
// 若不存在，会先插入基础商品。
interface SeedProduct {
  id: string;
  name: string;
  nameTh: string;
  description: string;
  descriptionTh: string;
  price: number;
  stock: number;
  imageUrl: string;
  brand: string;
  tags: string[];
  rating: number;
  reviewCount: number;
}

const seedProducts: SeedProduct[] = [
  {
    id: "prod_clothing_01",
    name: "Oversize T-Shirt",
    nameTh: "เสื้อยืด Oversize",
    description: "韩版 Oversize T恤，宽松版型，纯棉面料，男女同款，搭配裙装裤装都好看。",
    descriptionTh: "เสื้อยืดโอเวอร์ไซส์สไตล์เกาหลี ทรงหลวม ผ้าคอตตอน 100% ใส่ได้ทั้งชายหญิง แมทช์กับกระโปรงหรือกางเกงก็เข้า",
    price: 290,
    stock: 86,
    imageUrl:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80",
    brand: "XinXin Apparel",
    tags: ["tshirt", "oversize", "unisex"],
    rating: 4.8,
    reviewCount: 156,
  },
  {
    id: "prod_clothing_02",
    name: "Hoodie",
    nameTh: "เสื้อฮู้ด",
    description: "加绒连帽卫衣，秋冬保暖必备，内里抓绒，柔软亲肤，宽松潮流。",
    descriptionTh: "เสื้อฮู้ดผ้าฟลีซอบอุ่น สำหรับหนาว-ปลายฝน ข้างในนุ่มสบาย ทรงหลวมทรงเทรนด์",
    price: 590,
    stock: 78,
    imageUrl:
      "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=800&q=80",
    brand: "XinXin Apparel",
    tags: ["hoodie", "winter", "fleece"],
    rating: 4.7,
    reviewCount: 203,
  },
  {
    id: "prod_clothing_03",
    name: "Korean Style Skirt",
    nameTh: "กระโปรงสไตล์เกาหลี",
    description: "韩版高腰半身裙，A字版型显瘦，垂感面料，日常通勤百搭。",
    descriptionTh: "กระโปรงเอวสูงสไตล์เกาหลี ทรง A ช่วยให้ดูผอม ผ้าเนื้อเลื่อน ใส่ไปทำงานหรือเที่ยวได้ทุกวัน",
    price: 450,
    stock: 62,
    imageUrl:
      "https://images.unsplash.com/photo-1583496661160-fb5886a13d44?auto=format&fit=crop&w=800&q=80",
    brand: "XinXin Apparel",
    tags: ["skirt", "korean", "office"],
    rating: 4.6,
    reviewCount: 89,
  },
  {
    id: "prod_clothing_04",
    name: "Denim Jeans",
    nameTh: "กางเกงยีนส์",
    description: "直筒牛仔裤，高腰显瘦，弹力面料不勒腿，经典水洗蓝。",
    descriptionTh: "กางเกงยีนส์ทรงตรง เอวสูงช่วยให้ดูผอม ผ้ายืดหน่อยๆ ใส่สบาย สีฟ้าซักพร้อมสวมใส่",
    price: 690,
    stock: 95,
    imageUrl:
      "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=800&q=80",
    brand: "XinXin Apparel",
    tags: ["jeans", "denim", "highwaist"],
    rating: 4.7,
    reviewCount: 134,
  },
  {
    id: "prod_clothing_05",
    name: "Floral Dress",
    nameTh: "ชุดเดรสลายดอก",
    description: "韩系碎花连衣裙，收腰显瘦，飘逸雪纺，春夏约会必备。",
    descriptionTh: "เดรสลายดอกสไตล์เกาหลี รวบเอวดูผอม ผ้าชิฟฟ่งพลิ้ว เหมาะกับนัดเดทฤดูร้อน",
    price: 790,
    stock: 54,
    imageUrl:
      "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=80",
    brand: "XinXin Apparel",
    tags: ["dress", "floral", "summer"],
    rating: 4.9,
    reviewCount: 178,
  },
];

// SKU 配置：每个商品 3 颜色 × 4 尺码 = 12 个 SKU
const COLORS = ["White", "Pink", "Black"] as const;
const SIZES = ["S", "M", "L", "XL"] as const;

// 给每个商品生成不同库存（部分 SKU 低库存以体现独立库存管理）
function genStock(productId: string, color: string, size: string): number {
  if (color === "Pink" && size === "L") return 8; // 用户示例的 "Pink + L 库存：8"
  if (color === "Pink" && size === "M") return 20; // 用户示例的 "Pink + M 库存：20"
  if (color === "Black" && size === "M") return 15; // 用户示例的 "Black + M 库存：15"
  // 其它组合：按 productId 微调
  const base: Record<string, number> = {
    prod_clothing_01: 30,
    prod_clothing_02: 22,
    prod_clothing_03: 18,
    prod_clothing_04: 25,
    prod_clothing_05: 12,
  };
  return (base[productId] ?? 18) + (size === "S" ? 2 : 0);
}

async function ensureProduct(p: SeedProduct) {
  // 用 upsert (Prefer: resolution=merge-duplicates) 写入；要求 id 主键冲突时合并
  const now = new Date().toISOString();
  const payload = {
    id: p.id,
    name: p.name,
    nameTh: p.nameTh,
    description: p.description,
    descriptionTh: p.descriptionTh,
    categoryId: "cat_clothing",
    price: p.price,
    stock: p.stock,
    imageUrl: p.imageUrl,
    tags: p.tags,
    status: "ACTIVE",
    rating: p.rating,
    reviewCount: p.reviewCount,
    brand: p.brand,
    isFeatured: p.id === "prod_clothing_01" || p.id === "prod_clothing_05",
    isHot: p.id === "prod_clothing_02",
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
  };
  const res = await fetch(`${SUPABASE_URL}/rest/v1/Product`, {
    method: "POST",
    headers: {
      ...headers,
      Prefer: "return=representation,resolution=merge-duplicates",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`upsert Product ${p.id} failed: ${res.status} ${text}`);
  }
}

async function seedVariantsFor(p: SeedProduct) {
  // 1. 清旧 SKU
  await restDelete(`productId=eq.${p.id}`);

  // 2. 生成新 SKU
  const now = new Date().toISOString();
  const rows = [];
  let totalStock = 0;
  for (const color of COLORS) {
    for (const size of SIZES) {
      const stock = genStock(p.id, color, size);
      totalStock += stock;
      rows.push({
        id: crypto.randomUUID(),
        productId: p.id,
        size,
        color,
        stock,
        priceOverride: null,
        sku: `${p.id}_${color}_${size}`,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  // 3. 写入
  const inserted = await restInsert(rows);
  console.log(
    `  ✓ ${p.id} (${p.nameTh}) — ${inserted.length} SKUs, total stock ${totalStock}`,
  );
}

async function main() {
  console.log("👕 Seeding clothing sample products + SKUs...\n");

  // 确保分类存在
  const catRes = await fetch(
    `${SUPABASE_URL}/rest/v1/Category?select=id&slug=eq.clothing`,
    { headers },
  );
  const catJson = (await catRes.json()) as { id: string }[];
  if (catJson.length === 0) {
    console.log("  + inserting clothing category...");
    const now = new Date().toISOString();
    await fetch(`${SUPABASE_URL}/rest/v1/Category`, {
      method: "POST",
      headers: { ...headers, Prefer: "return=representation" },
      body: JSON.stringify({
        id: "cat_clothing",
        slug: "clothing",
        label: "Clothing",
        labelTh: "เสื้อผ้า",
        emoji: "👕",
        description: "Cross-border trending apparel",
        descriptionTh: "เสื้อผ้าแฟชั่นข้ามแดน",
        gradient: "from-sakura-300 to-sakura-500",
        createdAt: now,
        updatedAt: now,
      }),
    });
  }

  // 1. upsert 商品
  console.log("  • Upserting products...");
  for (const p of seedProducts) {
    await ensureProduct(p);
  }

  // 2. 写 SKU
  console.log("  • Writing SKUs...");
  for (const p of seedProducts) {
    await seedVariantsFor(p);
  }

  console.log("\n✨ Done. Sample clothing products + SKUs ready.");
  console.log(`   ${seedProducts.length} products × ${COLORS.length} colors × ${SIZES.length} sizes = ${seedProducts.length * COLORS.length * SIZES.length} SKUs`);
}

main().catch((e) => {
  console.error("❌ Seed failed:", e.message);
  process.exit(1);
});
