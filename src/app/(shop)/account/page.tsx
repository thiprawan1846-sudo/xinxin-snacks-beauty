"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Package, ShoppingBag, LogOut, ShieldCheck, Mail, Calendar } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useOrders } from "@/hooks/use-orders";
import { Button } from "@/components/ui/button";
import { formatThaiDate } from "@/lib/utils";

export default function AccountPage() {
  const router = useRouter();
  const { user, loading, fetchUser, logout } = useAuth();
  const orderCount = useOrders((s) =>
    s.orders.filter((o) => o.userId === (user?.id ?? "")).length,
  );

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  if (loading) {
    return (
      <div className="container-x flex items-center justify-center py-24">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-sakura-200 border-t-sakura-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container-x flex flex-col items-center justify-center py-20 text-center">
        <span className="grid h-24 w-24 place-items-center rounded-full bg-sakura-100 text-5xl">
          🔐
        </span>
        <h1 className="mt-6 font-display text-2xl font-bold text-ink">
          กรุณาเข้าสู่ระบบ
        </h1>
        <p className="mt-2 max-w-sm text-sm text-ink-muted">
          เข้าสู่ระบบเพื่อดูข้อมูลบัญชีและคำสั่งซื้อของคุณ
        </p>
        <Button variant="gradient" size="lg" className="mt-6" asChild>
          <Link href="/login?redirect=/account">เข้าสู่ระบบ</Link>
        </Button>
      </div>
    );
  }

  const initials = user.name.charAt(0).toUpperCase();

  return (
    <div className="container-x py-8 md:py-12">
      <div className="mx-auto max-w-3xl">
        {/* Profile header */}
        <div className="overflow-hidden rounded-3xl border border-sakura-100/70 bg-white/80 shadow-soft backdrop-blur-sm">
          <div className="bg-gradient-to-r from-sakura-200 via-peach-200 to-cream-200 px-6 py-8 sm:px-8">
            <div className="flex items-center gap-4">
              <span
                className={`grid h-20 w-20 place-items-center rounded-full text-2xl font-bold text-white shadow-float ${
                  user.role === "ADMIN"
                    ? "bg-gradient-to-br from-peach-500 to-rose-500"
                    : "bg-gradient-to-br from-sakura-400 to-peach-400"
                }`}
              >
                {initials}
              </span>
              <div>
                <h1 className="font-display text-2xl font-bold text-ink">
                  {user.name}
                </h1>
                {user.role === "ADMIN" && (
                  <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-white/70 px-2.5 py-0.5 text-xs font-bold text-peach-600 backdrop-blur">
                    <ShieldCheck className="h-3 w-3" /> ผู้ดูแลระบบ
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-px bg-cream-100 sm:grid-cols-2">
            <div className="bg-white p-5">
              <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-ink-muted">
                <Mail className="h-3.5 w-3.5" /> อีเมล
              </p>
              <p className="truncate text-sm font-medium text-ink">
                {user.email}
              </p>
            </div>
            <div className="bg-white p-5">
              <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-ink-muted">
                <Calendar className="h-3.5 w-3.5" /> สมาชิกเมื่อ
              </p>
              <p className="text-sm font-medium text-ink">
                {formatThaiDate(user.createdAt)}
              </p>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Link
            href="/orders"
            className="group flex items-center gap-4 rounded-3xl border border-sakura-100/70 bg-white/80 p-5 shadow-soft backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:shadow-float"
          >
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-sakura-100 text-sakura-600 transition-colors group-hover:bg-sakura-200">
              <Package className="h-5 w-5" />
            </span>
            <div className="flex-1">
              <p className="font-display font-semibold text-ink">
                คำสั่งซื้อของฉัน
              </p>
              <p className="text-xs text-ink-muted">
                {orderCount} รายการ
              </p>
            </div>
            <span className="text-ink-muted transition-transform group-hover:translate-x-1">
              →
            </span>
          </Link>

          <Link
            href="/products"
            className="group flex items-center gap-4 rounded-3xl border border-sakura-100/70 bg-white/80 p-5 shadow-soft backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:shadow-float"
          >
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-peach-100 text-peach-600 transition-colors group-hover:bg-peach-200">
              <ShoppingBag className="h-5 w-5" />
            </span>
            <div className="flex-1">
              <p className="font-display font-semibold text-ink">
                ช้อปปิ้งต่อ
              </p>
              <p className="text-xs text-ink-muted">ดูสินค้าใหม่และมาแรง</p>
            </div>
            <span className="text-ink-muted transition-transform group-hover:translate-x-1">
              →
            </span>
          </Link>

          {user.role === "ADMIN" && (
            <Link
              href="/admin"
              className="group flex items-center gap-4 rounded-3xl border border-peach-100/70 bg-white/80 p-5 shadow-soft backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:shadow-float sm:col-span-2"
            >
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-peach-400 to-rose-400 text-white shadow-soft">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div className="flex-1">
                <p className="font-display font-semibold text-ink">
                  จัดการร้านค้า
                </p>
                <p className="text-xs text-ink-muted">
                  สินค้า · สต็อก · คำสั่งซื้อ
                </p>
              </div>
              <span className="text-ink-muted transition-transform group-hover:translate-x-1">
                →
              </span>
            </Link>
          )}
        </div>

        <div className="mt-6 flex justify-center">
          <Button
            variant="ghost"
            onClick={async () => {
              await logout();
              router.push("/");
              router.refresh();
            }}
            className="text-rose-500 hover:bg-rose-50"
          >
            <LogOut className="h-4 w-4" />
            ออกจากระบบ
          </Button>
        </div>
      </div>
    </div>
  );
}
