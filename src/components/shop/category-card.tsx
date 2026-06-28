import Link from "next/link";
import type { CategoryInfo } from "@/types";
import { cn } from "@/lib/utils";

interface CategoryCardProps {
  category: CategoryInfo;
  count?: number;
  className?: string;
}

export function CategoryCard({ category, count, className }: CategoryCardProps) {
  return (
    <Link
      href={`/products?category=${category.slug}`}
      className={cn(
        "group relative flex flex-col justify-end overflow-hidden rounded-3xl p-5 shadow-soft transition-all duration-500 hover:-translate-y-1 hover:shadow-float",
        "bg-gradient-to-br",
        category.gradient,
        "min-h-[140px]",
        className,
      )}
    >
      {/* Decorative big emoji */}
      <span className="pointer-events-none absolute -right-3 -top-3 text-7xl opacity-30 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6">
        {category.emoji}
      </span>

      <div className="relative">
        <span className="mb-1 block text-3xl">{category.emoji}</span>
        <h3 className="font-display text-lg font-bold text-ink">
          {category.labelTh}
        </h3>
        <p className="text-xs text-ink-soft">{category.label}</p>
        {count !== undefined && (
          <p className="mt-1 text-[11px] font-medium text-ink/70">
            {count} รายการ
          </p>
        )}
      </div>
    </Link>
  );
}
