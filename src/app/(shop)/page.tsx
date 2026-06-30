import Link from "next/link";
import { ArrowRight, Truck, ShieldCheck, Heart } from "lucide-react";
import { HeroBanner } from "@/components/shop/hero-banner";
import { SectionHeading } from "@/components/shop/section-heading";
import { ProductCard } from "@/components/shop/product-card";
import { CategoryCard } from "@/components/shop/category-card";
import {
  getCategories,
  getFeaturedProducts,
  getNewArrivals,
  getProductsByCategory,
} from "@/lib/db";

// ISR: revalidate every 60s so new products show up without a full redeploy.
export const revalidate = 60;

export default async function HomePage() {
  const [categories, featured, newArrivals, snacks, beauty, drinks, clothing] =
    await Promise.all([
      getCategories(),
      getFeaturedProducts(8),
      getNewArrivals(4),
      getProductsByCategory("snacks"),
      getProductsByCategory("beauty"),
      getProductsByCategory("drinks"),
      getProductsByCategory("clothing"),
    ]);

  const categoryCounts: Record<string, number> = {
    snacks: snacks.length,
    beauty: beauty.length,
    drinks: drinks.length,
    clothing: clothing.length,
  };

  // 4 张 Hero 拼贴图，仅来自推荐商品（isFeatured=true）。
  // 后台在商品管理勾选「推荐」并配图后，首页与 admin 自动同步更新。
  const heroImages = featured
    .filter((p) => p.imageUrl)
    .slice(0, 4)
    .map((p) => ({ url: p.imageUrl, alt: p.nameTh }));

  return (
    <>
      <HeroBanner heroImages={heroImages} />

      {/* Trust bar */}
      <section className="container-x -mt-2 mb-4">
        <div className="grid gap-3 rounded-3xl border border-sakura-100/70 bg-white/70 p-4 shadow-soft backdrop-blur-sm md:grid-cols-3">
          {[
            { icon: Truck, title: "จัดส่งทั่วไทย", desc: "3-7 วันทำการ" },
            { icon: ShieldCheck, title: "ของแท้ 100%", desc: "ส่งตรงจากจีน" },
            { icon: Heart, title: "คัดสรรพิเศษ", desc: "เหมือนเพื่อนแนะนำ" },
          ].map((item) => (
            <div
              key={item.title}
              className="flex items-center gap-3 rounded-2xl p-2"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-sakura-50 text-sakura-500">
                <item.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">{item.title}</p>
                <p className="text-xs text-ink-muted">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="container-x py-10">
        <SectionHeading
          eyebrow="หมวดหมู่"
          title="เลือกหมวดที่ใช่สำหรับคุณ"
          subtitle="ขนม บิวตี้ และเครื่องดื่ม — ทุกอย่างที่ฮิตจากจีน"
        />
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {categories.map((cat) => (
            <CategoryCard
              key={cat.slug}
              category={cat}
              count={categoryCounts[cat.slug]}
            />
          ))}
        </div>
      </section>

      {/* Featured products */}
      <section className="container-x py-10">
        <SectionHeading
          eyebrow="ฮิตติดดาว ⭐"
          title="สินค้ายอดนิยม"
          subtitle="ที่ลูกค้าของเรารักมากที่สุด"
          action={
            <Link
              href="/products"
              className="pill h-10 bg-sakura-50 px-5 text-sm font-semibold text-sakura-600 transition-colors hover:bg-sakura-100"
            >
              ดูทั้งหมด
              <ArrowRight className="h-4 w-4" />
            </Link>
          }
        />
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {featured.map((p, i) => (
            <ProductCard key={p.id} product={p} priority={i < 4} />
          ))}
        </div>
      </section>

      {/* Beauty spotlight banner */}
      <section className="container-x py-10">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-sakura-400 via-sakura-500 to-peach-400 p-8 shadow-soft-lg md:p-12">
          <div className="pointer-events-none absolute -right-8 -top-8 text-9xl opacity-20">
            💄
          </div>
          <div className="relative max-w-lg text-white">
            <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur">
              Xiaohongshu Picks
            </span>
            <h3 className="mt-4 font-display text-3xl font-bold leading-tight md:text-4xl">
              บิวตี้ที่สาวจีนบ้าน่าซื้อ
            </h3>
            <p className="mt-3 text-white/90">
              ลิปสติก ฟองเดชั่น มาส์กหน้า — คัดมาจาก Xiaohongshu และ TikTok
              ที่กำลังฮิตที่สุดในตอนนี้
            </p>
            <Link
              href="/products?category=beauty"
              className="pill mt-6 h-12 bg-white px-7 text-sm font-bold text-sakura-600 shadow-soft transition-all hover:brightness-95 active:scale-95"
            >
              ช้อป Beauty
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Clothing spotlight — เสื้อผ้าแนะนำ */}
      {clothing.length > 0 && (
        <section className="container-x py-10">
          <SectionHeading
            eyebrow="👕 เสื้อผ้าแนะนำ"
            title="แฟชั่นจากจีน"
            subtitle="เสื้อผ้าสไตล์เกาหลีและจีนที่กำลังฮิต"
            action={
              <Link
                href="/products?category=clothing"
                className="pill h-10 bg-sakura-50 px-5 text-sm font-semibold text-sakura-600 transition-colors hover:bg-sakura-100"
              >
                ดูทั้งหมด
                <ArrowRight className="h-4 w-4" />
              </Link>
            }
          />
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            {clothing.slice(0, 4).map((p, i) => (
              <ProductCard key={p.id} product={p} priority={i < 4} />
            ))}
          </div>
        </section>
      )}

      {/* New arrivals */}
      <section className="container-x py-10">
        <SectionHeading
          eyebrow="มาใหม่ล่าสุด"
          title="สินค้ามาใหม่"
          subtitle="ที่เพิ่งเข้าร้าน XinXin"
        />
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          {newArrivals.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* Newsletter / CTA */}
      <section className="container-x py-12">
        <div className="relative overflow-hidden rounded-3xl border border-sakura-100/70 bg-white/70 p-8 text-center shadow-soft backdrop-blur-sm md:p-14">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-sakura-50 to-transparent" />
          <span className="text-4xl">🌸</span>
          <h3 className="mt-3 font-display text-2xl font-bold text-ink md:text-3xl">
            รับส่วนลดพิเศษ 10%
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink-soft">
            สมัครรับข่าวสารเพื่อรับโปรโมชั่นและสินค้ามาใหม่ก่อนใคร
          </p>
          <form className="mx-auto mt-6 flex max-w-md flex-col gap-2 sm:flex-row">
            <input
              type="email"
              placeholder="อีเมลของคุณ"
              className="h-12 flex-1 rounded-full border border-sakura-200 bg-white px-5 text-sm outline-none focus:border-sakura-400 focus:ring-2 focus:ring-sakura-200"
            />
            <button
              type="submit"
              className="pill h-12 bg-gradient-to-r from-sakura-500 to-peach-500 px-7 text-sm font-semibold text-white shadow-soft hover:brightness-105 active:scale-95"
            >
              สมัครเลย
            </button>
          </form>
        </div>
      </section>
    </>
  );
}
