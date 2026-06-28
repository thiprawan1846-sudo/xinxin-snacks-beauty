import { Suspense } from "react";
import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";
import { getFeaturedProducts } from "@/lib/db";

// ISR: keep the featured-product collage in sync with homepage.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "เข้าสู่ระบบ · XinXin Snacks & Beauty",
  description: "เข้าสู่ระบบหรือสมัครสมาชิกเพื่อช้อปขนมและเครื่องสำอางจากจีน",
};

/**
 * Server component — fetches the featured-product images here so the login
 * page's brand-wall collage stays in sync with the homepage and admin
 * dashboard. All four tiles come from products with isFeatured=true; the
 * form itself (client) stays pure UI.
 */
export default async function LoginPage() {
  const featured = await getFeaturedProducts(8);
  const heroImages = featured
    .filter((p) => p.imageUrl)
    .slice(0, 4)
    .map((p) => ({ url: p.imageUrl, alt: p.nameTh }));

  return (
    <Suspense fallback={null}>
      <LoginForm heroImages={heroImages} />
    </Suspense>
  );
}
