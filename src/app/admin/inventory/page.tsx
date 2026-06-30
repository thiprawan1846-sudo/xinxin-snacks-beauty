"use client";

import { useState } from "react";
import { SafeImage as Image } from "@/components/ui/safe-image";
import { Save, AlertTriangle, PackageX, Boxes } from "lucide-react";
import { useProducts } from "@/hooks/use-products";
import { useHydrate } from "@/hooks/use-hydrate";
import { formatTHB, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AdminTable } from "@/components/admin/admin-table";
import { LOW_STOCK_THRESHOLD } from "@/lib/constants";
import type { Product } from "@/types";

export default function AdminInventoryPage() {
  useHydrate({ products: true });
  const products = useProducts((s) => s.products);
  const updateStock = useProducts((s) => s.updateStock);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const lowStock = products.filter(
    (p) => p.stock > 0 && p.stock <= LOW_STOCK_THRESHOLD,
  );
  const outOfStock = products.filter((p) => p.stock === 0);
  const totalValue = products.reduce((s, p) => s + p.stock * p.price, 0);

  const setDraft = (id: string, value: string) =>
    setDrafts((d) => ({ ...d, [id]: value }));

  const save = (id: string) => {
    const value = Number(drafts[id]);
    if (Number.isNaN(value)) return;
    updateStock(id, Math.max(0, value));
    setDrafts((d) => {
      const next = { ...d };
      delete next[id];
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink md:text-3xl">
          คลังสินค้า
        </h1>
        <p className="mt-1 text-sm text-ink-soft">
          ปรับจำนวนสต็อกสินค้าแต่ละรายการ
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-4 rounded-3xl border border-sakura-100/70 bg-white/80 p-5 shadow-soft">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-50 text-violet-500">
            <Boxes className="h-5 w-5" />
          </span>
          <div>
            <p className="font-display text-xl font-bold text-ink">
              ฿{totalValue.toLocaleString("th-TH")}
            </p>
            <p className="text-xs text-ink-muted">มูลค่าสต็อกรวม</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-3xl border border-amber-100 bg-amber-50/50 p-5">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-100 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div>
            <p className="font-display text-xl font-bold text-amber-700">
              {lowStock.length}
            </p>
            <p className="text-xs text-amber-600">สต็อกต่ำ (≤{LOW_STOCK_THRESHOLD})</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-3xl border border-rose-100 bg-rose-50/50 p-5">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-rose-100 text-rose-600">
            <PackageX className="h-5 w-5" />
          </span>
          <div>
            <p className="font-display text-xl font-bold text-rose-700">
              {outOfStock.length}
            </p>
            <p className="text-xs text-rose-600">สินค้าหมดสต็อก</p>
          </div>
        </div>
      </div>

      {/* Inventory table */}
      <AdminTable<Product>
        data={products}
        columns={[
          {
            key: "name",
            header: "สินค้า",
            render: (p) => (
              <div className="flex items-center gap-3">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-sakura-50">
                  <Image
                    src={p.imageUrl}
                    alt={p.nameTh}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <p className="line-clamp-1 text-sm font-semibold text-ink">
                    {p.nameTh}
                  </p>
                  <p className="text-xs text-ink-muted">
                    {formatTHB(p.price)} / ชิ้น
                  </p>
                </div>
              </div>
            ),
          },
          {
            key: "stock",
            header: "สต็อกปัจจุบัน",
            render: (p) => (
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
                  p.stock === 0
                    ? "bg-rose-100 text-rose-600"
                    : p.stock <= LOW_STOCK_THRESHOLD
                      ? "bg-amber-100 text-amber-700"
                      : "bg-emerald-100 text-emerald-700",
                )}
              >
                {p.stock === 0 && "⚠️"}
                {p.stock} ชิ้น
              </span>
            ),
          },
          {
            key: "value",
            header: "มูลค่าสต็อก",
            render: (p) => (
              <span className="text-sm font-medium text-ink-soft">
                {formatTHB(p.stock * p.price)}
              </span>
            ),
          },
          {
            key: "edit",
            header: "ปรับสต็อก",
            className: "w-48",
            render: (p) => {
              const isClothing = p.category === "clothing";
              return (
                <div className="flex items-center gap-2">
                  {isClothing ? (
                    <span className="text-xs text-ink-muted">
                      จัดการผ่าน SKU
                    </span>
                  ) : (
                    <>
                      <input
                        type="number"
                        min={0}
                        value={drafts[p.id] ?? String(p.stock)}
                        onChange={(e) => setDraft(p.id, e.target.value)}
                        className="h-9 w-20 rounded-full border border-sakura-200 bg-white px-3 text-sm text-ink outline-none focus:border-sakura-400 focus:ring-2 focus:ring-sakura-200"
                      />
                      <Button
                        size="sm"
                        variant="gradient"
                        onClick={() => save(p.id)}
                        disabled={drafts[p.id] === undefined}
                      >
                        <Save className="h-3.5 w-3.5" />
                        บันทึก
                      </Button>
                    </>
                  )}
                </div>
              );
            },
          },
        ]}
      />
    </div>
  );
}
