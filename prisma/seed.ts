/**
 * Seed script — populates the PostgreSQL database with mock data.
 *
 * Run after `prisma migrate dev --name init`:
 *   npm run db:seed
 *
 * Idempotent: uses upserts, safe to run multiple times.
 * Updates mock users' password hashes so login works against the DB.
 */
import { PrismaClient, Role, ProductStatus, OrderStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding XinXin Snacks & Beauty...\n");

  // ── Categories ──────────────────────────────────────────────
  const categories = [
    {
      slug: "snacks",
      label: "Snacks",
      labelTh: "ขนม",
      emoji: "🍪",
      description: "中国网红零食，好吃到停不下来",
      descriptionTh: "ขนมจีนยอดนิยม ทานเพลินไม่หยุด",
      gradient: "from-peach-300 to-sakura-300",
    },
    {
      slug: "beauty",
      label: "Beauty",
      labelTh: "เครื่องสำอาง",
      emoji: "💄",
      description: "小红书爆款美妆护肤精选",
      descriptionTh: "เครื่องสำอางยอดนิยมจาก Xiaohongshu",
      gradient: "from-sakura-300 to-sakura-500",
    },
    {
      slug: "drinks",
      label: "Drinks",
      labelTh: "เครื่องดื่ม",
      emoji: "🧋",
      description: "中国热门奶茶茶饮冲泡",
      descriptionTh: "ชาและเครื่องดื่มยอดนิยมจากจีน",
      gradient: "from-cream-200 to-peach-300",
    },
  ];

  const categoryMap: Record<string, string> = {};
  for (const c of categories) {
    const rec = await prisma.category.upsert({
      where: { slug: c.slug },
      update: c,
      create: c,
    });
    categoryMap[c.slug] = rec.id;
    console.log(`  ✓ Category: ${c.emoji} ${c.labelTh}`);
  }

  // ── Users ──────────────────────────────────────────────────
  const users = [
    {
      email: "admin@xinxin.shop",
      name: "Admin XinXin",
      role: Role.ADMIN,
      password: "admin123",
    },
    {
      email: "customer@xinxin.shop",
      name: "คุณใบหยก",
      role: Role.CUSTOMER,
      password: "demo123",
    },
  ];

  const userMap: Record<string, string> = {};
  for (const u of users) {
    const passwordHash = bcrypt.hashSync(u.password, 10);
    const rec = await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role, password: passwordHash },
      create: { ...u, password: passwordHash },
    });
    userMap[u.email] = rec.id;
    console.log(`  ✓ User: ${u.role.padEnd(8)} ${u.email}`);
  }

  // ── Products ───────────────────────────────────────────────
  // Mirror of src/data/mock.ts — keep in sync until mock is removed.
  const products = [
    {
      mockId: "p_001",
      name: "Lay's Stax Chinese Hot Pot",
      nameTh: "เลย์สแต็ก รสหม้อไฟจีน",
      description:
        "乐事薯片罐装版，浓郁中国火锅风味，一口下去麻辣鲜香，追剧必备零食。",
      descriptionTh:
        "มันฝรั่งทอดกรอบจากจีน รสหม้อไฟร้อนๆ เผ็ดนิดๆ หอมเครื่องเทศจีน ทานเพลินๆ คู่กับการดูซีรีส์",
      categorySlug: "snacks",
      price: 89,
      originalPrice: 119,
      stock: 48,
      imageUrl:
        "https://images.unsplash.com/photo-1613919113640-25732ec5e61f?auto=format&fit=crop&w=800&q=80",
      tags: ["hot", "spicy", "bestseller"],
      rating: 4.8,
      reviewCount: 312,
      reason: "เพื่อนแนะนำ! ทานเพลินมาก รสหม้อไฟเผ็ดนิดๆ อร่อยจัง",
    },
    {
      mockId: "p_002",
      name: "White Rabbit Candy",
      nameTh: "ลูกกวาดกระต่ายขาว",
      description: "经典大白兔奶糖，浓郁奶香，童年回忆的味道，一包20颗装。",
      descriptionTh:
        "ลูกกวาดนมกระต่ายขาวคลาสสิก หอมนมเข้มข้น รสชาติตามใจจำ แพ็ค 20 ชิ้น",
      categorySlug: "snacks",
      price: 65,
      stock: 120,
      imageUrl:
        "https://images.unsplash.com/photo-1606312619070-d48b4c652a52?auto=format&fit=crop&w=800&q=80",
      tags: ["classic", "milk"],
      rating: 4.9,
      reviewCount: 528,
      reason: "ความทรงจำวัยเด็ก! หวานนุ่มกลิ่นนมเข้ม ลูกสาวชอบมาก",
    },
    {
      mockId: "p_003",
      name: "Spicy Latiao",
      nameTh: "ลาเถียว เผ็ดร้อน",
      description:
        "卫龙辣条大面筋，香辣劲道，中国国民零食，一包根本不够吃。",
      descriptionTh:
        "ลาเถียวเส้นเหนียวนุ่ม เผ็ดร้อนหอมเครื่องเทศ ขนมยอดนิยมของจีน ทานไม่หยุด",
      categorySlug: "snacks",
      price: 45,
      stock: 200,
      imageUrl:
        "https://images.unsplash.com/photo-1626804475297-41608ea09aeb?auto=format&fit=crop&w=800&q=80",
      tags: ["hot", "spicy", "viral"],
      rating: 4.7,
      reviewCount: 1204,
      reason: "TikTok ไวรัล! ติดใจมาก เผ็ดเร้าใจ",
    },
    {
      mockId: "p_004",
      name: "Hawthorn Flakes",
      nameTh: "แฮร์ธอร์น เกล็ดฟล๊ค",
      description: "山楂片，酸酸甜甜，开胃消食，饭后来几片刚刚好。",
      descriptionTh: "เกล็ดแฮร์ธอร์น เปรี้ยวหวาน ช่วยย่อยอาหาร ทานหลังข้าวพอดี",
      categorySlug: "snacks",
      price: 39,
      stock: 0,
      imageUrl:
        "https://images.unsplash.com/photo-1599490659213-e2b9527bd087?auto=format&fit=crop&w=800&q=80",
      tags: ["sour", "digestive"],
      rating: 4.5,
      reviewCount: 156,
    },
    {
      mockId: "p_005",
      name: "Perfect Diary Lipstick",
      nameTh: "ลิปสติก Perfect Diary",
      description:
        "完美日记雾面哑光唇釉，丝绒质地，持色一整天，小红书爆款色号。",
      descriptionTh:
        "ลิปสติกเนื้อแมตต์กำมะหยี่ ติดทนนาน สียอดนิยมจาก Xiaohongshu",
      categorySlug: "beauty",
      price: 289,
      originalPrice: 399,
      stock: 35,
      imageUrl:
        "https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=800&q=80",
      tags: ["lipstick", "matte", "bestseller"],
      rating: 4.9,
      reviewCount: 876,
      reason: "สีสวยมาก ติดทนทั้งวัน เพื่อนถามบ่อยว่าใช้ลิปอะไร",
    },
    {
      mockId: "p_006",
      name: "Florasis Cushion Foundation",
      nameTh: "ฟอนเดชั่น Florasis",
      description:
        "花西子气垫BB霜，轻薄遮瑕，东方美学包装，自带补妆镜。",
      descriptionTh:
        "ฟอนเดชั่นกันน้ำจาก Florasis เนื้อบางเบา คลุมเครื่องหมางได้ แพ็คเกจสวยงามแบบจีนโบราณ",
      categorySlug: "beauty",
      price: 599,
      originalPrice: 799,
      stock: 22,
      imageUrl:
        "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=800&q=80",
      tags: ["foundation", "cushion", "luxury"],
      rating: 4.8,
      reviewCount: 412,
      reason: "คุมมันดีมาก สีเข้ากับผิวคนไทย แนะนำเลย",
    },
    {
      mockId: "p_007",
      name: "Proya Tightening Serum",
      nameTh: "เซรั่ม Proya",
      description:
        "珀莱雅紧致抗皱精华液，烟酰胺+胜肽，提亮紧致一瓶搞定。",
      descriptionTh:
        "เซรั่มยกกระชับจาก Proya ผสม Niacinamide ช่วยกระจ่างและยกกระชับผิว",
      categorySlug: "beauty",
      price: 459,
      stock: 60,
      imageUrl:
        "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80",
      tags: ["serum", "anti-aging"],
      rating: 4.7,
      reviewCount: 234,
    },
    {
      mockId: "p_008",
      name: "Judydoll Eyebrow Pencil",
      nameTh: "ดินสอเขียนคิ้ว Judydoll",
      description: "橘朵极细眉笔，0.1mm笔芯，自然毛流感，新手友好。",
      descriptionTh:
        "ดินสอเขียนคิ้วละเอียด 0.1mm ให้ลุคเป็นธรรมชาติ เหมาะกับมือใหม่",
      categorySlug: "beauty",
      price: 129,
      stock: 88,
      imageUrl:
        "https://images.unsplash.com/photo-1631730486572-226d1f595b68?auto=format&fit=crop&w=800&q=80",
      tags: ["eyebrow", "budget"],
      rating: 4.6,
      reviewCount: 689,
    },
    {
      mockId: "p_009",
      name: "Heytea Bubble Tea Kit",
      nameTh: "ชุดทำบับเบิ้ลที Heytea",
      description: "喜茶奶茶冲泡套装，3秒一杯，奶香浓郁，珍珠Q弹。",
      descriptionTh:
        "ชุดทำชานมไข่มุก Heytea ชงใน 3 วินาที หอมนมเข้ม มุกเหนียวนุ่ม",
      categorySlug: "drinks",
      price: 149,
      originalPrice: 199,
      stock: 75,
      imageUrl:
        "https://images.unsplash.com/photo-1525385133512-2f3bdd039054?auto=format&fit=crop&w=800&q=80",
      tags: ["bubble-tea", "viral"],
      rating: 4.8,
      reviewCount: 945,
      reason: "ชงง่ายมาก รสชาติเหมือนร้านเลย ลูกสาวชอบมาก",
    },
    {
      mockId: "p_010",
      name: "Osmanthus Oolong Tea",
      nameTh: "ชาอูหลงกลิ่นออสมันธัส",
      description: "桂花乌龙茶包，冷泡热泡皆宜，清雅桂花香，一盒20包。",
      descriptionTh:
        "ชาอูหลงกลิ่นดอกออสมันธัส ชงเย็นร้อนได้ หอมสดชื่น กล่องละ 20 ซอง",
      categorySlug: "drinks",
      price: 179,
      stock: 40,
      imageUrl:
        "https://images.unsplash.com/photo-1597318181409-cf64d0b5d8a2?auto=format&fit=crop&w=800&q=80",
      tags: ["tea", "fragrant"],
      rating: 4.7,
      reviewCount: 198,
    },
    {
      mockId: "p_011",
      name: "Wanglaoji Herbal Tea",
      nameTh: "ชาสมุนไพร Wanglaoji",
      description: "王老吉凉茶罐装，清热解火，火锅烧烤必备搭档。",
      descriptionTh:
        "ชาสมุนไพรเย็น Wanglaoji ช่วยคลายร้อน คู่กับหม้อไฟและปิ้งย่าง",
      categorySlug: "drinks",
      price: 35,
      stock: 150,
      imageUrl:
        "https://images.unsplash.com/photo-1581006852262-e4307cf6283a?auto=format&fit=crop&w=800&q=80",
      tags: ["herbal", "cooling"],
      rating: 4.4,
      reviewCount: 87,
    },
    {
      mockId: "p_012",
      name: "Chando Rejuvenating Mask",
      nameTh: "มาส์กหน้า Chando",
      description: "自然堂喜马拉雅面膜，10片装，补水保湿，熬夜救星。",
      descriptionTh:
        "มาส์กหน้าจากหิมาลัย Chando บำรุงผิวชุ่มชื้น ช่วยผิวหลังอดนอน",
      categorySlug: "beauty",
      price: 259,
      originalPrice: 329,
      stock: 12,
      imageUrl:
        "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=800&q=80",
      tags: ["mask", "hydrating"],
      rating: 4.6,
      reviewCount: 343,
    },
  ];

  console.log("\n  Loading 12 products...");
  for (const p of products) {
    await prisma.product.upsert({
      where: { id: p.mockId },
      update: {
        name: p.name,
        nameTh: p.nameTh,
        description: p.description,
        descriptionTh: p.descriptionTh,
        categoryId: categoryMap[p.categorySlug],
        price: p.price,
        originalPrice: p.originalPrice ?? null,
        stock: p.stock,
        imageUrl: p.imageUrl,
        tags: p.tags,
        rating: p.rating,
        reviewCount: p.reviewCount,
        reason: p.reason ?? null,
      },
      create: {
        id: p.mockId,
        name: p.name,
        nameTh: p.nameTh,
        description: p.description,
        descriptionTh: p.descriptionTh,
        categoryId: categoryMap[p.categorySlug],
        price: p.price,
        originalPrice: p.originalPrice ?? null,
        stock: p.stock,
        imageUrl: p.imageUrl,
        tags: p.tags,
        rating: p.rating,
        reviewCount: p.reviewCount,
        reason: p.reason ?? null,
        status: ProductStatus.ACTIVE,
      },
    });
  }
  console.log(`  ✓ ${products.length} products seeded`);

  // ── Demo Orders ──────────────────────────────────────────────
  const demoUserId = userMap["customer@xinxin.shop"];
  const demoOrders = [
    {
      mockId: "ORD-2026-001",
      items: [
        { mockProductId: "p_001", quantity: 2 },
        { mockProductId: "p_003", quantity: 3 },
      ],
      status: OrderStatus.DELIVERED,
      customerName: "นภา สุขใจ",
      customerPhone: "081-234-5678",
      customerAddress:
        "123 ซอยสุขุมวิท 31 คลองตันเหนือ วัฒนา กรุงเทพฯ 10110",
      createdAt: new Date("2026-06-10T10:30:00Z"),
      updatedAt: new Date("2026-06-14T16:00:00Z"),
    },
    {
      mockId: "ORD-2026-002",
      items: [
        { mockProductId: "p_005", quantity: 1 },
        { mockProductId: "p_008", quantity: 1 },
      ],
      status: OrderStatus.SHIPPING,
      customerName: "นภา สุขใจ",
      customerPhone: "081-234-5678",
      customerAddress:
        "123 ซอยสุขุมวิท 31 คลองตันเหนือ วัฒนา กรุงเทพฯ 10110",
      createdAt: new Date("2026-06-20T14:15:00Z"),
      updatedAt: new Date("2026-06-21T09:00:00Z"),
    },
    {
      mockId: "ORD-2026-003",
      items: [{ mockProductId: "p_009", quantity: 2 }],
      status: OrderStatus.PENDING,
      customerName: "สมหญิง รักไทย",
      customerPhone: "089-876-5432",
      customerAddress:
        "45 ถนนพหลโยธิน สามเสนใน พญาไท กรุงเทพฯ 10400",
      createdAt: new Date("2026-06-25T19:45:00Z"),
      updatedAt: new Date("2026-06-25T19:45:00Z"),
    },
  ];

  console.log("\n  Loading demo orders...");
  for (const o of demoOrders) {
    const items = await Promise.all(
      o.items.map(async (i) => {
        const product = await prisma.product.findUnique({
          where: { id: i.mockProductId },
        });
        if (!product) throw new Error(`Product ${i.mockProductId} not found`);
        return {
          productId: product.id,
          name: product.name,
          nameTh: product.nameTh,
          quantity: i.quantity,
          price: product.price,
          imageUrl: product.imageUrl,
        };
      }),
    );
    const totalAmount = items.reduce(
      (sum, i) => sum + Number(i.price) * i.quantity,
      0,
    );

    await prisma.order.upsert({
      where: { id: o.mockId },
      update: {
        userId: demoUserId,
        totalAmount,
        status: o.status,
        customerName: o.customerName,
        customerPhone: o.customerPhone,
        customerAddress: o.customerAddress,
      },
      create: {
        id: o.mockId,
        userId: demoUserId,
        totalAmount,
        status: o.status,
        customerName: o.customerName,
        customerPhone: o.customerPhone,
        customerAddress: o.customerAddress,
        createdAt: o.createdAt,
        updatedAt: o.updatedAt,
        items: { create: items },
      },
    });
  }
  console.log(`  ✓ ${demoOrders.length} demo orders seeded`);

  console.log("\n✨ Seed complete!\n");
  console.log("  Demo accounts:");
  console.log("    admin@xinxin.shop / admin123");
  console.log("    customer@xinxin.shop / demo123");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
