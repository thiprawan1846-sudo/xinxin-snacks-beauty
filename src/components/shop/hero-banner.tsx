import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { SearchBar } from "@/components/shop/search-bar";
import { SafeImage } from "@/components/ui/safe-image";

export function HeroBanner({
  heroImages = [],
}: {
  heroImages?: { url: string; alt: string }[];
}) {
  return (
    <section className="relative overflow-hidden">
      {/* Soft gradient backdrop */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-sakura-100/80 via-cream-100 to-transparent" />

      {/* Floating decorative blobs */}
      <div className="pointer-events-none absolute -left-20 top-10 -z-10 h-72 w-72 rounded-full bg-sakura-200/40 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-32 -z-10 h-80 w-80 rounded-full bg-peach-100/60 blur-3xl" />

      <div className="container-x grid items-center gap-10 py-12 md:py-20 lg:grid-cols-2 lg:gap-8">
        {/* Copy */}
        <div className="animate-fade-up">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-4 py-1.5 text-xs font-semibold text-sakura-600 shadow-soft ring-1 ring-sakura-100">
            <Sparkles className="h-3.5 w-3.5" />
            ส่งตรงจากจีน · คัดสรรพิเศษ
          </span>

          <h1 className="mt-5 font-display text-4xl font-bold leading-[1.1] tracking-tight text-ink md:text-5xl lg:text-6xl">
            ขนมและเครื่องสำอางจีน
            <br />
            <span className="text-gradient-sakura">ที่เพื่อนแนะนำ</span> 🌸
          </h1>

          <p className="mt-5 max-w-md text-base leading-relaxed text-ink-soft md:text-lg">
            ร้าน XinXin คัดสรรสินค้ายอดนิยมจาก Xiaohongshu และ TikTok
            ส่งตรงถึงมือคุณทั่วประเทศไทย
          </p>

          <div className="mt-7 max-w-lg">
            <SearchBar variant="hero" />
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href="/products"
              className="pill h-12 bg-gradient-to-r from-sakura-500 to-peach-500 px-7 text-sm font-semibold text-white shadow-soft-lg transition-all hover:brightness-105 active:scale-95"
            >
              เริ่มช้อปเลย
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/products?category=beauty"
              className="pill h-12 bg-white/80 px-7 text-sm font-semibold text-sakura-600 ring-1 ring-inset ring-sakura-200 backdrop-blur transition-all hover:bg-sakura-50 active:scale-95"
            >
              💄 สินค้า Beauty
            </Link>
          </div>

          {/* Trust stats */}
          <div className="mt-10 flex gap-8">
            {[
              { num: "500+", label: "สินค้าคัดสรร" },
              { num: "10k+", label: "ลูกค้าที่ไว้วางใจ" },
              { num: "4.9★", label: "คะแนนรีวิว" },
            ].map((s) => (
              <div key={s.label}>
                <p className="font-display text-2xl font-bold text-gradient-sakura">
                  {s.num}
                </p>
                <p className="text-xs text-ink-muted">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Floating product collage — signature element */}
        <div className="relative hidden h-[460px] lg:block">
          <FloatingCollage images={heroImages} />
        </div>
      </div>
    </section>
  );
}

function FloatingCollage({ images }: { images: { url: string; alt: string }[] }) {
  // Four fixed-position slots; each pulls from the DB-driven `images` array.
  // If fewer than 4 images are available, SafeImage falls back to the
  // sakura placeholder so the collage layout never breaks.
  const slots = [
    "left-4 top-6 h-44 w-36 rotate-[-6deg] animate-float",
    "right-8 top-0 h-52 w-44 rotate-[5deg] animate-float-slow",
    "bottom-4 left-16 h-48 w-40 rotate-[3deg] animate-float",
    "bottom-10 right-4 h-44 w-36 rotate-[-4deg] animate-float-slow",
  ];

  return (
    <div className="relative h-full w-full">
      {/* Central glow */}
      <div className="absolute left-1/2 top-1/2 -z-10 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-sakura-300/50 to-peach-200/50 blur-3xl" />

      {slots.map((cls, i) => {
        const img = images[i];
        return (
          <div
            key={i}
            className={`absolute overflow-hidden rounded-3xl border-4 border-white shadow-float ${cls}`}
          >
            <SafeImage
              src={img?.url ?? ""}
              alt={img?.alt ?? "สินค้าแนะนำ"}
              fill
              sizes="200px"
              className="object-cover"
            />
          </div>
        );
      })}

      {/* Floating emoji accents */}
      <span className="absolute left-0 top-1/2 animate-float text-4xl">🌸</span>
      <span className="absolute right-0 top-1/2 animate-float-slow text-3xl">✨</span>
    </div>
  );
}
