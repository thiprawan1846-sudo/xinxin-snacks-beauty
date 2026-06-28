import type { MetadataRoute } from "next";
import { getProductsByCategory } from "@/lib/db";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

/**
 * Dynamic sitemap — lists the homepage, products listing, and every active
 * product detail page. Regenerated on each request in production (Next.js
 * caches route handlers by default; add `revalidate` if needed).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = [
    { url: "/", priority: 1.0, changeFrequency: "daily" as const },
    { url: "/products", priority: 0.9, changeFrequency: "daily" as const },
  ];

  let products: { id: string; updatedAt?: string | Date }[] = [];
  try {
    products = (await getProductsByCategory("all")).map((p) => ({
      id: p.id,
      updatedAt: p.updatedAt,
    }));
  } catch {
    // If the DB is unreachable at build time, fall back to static routes only.
  }

  const productRoutes = products.map((p) => ({
    url: `${SITE_URL}/products/${p.id}`,
    lastModified: p.updatedAt ? new Date(p.updatedAt) : new Date(),
    priority: 0.7,
    changeFrequency: "weekly" as const,
  }));

  return [
    ...staticRoutes.map((r) => ({
      url: `${SITE_URL}${r.url}`,
      lastModified: new Date(),
      changeFrequency: r.changeFrequency,
      priority: r.priority,
    })),
    ...productRoutes,
  ];
}
