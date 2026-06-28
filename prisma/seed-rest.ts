/**
 * Seed via Supabase REST API — bypasses PostgreSQL TCP connection.
 *
 * Use when sandbox blocks port 5432 but HTTPS to Supabase works.
 *
 * Prerequisites:
 *   1. Run supabase/setup.sql in Supabase SQL Editor (creates tables)
 *   2. Set SUPABASE_SERVICE_ROLE_KEY in .env
 *
 * Run:
 *   npx tsx prisma/seed-rest.ts
 */
import bcrypt from "bcryptjs";
import { readFileSync } from "fs";
import { resolve } from "path";

// Load .env manually (tsx doesn't auto-load it)
const envPath = resolve(process.cwd(), ".env");
try {
  const content = readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*"?(.*?)"?\s*$/i);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch {
  // .env optional if env vars already set
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const headers = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

async function insert(table: string, rows: unknown | unknown[], addTimestamps = true) {
  const body = Array.isArray(rows) ? rows : [rows];
  const now = new Date().toISOString();
  // Auto-fill createdAt/updatedAt (DB schema requires NOT NULL, Prisma's
  // @updatedAt only works via the client, not direct REST inserts)
  const payload = addTimestamps
    ? body.map((r: any) => ({ createdAt: now, updatedAt: now, ...r }))
    : body;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: { ...headers, Prefer: "return=representation,resolution=merge-duplicates" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`POST ${table} failed: ${res.status} ${text}`);
  }
  return res.json();
}

async function selectAll(table: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*`, {
    headers,
  });
  if (!res.ok) throw new Error(`GET ${table} failed: ${res.status}`);
  return res.json();
}

async function deleteAll(table: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=neq.xxx`, {
    method: "DELETE",
    headers,
  });
  if (!res.ok) console.warn(`DELETE ${table}: ${res.status}`);
}

