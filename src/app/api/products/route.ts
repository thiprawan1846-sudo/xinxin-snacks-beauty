import { NextResponse } from "next/server";
import { getProductsByCategory, searchProducts } from "@/lib/db";

/**
 * GET /api/products
 * Query params: category, q, sort
 * Returns active products from the database.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") ?? "all";
  const q = searchParams.get("q") ?? "";
  const sort = searchParams.get("sort") ?? "popular";

  let result = await (q ? searchProducts(q) : getProductsByCategory(category));

  result = [...result].sort((a, b) => {
    if (sort === "price-asc") return a.price - b.price;
    if (sort === "price-desc") return b.price - a.price;
    if (sort === "newest")
      return +new Date(b.createdAt) - +new Date(a.createdAt);
    return b.rating - a.rating;
  });

  return NextResponse.json({ data: result, total: result.length });
}
