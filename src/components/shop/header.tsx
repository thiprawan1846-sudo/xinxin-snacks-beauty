"use client";

import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Search, ShoppingBag, Menu, X, User, LogOut, ChevronDown, ShieldCheck, Package } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const NAV_LINKS = [
  { href: "/", labelTh: "หน้าแรก", label: "Home" },
  { href: "/products", labelTh: "สินค้าทั้งหมด", label: "Products" },
  { href: "/products?category=snacks", labelTh: "ขนม", label: "Snacks" },
  { href: "/products?category=beauty", labelTh: "เครื่องสำอาง", label: "Beauty" },
  { href: "/orders", labelTh: "คำสั่งซื้อ", label: "Orders" },
];

export function Header() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentCategory = searchParams.get("category");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const { user, fetchUser, logout } = useAuth();

  // Hydrate auth state once on mount.
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // Close user dropdown on outside click.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  /** Matches a nav link against the current route + category query. */
  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    const [path, query] = href.split("?");
    if (path !== pathname) return false;
    const hrefCategory = new URLSearchParams(query ?? "").get("category");
    return hrefCategory === currentCategory;
  };
  const totalItems = useCart((s) => s.items.reduce((n, i) => n + i.quantity, 0));
  const setOpen = useCart((s) => s.setOpen);

  return (
    <header className="sticky top-0 z-40 w-full">
      <div className="glass-pink border-b border-sakura-100/60">
        <div className="container-x flex h-16 items-center justify-between gap-4 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-sakura-400 to-peach-400 text-lg shadow-soft">
              🌸
            </span>
            <span className="flex flex-col leading-none">
              <span className="font-display text-lg font-bold text-gradient-sakura md:text-xl">
                XinXin
              </span>
              <span className="text-[10px] font-medium text-ink-muted">
                Snacks & Beauty
              </span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 lg:flex">
            {NAV_LINKS.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "relative rounded-full px-4 py-2 text-sm font-medium transition-colors",
                    active
                      ? "text-sakura-600"
                      : "text-ink-soft hover:text-sakura-500",
                  )}
                >
                  {link.labelTh}
                  {active && (
                    <span className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-sakura-400" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1.5 md:gap-2">
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="hidden md:inline-flex"
            >
              <Link href="/products" aria-label="ค้นหาสินค้า">
                <Search className="h-5 w-5" />
              </Link>
            </Button>
            {/* Auth: login link or user dropdown */}
            {user ? (
              <div className="relative hidden md:block" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex items-center gap-1.5 rounded-full py-1 pl-1 pr-2.5 transition-colors hover:bg-sakura-50"
                  aria-label="เมนูบัญชี"
                >
                  <span
                    className={cn(
                      "grid h-8 w-8 place-items-center rounded-full text-xs font-bold text-white shadow-soft",
                      user.role === "ADMIN"
                        ? "bg-gradient-to-br from-peach-500 to-rose-500"
                        : "bg-gradient-to-br from-sakura-400 to-peach-400",
                    )}
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="max-w-20 truncate text-xs font-semibold text-ink-soft">
                    {user.name}
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 text-ink-muted transition-transform",
                      menuOpen && "rotate-180",
                    )}
                  />
                </button>

                {menuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-3xl border border-sakura-100 bg-white p-2 shadow-float">
                    <div className="px-3 py-2">
                      <p className="truncate text-sm font-semibold text-ink">
                        {user.name}
                      </p>
                      <p className="truncate text-xs text-ink-muted">
                        {user.email}
                      </p>
                      {user.role === "ADMIN" && (
                        <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-peach-50 px-2 py-0.5 text-[10px] font-bold text-peach-600">
                          <ShieldCheck className="h-3 w-3" /> ผู้ดูแลระบบ
                        </span>
                      )}
                    </div>
                    <div className="my-1 h-px bg-cream-100" />
                    <Link
                      href="/orders"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 rounded-2xl px-3 py-2 text-sm text-ink-soft transition-colors hover:bg-sakura-50"
                    >
                      <Package className="h-4 w-4" /> คำสั่งซื้อของฉัน
                    </Link>
                    {user.role === "ADMIN" && (
                      <Link
                        href="/admin"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2.5 rounded-2xl px-3 py-2 text-sm text-ink-soft transition-colors hover:bg-sakura-50"
                      >
                        <ShieldCheck className="h-4 w-4" /> จัดการร้าน
                      </Link>
                    )}
                    <div className="my-1 h-px bg-cream-100" />
                    <button
                      onClick={async () => {
                        await logout();
                        setMenuOpen(false);
                        router.push("/");
                        router.refresh();
                      }}
                      className="flex w-full items-center gap-2.5 rounded-2xl px-3 py-2 text-sm font-medium text-rose-500 transition-colors hover:bg-rose-50"
                    >
                      <LogOut className="h-4 w-4" /> ออกจากระบบ
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="hidden md:inline-flex"
              >
                <Link href="/login">
                  <User className="h-4 w-4" />
                  เข้าสู่ระบบ
                </Link>
              </Button>
            )}
            <button
              onClick={() => setOpen(true)}
              className="relative grid h-11 w-11 place-items-center rounded-full text-ink-soft transition-colors hover:bg-sakura-50 hover:text-sakura-600"
              aria-label="ตะกร้าสินค้า"
            >
              <ShoppingBag className="h-5 w-5" />
              {totalItems > 0 && (
                <Badge
                  variant="solid"
                  className="absolute -right-0.5 -top-0.5 h-5 min-w-5 justify-center px-1 text-[10px] animate-pulse-soft"
                >
                  {totalItems}
                </Badge>
              )}
            </button>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="เมนู"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <nav className="lg:hidden border-t border-sakura-100/60 bg-white/95 backdrop-blur">
            <div className="container-x flex flex-col gap-1 py-3">
              {NAV_LINKS.map((link) => {
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "rounded-2xl px-4 py-3 text-sm font-medium transition-colors",
                      active
                        ? "bg-sakura-50 text-sakura-600"
                        : "text-ink-soft hover:bg-sakura-50 hover:text-sakura-600",
                    )}
                  >
                    {link.labelTh}
                  </Link>
                );
              })}
              <div className="my-1 h-px bg-cream-100" />
              {user ? (
                <>
                  <div className="px-4 py-2">
                    <p className="truncate text-sm font-semibold text-ink">
                      {user.name}
                    </p>
                    <p className="truncate text-xs text-ink-muted">
                      {user.email}
                    </p>
                  </div>
                  {user.role === "ADMIN" && (
                    <Link
                      href="/admin"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium text-ink-muted transition-colors hover:bg-sakura-50"
                    >
                      <ShieldCheck className="h-4 w-4" /> จัดการร้าน
                    </Link>
                  )}
                  <button
                    onClick={async () => {
                      await logout();
                      setMobileOpen(false);
                      router.push("/");
                      router.refresh();
                    }}
                    className="flex w-full items-center gap-2 rounded-2xl px-4 py-3 text-left text-sm font-medium text-rose-500 transition-colors hover:bg-rose-50"
                  >
                    <LogOut className="h-4 w-4" /> ออกจากระบบ
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-sakura-500 to-peach-500 px-4 py-3 text-sm font-bold text-white shadow-soft"
                >
                  <User className="h-4 w-4" /> เข้าสู่ระบบ / สมัครสมาชิก
                </Link>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
