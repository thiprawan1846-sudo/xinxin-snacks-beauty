import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import { SafeImage } from "@/components/ui/safe-image";

/**
 * Admin dashboard hero — mirrors the shop homepage's floating product collage.
 * The 4 images come exclusively from featured products (isFeatured=true) and
 * are fetched server-side in `admin/page.tsx`, so this collage stays in sync
 * with the homepage automatically: change a featured product's image in the
 * admin and both pages update on next render.
 */
export function DashboardHero({
  images = [],
}: {
  images?: { url: string; alt: string }[];
}) {
  const slots = [
    "left-2 top-4 h-36 w-28 rotate-[-6deg] animate-float",
    "right-6 top-0 h-40 w-32 rotate-[5deg] animate-float-slow",
    "bottom-2 left-12 h-36 w-28 rotate-[3deg] animate-float",
    "bottom-6 right-2 h-36 w-28 rotate-[-4deg] animate-float-slow",
  ];

  return (
    <section className="relative overflow-hidden rounded-3xl border border-sakura-100/70 bg-gradient-to-br from-sakura-50/80 via-cream-50 to-peach-50/80 shadow-soft">
      <div className="pointer-events-none absolute -right-10 top-6 h-48 w-48 rounded-full bg-peach-200/40 blur-3xl" />
      <div className="grid items-center gap-6 p-6 md:grid-cols-2 md:p-8">
        {/* Copy */}
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-sakura-600 shadow-soft ring-1 ring-sakura-100">
            <Sparkles className="h-3.5 w-3.5" />
            สินค้าแนะนำบนหน้าแรก
          </span>
          <h1 className="mt-4 font-display text-2xl font-bold leading-tight text-ink md:text-3xl">
            ภาพรวมร้านค้า XinXin
          </h1>
          <p className="mt-2 max-w-md text-sm text-ink-soft">
            4 ภาพนี้แสดงบนหน้าแรกและหน้านี้ มาจากสินค้าที่เลือกเป็นแนะนำ
            เปลี่ยนภาพหรือสินค้าแนะนำในหน้าจัดการสินค้าได้เลย
          </p>
          <Link
            href="/admin/products"
            className="pill mt-5 inline-flex h-10 bg-sakura-500 px-5 text-sm font-semibold text-white shadow-soft transition-all hover:brightness-105 active:scale-95"
          >
            จัดการสินค้าแนะนำ
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Floating collage — same images as the homepage hero */}
        <div className="relative hidden h-64 md:block">
          <div className="relative h-full w-full">
            <div className="absolute left-1/2 top-1/2 -z-10 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-sakura-300/50 to-peach-200/50 blur-3xl" />
            {slots.map((cls, i) => {
              const img = images[i];
              return (
                <div
                  key={i}
                  className={`absolute overflow-hidden rounded-2xl border-4 border-white shadow-float ${cls}`}
                >
                  <SafeImage
                    src={img?.url ?? ""}
                    alt={img?.alt ?? "สินค้าแนะนำ"}
                    fill
                    sizes="160px"
                    className="object-cover"
                  />
                </div>
              );
            })}
            <span className="absolute left-0 top-1/2 animate-float text-3xl">
              🌸
            </span>
            <span className="absolute right-0 top-1/2 animate-float-slow text-2xl">
              ✨
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
