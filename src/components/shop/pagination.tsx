"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { paginationRange, cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  /** Base path, e.g. "/products". Defaults to "/products". */
  basePath?: string;
  /** Extra query params to preserve across page links (serializable). */
  queryParams?: Record<string, string | number | undefined>;
  className?: string;
}

/**
 * Builds a page href while omitting default values ("all", "popular", "")
 * so URLs stay clean. Runs entirely on the client (no function props).
 */
function buildHref(
  page: number,
  basePath: string,
  queryParams?: Record<string, string | number | undefined>,
) {
  const sp = new URLSearchParams();
  Object.entries(queryParams ?? {}).forEach(([k, v]) => {
    if (v !== undefined && v !== "" && v !== "all" && v !== "popular") {
      sp.set(k, String(v));
    }
  });
  sp.set("page", String(page));
  return `${basePath}?${sp.toString()}`;
}

export function Pagination({
  currentPage,
  totalPages,
  basePath = "/products",
  queryParams,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;
  const range = paginationRange(currentPage, totalPages);

  const href = (p: number) => buildHref(p, basePath, queryParams);

  return (
    <nav
      className={cn("flex items-center justify-center gap-1.5", className)}
      aria-label="Pagination"
    >
      {currentPage > 1 ? (
        <Link
          href={href(currentPage - 1)}
          className="grid h-10 w-10 place-items-center rounded-full bg-white text-ink-soft shadow-sm ring-1 ring-sakura-100 transition-all hover:bg-sakura-50 hover:text-sakura-600"
          aria-label="ก่อนหน้า"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
      ) : (
        <span className="grid h-10 w-10 place-items-center rounded-full bg-sakura-50/50 text-ink-muted/40">
          <ChevronLeft className="h-4 w-4" />
        </span>
      )}

      {range.map((p, i) =>
        p === "..." ? (
          <span
            key={`ellipsis-${i}`}
            className="grid h-10 w-10 place-items-center text-sm text-ink-muted"
          >
            …
          </span>
        ) : (
          <Link
            key={p}
            href={href(p)}
            className={cn(
              "grid h-10 min-w-10 place-items-center rounded-full px-3 text-sm font-semibold transition-all",
              p === currentPage
                ? "bg-gradient-to-r from-sakura-500 to-peach-500 text-white shadow-soft"
                : "bg-white text-ink-soft shadow-sm ring-1 ring-sakura-100 hover:bg-sakura-50 hover:text-sakura-600",
            )}
          >
            {p}
          </Link>
        ),
      )}

      {currentPage < totalPages ? (
        <Link
          href={href(currentPage + 1)}
          className="grid h-10 w-10 place-items-center rounded-full bg-white text-ink-soft shadow-sm ring-1 ring-sakura-100 transition-all hover:bg-sakura-50 hover:text-sakura-600"
          aria-label="ถัดไป"
        >
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : (
        <span className="grid h-10 w-10 place-items-center rounded-full bg-sakura-50/50 text-ink-muted/40">
          <ChevronRight className="h-4 w-4" />
        </span>
      )}
    </nav>
  );
}