async function main() {
  console.log("🌱 Seeding via Supabase REST API...\n");

  // Clean (idempotent re-run)
  console.log("  Cleaning old data...");
  await deleteAll("OrderItem");
  await deleteAll("Order");
  await deleteAll("CartItem");
  await deleteAll("Cart");
  await deleteAll("Product");
  await deleteAll("Category");
  await deleteAll("User");

  // ── Categories ──────────────────────────────────────────────
  const categories = [
    {
      id: "cat_snacks",
      slug: "snacks",
      label: "Snacks",
      labelTh: "ขนม",
      emoji: "🍪",
      description: "中国网红零食，好吃到停不下来",
      descriptionTh: "ขนมจีนยอดนิยม ทานเพลินไม่หยุด",
      gradient: "from-peach-300 to-sakura-300",
    },
    {
      id: "cat_beauty",
      slug: "beauty",
      label: "Beauty",
      labelTh: "เครื่องสำอาง",
      emoji: "💄",
      description: "小红书爆款美妆护肤精选",
      descriptionTh: "เครื่องสำอางยอดนิยมจาก Xiaohongshu",
      gradient: "from-sakura-300 to-sakura-500",
    },
    {
      id: "cat_drinks",
      slug: "drinks",
      label: "Drinks",
      labelTh: "เครื่องดื่ม",
      emoji: "🧋",
      description: "中国热门奶茶茶饮冲泡",
      descriptionTh: "ชาและเครื่องดื่มยอดนิยมจากจีน",
      gradient: "from-cream-200 to-peach-300",
    },
  ];
  await insert("Category", categories);
  console.log(`  ✓ ${categories.length} categories`);

  // ── Users ──────────────────────────────────────────────────
  const users = [
    {
      id: "user_admin",
      email: "admin@xinxin.shop",
      name: "Admin XinXin",
      role: "ADMIN",
      password: bcrypt.hashSync("admin123", 10),
    },
    {
      id: "user_customer",
      email: "customer@xinxin.shop",
      name: "คุณใบหยก",
      role: "CUSTOMER",
      password: bcrypt.hashSync("demo123", 10),
    },
  ];
  await insert("User", users);
  console.log(`  ✓ ${users.length} users (admin@xinxin.shop / customer@xinxin.shop)`);

  // ── Products ───────────────────────────────────────────────
  const products = [
    {
      id: "p_001", name: "Lay's Stax Chinese Hot Pot", nameTh: "เลย์สแต็ก รสหม้อไฟจีน",
      description: "乐事薯片罐装版，浓郁中国火锅风味，一口下去麻辣鲜香，追剧必备零食。",
      descriptionTh: "มันฝรั่งทอดกรอบจากจีน รสหม้อไฟร้อนๆ เผ็ดนิดๆ หอมเครื่องเทศจีน ทานเพลินๆ คู่กับการดูซีรีส์",
      categoryId: "cat_snacks", price: "89", originalPrice: "119", stock: 48,
      imageUrl: "https://images.unsplash.com/photo-1613919113640-25732ec5e61f?auto=format&fit=crop&w=800&q=80",
      tags: ["hot","spicy","bestseller"], rating: 4.8, reviewCount: 312,
      reason: "เพื่อนแนะนำ! ทานเพลินมาก รสหม้อไฟเผ็ดนิดๆ อร่อยจัง", status: "ACTIVE",
    },
    {
      id: "p_002", name: "White Rabbit Candy", nameTh: "ลูกกวาดกระต่ายขาว",
      description: "经典大白兔奶糖，浓郁奶香，童年回忆的味道，一包20颗装。",
      descriptionTh: "ลูกกวาดนมกระต่ายขาวคลาสสิก หอมนมเข้มข้น รสชาติตามใจจำ แพ็ค 20 ชิ้น",
      categoryId: "cat_snacks", price: "65", originalPrice: null, stock: 120,
      imageUrl: "https://images.unsplash.com/photo-1606312619070-d48b4c652a52?auto=format&fit=crop&w=800&q=80",
      tags: ["classic","milk"], rating: 4.9, reviewCount: 528, reason: null, status: "ACTIVE",
    },
    {
      id: "p_003", name: "Spicy Latiao", nameTh: "ลาเถียว เผ็ดร้อน",
      description: "卫龙辣条大面筋，香辣劲道，中国国民零食，一包根本不够吃。",
      descriptionTh: "ลาเถียวเส้นเหนียวนุ่ม เผ็ดร้อนหอมเครื่องเทศ ขนมยอดนิยมของจีน ทานไม่หยุด",
      categoryId: "cat_snacks", price: "45", originalPrice: null, stock: 200,
      imageUrl: "https://images.unsplash.com/photo-1626804475297-41608ea09aeb?auto=format&fit=crop&w=800&q=80",
      tags: ["hot","spicy","viral"], rating: 4.7, reviewCount: 1204,
      reason: "TikTok ไวรัล! ติดใจมาก เผ็ดเร้าใจ", status: "ACTIVE",
    },
    {
      id: "p_004", name: "Hawthorn Flakes", nameTh: "แฮร์ธอร์น เกล็ดฟล๊ค",
      description: "山楂片，酸酸甜甜，开胃消食，饭后来几片刚刚好。",
      descriptionTh: "เกล็ดแฮร์ธอร์น เปรี้ยวหวาน ช่วยย่อยอาหาร ทานหลังข้าวพอดี",
      categoryId: "cat_snacks", price: "39", originalPrice: null, stock: 0,
      imageUrl: "https://images.unsplash.com/photo-1599490659213-e2b9527bd087?auto=format&fit=crop&w=800&q=80",
      tags: ["sour","digestive"], rating: 4.5, reviewCount: 156, reason: null, status: "ACTIVE",
    },
    {
      id: "p_005", name: "Perfect Diary Lipstick", nameTh: "ลิปสติก Perfect Diary",
      description: "完美日记雾面哑光唇釉，丝绒质地，持色一整天，小红书爆款色号。",
      descriptionTh: "ลิปสติกเนื้อแมตต์กำมะหยี่ ติดทนนาน สียอดนิยมจาก Xiaohongshu",
      categoryId: "cat_beauty", price: "289", originalPrice: "399", stock: 35,
      imageUrl: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=800&q=80",
      tags: ["lipstick","matte","bestseller"], rating: 4.9, reviewCount: 876,
      reason: "สีสวยมาก ติดทนทั้งวัน เพื่อนถามบ่อยว่าใช้ลิปอะไร", status: "ACTIVE",
    },
    {
      id: "p_006", name: "Florasis Cushion Foundation", nameTh: "ฟอนเดชั่น Florasis",
      description: "花西子气垫BB霜，轻薄遮瑕，东方美学包装，自带补妆镜。",
      descriptionTh: "ฟอนเดชั่นกันน้ำจาก Florasis เนื้อบางเบา คลุมเครื่องหมางได้ แพ็คเกจสวยงามแบบจีนโบราณ",
      categoryId: "cat_beauty", price: "599", originalPrice: "799", stock: 22,
      imageUrl: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=800&q=80",
      tags: ["foundation","cushion","luxury"], rating: 4.8, reviewCount: 412,
      reason: "คุมมันดีมาก สีเข้ากับผิวคนไทย แนะนำเลย", status: "ACTIVE",
    },
    {
      id: "p_007", name: "Proya Tightening Serum", nameTh: "เซรั่ม Proya",
      description: "珀莱雅紧致抗皱精华液，烟酰胺+胜肽，提亮紧致一瓶搞定。",
      descriptionTh: "เซรั่มยกกระชับจาก Proya ผสม Niacinamide ช่วยกระจ่างและยกกระชับผิว",
      categoryId: "cat_beauty", price: "459", originalPrice: null, stock: 60,
      imageUrl: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80",
      tags: ["serum","anti-aging"], rating: 4.7, reviewCount: 234, reason: null, status: "ACTIVE",
    },
    {
      id: "p_008", name: "Judydoll Eyebrow Pencil", nameTh: "ดินสอเขียนคิ้ว Judydoll",
      description: "橘朵极细眉笔，0.1mm笔芯，自然毛流感，新手友好。",
      descriptionTh: "ดินสอเขียนคิ้วละเอียด 0.1mm ให้ลุคเป็นธรรมชาติ เหมาะกับมือใหม่",
      categoryId: "cat_beauty", price: "129", originalPrice: null, stock: 88,
      imageUrl: "https://images.unsplash.com/photo-1631730486572-226d1f595b68?auto=format&fit=crop&w=800&q=80",
      tags: ["eyebrow","budget"], rating: 4.6, reviewCount: 689, reason: null, status: "ACTIVE",
    },
    {
      id: "p_009", name: "Heytea Bubble Tea Kit", nameTh: "ชุดทำบับเบิ้ลที Heytea",
      description: "喜茶奶茶冲泡套装，3秒一杯，奶香浓郁，珍珠Q弹。",
      descriptionTh: "ชุดทำชานมไข่มุก Heytea ชงใน 3 วินาที หอมนมเข้ม มุกเหนียวนุ่ม",
      categoryId: "cat_drinks", price: "149", originalPrice: "199", stock: 75,
      imageUrl: "https://images.unsplash.com/photo-1525385133512-2f3bdd039054?auto=format&fit=crop&w=800&q=80",
      tags: ["bubble-tea","viral"], rating: 4.8, reviewCount: 945,
      reason: "ชงง่ายมาก รสชาติเหมือนร้านเลย ลูกสาวชอบมาก", status: "ACTIVE",
    },
    {
      id: "p_010", name: "Osmanthus Oolong Tea", nameTh: "ชาอูหลงกลิ่นออสมันธัส",
      description: "桂花乌龙茶包，冷泡热泡皆宜，清雅桂花香，一盒20包。",
      descriptionTh: "ชาอูหลงกลิ่นดอกออสมันธัส ชงเย็นร้อนได้ หอมสดชื่น กล่องละ 20 ซอง",
      categoryId: "cat_drinks", price: "179", originalPrice: null, stock: 40,
      imageUrl: "https://images.unsplash.com/photo-1597318181409-cf64d0b5d8a2?auto=format&fit=crop&w=800&q=80",
      tags: ["tea","fragrant"], rating: 4.7, reviewCount: 198, reason: null, status: "ACTIVE",
    },
    {
      id: "p_011", name: "Wanglaoji Herbal Tea", nameTh: "ชาสมุนไพร Wanglaoji",
      description: "王老吉凉茶罐装，清热解火，火锅烧烤必备搭档。",
      descriptionTh: "ชาสมุนไพรเย็น Wanglaoji ช่วยคลายร้อน คู่กับหม้อไฟและปิ้งย่าง",
      categoryId: "cat_drinks", price: "35", originalPrice: null, stock: 150,
      imageUrl: "https://images.unsplash.com/photo-1581006852262-e4307cf6283a?auto=format&fit=crop&w=800&q=80",
      tags: ["herbal","cooling"], rating: 4.4, reviewCount: 87, reason: null, status: "ACTIVE",
    },
    {
      id: "p_012", name: "Chando Rejuvenating Mask", nameTh: "มาส์กหน้า Chando",
      description: "自然堂喜马拉雅面膜，10片装，补水保湿，熬夜救星。",
      descriptionTh: "มาส์กหน้าจากหิมาลัย Chando บำรุงผิวชุ่มชื้น ช่วยผิวหลังอดนอน",
      categoryId: "cat_beauty", price: "259", originalPrice: "329", stock: 12,
      imageUrl: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=800&q=80",
      tags: ["mask","hydrating"], rating: 4.6, reviewCount: 343, reason: null, status: "ACTIVE",
    },
  ];
  await insert("Product", products);
  console.log(`  ✓ ${products.length} products`);

  // ── Orders ──────────────────────────────────────────────────
  const orders = [
    {
      id: "ORD-2026-001", userId: "user_customer", totalAmount: "313", status: "DELIVERED",
      customerName: "นภา สุขใจ", customerPhone: "081-234-5678",
      customerAddress: "123 ซอยสุขุมวิท 31 คลองตันเหนือ วัฒนา กรุงเทพฯ 10110",
      createdAt: "2026-06-10T10:30:00Z", updatedAt: "2026-06-14T16:00:00Z",
    },
    {
      id: "ORD-2026-002", userId: "user_customer", totalAmount: "418", status: "SHIPPING",
      customerName: "นภา สุขใจ", customerPhone: "081-234-5678",
      customerAddress: "123 ซอยสุขุมวิท 31 คลองตันเหนือ วัฒนา กรุงเทพฯ 10110",
      createdAt: "2026-06-20T14:15:00Z", updatedAt: "2026-06-21T09:00:00Z",
    },
    {
      id: "ORD-2026-003", userId: "user_customer", totalAmount: "298", status: "PENDING",
      customerName: "สมหญิง รักไทย", customerPhone: "089-876-5432",
      customerAddress: "45 ถนนพหลโยธิน สามเสนใน พญาไท กรุงเทพฯ 10400",
      createdAt: "2026-06-25T19:45:00Z", updatedAt: "2026-06-25T19:45:00Z",
    },
  ];
  await insert("Order", orders);
  console.log(`  ✓ ${orders.length} orders`);

  // Order items (price/name snapshots from products)
  const orderItems = [
    { id: "oi_001", orderId: "ORD-2026-001", productId: "p_001", name: "Lay's Stax Chinese Hot Pot", nameTh: "เลย์สแต็ก รสหม้อไฟจีน", quantity: 2, price: "89", imageUrl: products[0].imageUrl },
    { id: "oi_002", orderId: "ORD-2026-001", productId: "p_003", name: "Spicy Latiao", nameTh: "ลาเถียว เผ็ดร้อน", quantity: 3, price: "45", imageUrl: products[2].imageUrl },
    { id: "oi_003", orderId: "ORD-2026-002", productId: "p_005", name: "Perfect Diary Lipstick", nameTh: "ลิปสติก Perfect Diary", quantity: 1, price: "289", imageUrl: products[4].imageUrl },
    { id: "oi_004", orderId: "ORD-2026-002", productId: "p_008", name: "Judydoll Eyebrow Pencil", nameTh: "ดินสอเขียนคิ้ว Judydoll", quantity: 1, price: "129", imageUrl: products[7].imageUrl },
    { id: "oi_005", orderId: "ORD-2026-003", productId: "p_009", name: "Heytea Bubble Tea Kit", nameTh: "ชุดทำบับเบิ้ลที Heytea", quantity: 2, price: "149", imageUrl: products[8].imageUrl },
  ];
  await insert("OrderItem", orderItems, false);
  console.log(`  ✓ ${orderItems.length} order items`);

  // Verify
  const verify = await selectAll("Product");
  console.log(`\n✨ Seed complete! Verified ${verify.length} products in DB.`);
  console.log("\n  Demo accounts:");
  console.log("    admin@xinxin.shop / admin123");
  console.log("    customer@xinxin.shop / demo123");
}

main().catch((e) => {
  console.error("❌ Seed failed:", e.message);
  process.exit(1);
});
