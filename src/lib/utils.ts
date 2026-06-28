import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind classes safely (handles conditional + conflict resolution).
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number as Thai Baht currency.
 */
export function formatTHB(amount: number): string {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format an ISO date string to a Thai-localized readable date.
 */
export function formatThaiDate(iso: string): string {
  return new Intl.DateTimeFormat("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

/**
 * Build a pagination range (with ellipsis) for a list of total pages.
 */
export function paginationRange(
  current: number,
  total: number,
  siblings = 1,
): (number | "...")[] {
  const totalShown = siblings * 2 + 5;
  if (total <= totalShown) return Array.from({ length: total }, (_, i) => i + 1);

  const left = Math.max(current - siblings, 1);
  const right = Math.min(current + siblings, total);

  const showLeftDots = left > 2;
  const showRightDots = right < total - 1;

  if (!showLeftDots && showRightDots) {
    const leftCount = 3 + siblings * 2;
    return [...Array.from({ length: leftCount }, (_, i) => i + 1), "...", total];
  }
  if (showLeftDots && !showRightDots) {
    const rightCount = 3 + siblings * 2;
    return [1, "...", ...Array.from({ length: rightCount }, (_, i) => total - rightCount + 1 + i)];
  }
  return [1, "...", left, current, right, "...", total];
}

/**
 * Truncate a string to n chars with an ellipsis.
 */
export function truncate(str: string, n: number): string {
  return str.length > n ? `${str.slice(0, n).trimEnd()}…` : str;
}
