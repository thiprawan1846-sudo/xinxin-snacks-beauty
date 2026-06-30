import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Star, Truck, ShieldCheck, RotateCcw } from "lucide-react";
import { getProductById, getProductsByCategory } from "@/lib/db";
import { formatTHB, truncate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "@/components/shop/product-card";
import { AddToCartSection } from "@/components/shop/add-to-cart-section";
import { SectionHeading } from "@/components/shop/section-heading";
import { ProductGallery } from "@/components/shop/product-gallery";

// ISR: keep product details (price/stock) fresh.
export const revalidate = 60;

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) return { title: "ไม่พบสินค้า" };
  return {
    title: product.nameTh,
    description: truncate(product.descriptionTh, 140),
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) notFound();

  const relatedProducts = await getProductsByCategory(product.category);
  const related = relatedProducts
    .filter((p) => p.id !== product.id)
    .slice(0, 4);

  const discount = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0;

  return (
    <div className="container-x py-8 md:py-12">
      {/* Breadcrumb */}
      <nav className="mb-6 text-xs text-ink-muted">
        <Link href="/" className="hover:text-sakura-600">
          หน้าแรก
        </Link>
        <span className="mx-1.5">/</span>
        <Link
          href={`/products?category=${product.category}`}
          className="hover:text-sakura-600"
        >
          {product.category === "snacks"
            ? "ขนม"
            : product.category === "beauty"
              ? "เครื่องสำอาง"
              : product.category === "clothing"
                ? "เสื้อผ้า"
                : "เครื่องดื่ม"}
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-ink-soft">{truncate(product.nameTh, 30)}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        {/* Image gallery: 多图轮播 + 缩略图切换 */}
        <ProductGallery
          images={
            product.gallery && product.gallery.length > 0
              ? product.gallery
              : [product.imageUrl]
          }
          alt={product.nameTh}
          discount={discount}
        />

        {/* Info */}
        <div className="flex flex-col">
          <div className="mb-3 flex items-center gap-2">
            <Badge variant="peach">
              {product.category === "snacks"
                ? "🍪 ขนม"
                : product.category === "beauty"
                  ? "💄 บิวตี้"
                  : product.category === "clothing"
                    ? "👕 เสื้อผ้า"
                    : "🧋 เครื่องดื่ม"}
            </Badge>
            {product.tags.includes("bestseller") && (
              <Badge variant="solid">🔥 ขายดี</Badge>
            )}
          </div>

          <h1 className="font-display text-3xl font-bold leading-tight text-ink md:text-4xl">
            {product.nameTh}
          </h1>
          <p className="mt-1 text-sm text-ink-muted">{product.name}</p>
          {/* 友好英文名（可选）：有值则在主标题下方以较小字体显示 */}
          {product.englishName && (
            <p className="mt-1 text-sm font-medium text-ink-soft/80">
              {product.englishName}
            </p>
          )}

          {/* Rating */}
          <div className="mt-4 flex items-center gap-3">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`h-4 w-4 ${
                    s <= Math.round(product.rating)
                      ? "fill-peach-300 text-peach-300"
                      : "fill-sakura-50 text-sakura-100"
                  }`}
                />
              ))}
            </div>
            <span className="text-sm font-semibold text-ink">
              {product.rating}
            </span>
            <span className="text-sm text-ink-muted">
              ({product.reviewCount} รีวิว)
            </span>
          </div>

          {/* Price */}
          <div className="mt-5 flex items-end gap-3">
            <span className="font-display text-4xl font-bold text-sakura-600">
              {formatTHB(product.price)}
            </span>
            {product.originalPrice && (
              <span className="mb-1 text-lg text-ink-muted line-through">
                {formatTHB(product.originalPrice)}
              </span>
            )}
          </div>

          {/* Description */}
          <p className="mt-5 leading-relaxed text-ink-soft">
            {product.descriptionTh}
          </p>

          {/* Friend recommendation */}
          {product.reason && (
            <div className="mt-5 flex gap-3 rounded-2xl border border-peach-100 bg-peach-100/40 p-4">
              <span className="text-2xl">💬</span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-peach-500">
                  เพื่อนแนะนำ
                </p>
                <p className="mt-1 text-sm italic text-ink-soft">
                  &ldquo;{product.reason}&rdquo;
                </p>
              </div>
            </div>
          )}

          {/* Add to cart */}
          <div className="mt-7">
            <AddToCartSection product={product} />
          </div>

          {/* Service icons */}
          <div className="mt-7 grid grid-cols-3 gap-3 border-t border-sakura-100/70 pt-6">
            {[
              { icon: Truck, label: "จัดส่งทั่วไทย" },
              { icon: ShieldCheck, label: "ของแท้ 100%" },
              { icon: RotateCcw, label: "เปลี่ยนคืนได้" },
            ].map((s) => (
              <div
                key={s.label}
                className="flex flex-col items-center gap-1.5 text-center"
              >
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-sakura-50 text-sakura-500">
                  <s.icon className="h-5 w-5" />
                </span>
                <span className="text-xs font-medium text-ink-soft">
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <section className="mt-16">
          <SectionHeading
            eyebrow="คุณอาจชอบ"
            title="สินค้าที่เกี่ยวข้อง"
            subtitle="จากหมวดเดียวกันที่ลูกค้าชอบ"
          />
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
