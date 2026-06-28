import type { Metadata } from "next";
import { getCategories, getProductsByCategory, searchProducts } from "@/lib/db";
import { ProductCard } from "@/components/shop/product-card";
import { SearchBar } from "@/components/shop/search-bar";
import { Pagination } from "@/components/shop/pagination";
import { CATEGORY_LABEL } from "@/lib/constants";
import { cn } from "@/lib/utils";
import Link from "next/link";

export const metadata: Metadata = {
  title: "สินค้าทั้งหมด",
  description: "ช้อปขนมและเครื่องสำอางจีนส่งตรงจากจีน ทุกหมวดหมู่",
};

const PAGE_SIZE = 8;

export default function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string; page?: string; sort?: string }>;
}) {
  return <ProductsView searchParams={searchParams} />;
}

async function ProductsView({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string; page?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const category = params.category ?? "all";
  const q = params.q ?? "";
  const page = Math.max(1, Number(params.page ?? 1));
  const sort = params.sort ?? "popular";

  const [categories, baseProducts] = await Promise.all([
    getCategories(),
    q ? searchProducts(q) : getProductsByCategory(category),
  ]);

  let filtered = baseProducts;
  if (category !== "all" && !q) {
    filtered = filtered.filter((p) => p.category === category);
  }

  // Sort
  filtered = [...filtered].sort((a, b) => {
    if (sort === "price-asc") return a.price - b.price;
    if (sort === "price-desc") return b.price - a.price;
    if (sort === "newest")
      return +new Date(b.createdAt) - +new Date(a.createdAt);
    return b.rating - a.rating; // popular
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const buildHref = (overrides: Record<string, string | number>) => {
    const sp = new URLSearchParams();
    const merged = { category, q, sort, ...overrides };
    Object.entries(merged).forEach(([k, v]) => {
      if (v && v !== "all" && v !== "popular") sp.set(k, String(v));
    });
    const qs = sp.toString();
    return qs ? `/products?${qs}` : "/products";
  };

  return (
    <div className="container-x py-8 md:py-12">
      {/* Page header */}
      <div className="mb-8">
        <nav className="mb-3 text-xs text-ink-muted">
          <Link href="/" className="hover:text-sakura-600">
            หน้าแรก
          </Link>
          <span className="mx-1.5">/</span>
          <span className="text-ink-soft">สินค้า</span>
        </nav>
        <h1 className="font-display text-3xl font-bold text-ink md:text-4xl">
          {q ? `ผลการค้นหา "${q}"` : CATEGORY_LABEL[category as keyof typeof CATEGORY_LABEL]?.label ?? "สินค้าทั้งหมด"}
          <span className="ml-2 text-lg font-medium text-ink-muted">
            ({filtered.length} รายการ)
          </span>
        </h1>
      </div>

      {/* Search + sort bar */}
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="max-w-md flex-1">
          <SearchBar defaultValue={q} />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-ink-muted">เรียงตาม</label>
          <div className="flex flex-wrap gap-1 rounded-full bg-white/80 p-1 ring-1 ring-sakura-100">
            {[
              { value: "popular", label: "ยอดนิยม" },
              { value: "newest", label: "ใหม่ล่าสุด" },
              { value: "price-asc", label: "ราคาต่ำ-สูง" },
              { value: "price-desc", label: "ราคาสูง-ต่ำ" },
            ].map((s) => (
              <Link
                key={s.value}
                href={buildHref({ sort: s.value, page: 1 })}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                  sort === s.value
                    ? "bg-sakura-500 text-white shadow-soft"
                    : "text-ink-soft hover:bg-sakura-50",
                )}
              >
                {s.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Category chips */}
      <div className="mb-8 flex flex-wrap gap-2">
        <Link
          href={buildHref({ category: "all", page: 1 })}
          className={cn(
            "rounded-full px-4 py-2 text-sm font-medium transition-all",
            category === "all"
              ? "bg-gradient-to-r from-sakura-500 to-peach-500 text-white shadow-soft"
              : "bg-white text-ink-soft ring-1 ring-sakura-100 hover:bg-sakura-50",
          )}
        >
          🛍️ ทั้งหมด
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat.slug}
            href={buildHref({ category: cat.slug, page: 1 })}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition-all",
              category === cat.slug
                ? "bg-gradient-to-r from-sakura-500 to-peach-500 text-white shadow-soft"
                : "bg-white text-ink-soft ring-1 ring-sakura-100 hover:bg-sakura-50",
            )}
          >
            {cat.emoji} {cat.labelTh}
          </Link>
        ))}
      </div>

      {/* Grid */}
      {paged.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-sakura-200 bg-white/50 py-20 text-center">
          <span className="text-5xl">🔍</span>
          <p className="mt-4 font-display text-lg font-semibold text-ink">
            ไม่พบสินค้าที่ค้นหา
          </p>
          <p className="mt-1 text-sm text-ink-muted">
            ลองเปลี่ยนคำค้นหาหรือเลือกหมวดหมู่อื่นดูนะ
          </p>
          <Link
            href="/products"
            className="pill mt-5 h-10 bg-sakura-500 px-6 text-sm font-semibold text-white"
          >
            ดูสินค้าทั้งหมด
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {paged.map((p, i) => (
            <ProductCard key={p.id} product={p} priority={i < 4} />
          ))}
        </div>
      )}

      {/* Pagination */}
      <div className="mt-12">
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          basePath="/products"
          queryParams={{ category, q, sort }}
        />
      </div>
    </div>
  );
}
