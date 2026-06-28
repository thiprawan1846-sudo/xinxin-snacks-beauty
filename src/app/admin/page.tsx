import { getFeaturedProducts } from "@/lib/db";
import { DashboardHero } from "@/components/admin/dashboard-hero";
import { AdminDashboardClient } from "@/components/admin/admin-dashboard-client";

/**
 * Admin dashboard (server component).
 * Fetches the featured-product hero images here so this page's collage stays
 * in sync with the homepage — both read from `getFeaturedProducts`, which
 * only returns products with isFeatured=true. The interactive dashboard body
 * lives in the client sub-component.
 */
export default async function AdminDashboardPage() {
  const featured = await getFeaturedProducts(8);
  const heroImages = featured
    .filter((p) => p.imageUrl)
    .slice(0, 4)
    .map((p) => ({ url: p.imageUrl, alt: p.nameTh }));

  return (
    <div className="space-y-8">
      <DashboardHero images={heroImages} />
      <AdminDashboardClient />
    </div>
  );
}
