"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, Boxes, ClipboardList, Store } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Dashboard", labelTh: "แดชบอร์ด", icon: LayoutDashboard, emoji: "📊" },
  { href: "/admin/products", label: "Products", labelTh: "สินค้า", icon: Package, emoji: "🛍️" },
  { href: "/admin/inventory", label: "Inventory", labelTh: "คลังสินค้า", icon: Boxes, emoji: "📦" },
  { href: "/admin/orders", label: "Orders", labelTh: "คำสั่งซื้อ", icon: ClipboardList, emoji: "🧾" },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 flex h-screen w-full flex-col border-r border-sakura-100/70 bg-white/70 backdrop-blur-sm md:w-64 md:shrink-0">
      {/* Brand */}
      <div className="flex h-16 items-center gap-2.5 border-b border-sakura-100/70 px-5">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-sakura-400 to-peach-400 text-base shadow-soft">
          🌸
        </span>
        <div className="leading-none">
          <p className="font-display text-sm font-bold text-gradient-sakura">XinXin</p>
          <p className="text-[10px] text-ink-muted">Admin Console</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 p-3">
        {NAV.map((item) => {
          const active =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all",
                active
                  ? "bg-gradient-to-r from-sakura-500 to-peach-500 text-white shadow-soft"
                  : "text-ink-soft hover:bg-sakura-50 hover:text-sakura-600",
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.labelTh}</span>
              <span className="ml-auto text-base">{item.emoji}</span>
            </Link>
          );
        })}
      </nav>

      {/* Back to store */}
      <div className="border-t border-sakura-100/70 p-3">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-ink-muted transition-colors hover:bg-sakura-50 hover:text-sakura-600"
        >
          <Store className="h-4 w-4" />
          กลับหน้าร้าน
        </Link>
      </div>
    </aside>
  );
}
