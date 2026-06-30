"use client";

import { useEffect, useMemo, useState } from "react";
import { X, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageInput } from "@/components/admin/image-input";
import { cn } from "@/lib/utils";
import {
  PRODUCT_SIZES,
  PRODUCT_COLORS,
  COLOR_META,
  categoryHasVariants,
} from "@/lib/constants";
import type {
  Product,
  ProductColor,
  ProductSize,
  ProductStatus,
  ProductVariant,
} from "@/types";

type CategorySlug = "snacks" | "beauty" | "drinks" | "clothing";

/** drawer 内部维护的 SKU 草稿 */
interface VariantDraft {
  size: ProductSize;
  color: ProductColor;
  stock: number;
  priceOverride: string; // 用 string 方便受控输入；空串 = 不覆盖
}

interface FormState {
  name: string;
  nameTh: string;
  description: string;
  descriptionTh: string;
  category: CategorySlug;
  brand: string;
  price: string;
  stock: string;
  imageUrl: string;
  status: ProductStatus;
  isFeatured: boolean;
  isHot: boolean;
}

function toForm(p: Product | null): FormState {
  return {
    name: p?.name ?? "",
    nameTh: p?.nameTh ?? "",
    description: p?.description ?? "",
    descriptionTh: p?.descriptionTh ?? "",
    category: (p?.category as CategorySlug) ?? "snacks",
    brand: p?.brand ?? "",
    price: p ? String(p.price) : "",
    stock: p ? String(p.stock) : "",
    imageUrl: p?.imageUrl ?? "",
    status: p?.status ?? "ACTIVE",
    isFeatured: p?.isFeatured ?? false,
    isHot: p?.isHot ?? false,
  };
}

interface Props {
  open: boolean;
  /** product to edit, or null when creating */
  product: Product | null;
  onClose: () => void;
  onSaved: (product: Product, isNew: boolean) => void;
}

/**
 * Right-side slide-over drawer for creating or editing a product.
 * Create → POST /api/admin/products ; Edit → PATCH /api/admin/products/:id
 * 服饰分类额外保存 SKU → PUT /api/admin/products/:id/variants
 */
export function ProductDrawer({ open, product, onClose, onSaved }: Props) {
  const [form, setForm] = useState<FormState>(toForm(product));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 服饰规格
  const [selectedSizes, setSelectedSizes] = useState<ProductSize[]>([]);
  const [selectedColors, setSelectedColors] = useState<ProductColor[]>([]);
  const [variantDrafts, setVariantDrafts] = useState<Record<string, VariantDraft>>({});
  const [variantsLoaded, setVariantsLoaded] = useState(false);

  const isClothing = categoryHasVariants(form.category);

  // Reset form whenever the drawer opens or the target product changes.
  useEffect(() => {
    if (open) {
      setForm(toForm(product));
      setError(null);
      setSelectedSizes([]);
      setSelectedColors([]);
      setVariantDrafts({});
      setVariantsLoaded(false);

      // 编辑服饰商品：拉取已有 SKU
      if (product && categoryHasVariants(product.category)) {
        void loadVariants(product.id);
      } else {
        setVariantsLoaded(true);
      }
    }
  }, [open, product]);

  async function loadVariants(productId: string) {
    try {
      const res = await fetch(`/api/admin/products/${productId}/variants`);
      if (!res.ok) return;
      const { data } = (await res.json()) as { data: ProductVariant[] };
      const sizes = new Set<ProductSize>();
      const colors = new Set<ProductColor>();
      const drafts: Record<string, VariantDraft> = {};
      for (const v of data) {
        if (v.size) sizes.add(v.size);
        if (v.color) colors.add(v.color);
        if (v.size && v.color) {
          drafts[skuKey(v.size, v.color)] = {
            size: v.size,
            color: v.color,
            stock: v.stock,
            priceOverride:
              v.priceOverride != null ? String(v.priceOverride) : "",
          };
        }
      }
      setSelectedSizes(
        PRODUCT_SIZES.map((s) => s.value).filter((s) => sizes.has(s)),
      );
      setSelectedColors(
        PRODUCT_COLORS.map((c) => c.value).filter((c) => colors.has(c)),
      );
      setVariantDrafts(drafts);
    } finally {
      setVariantsLoaded(true);
    }
  }

  // Esc to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const isNew = !product;
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  function validate(): string | null {
    if (!form.nameTh.trim()) return "请填写商品名称（泰文）";
    if (!form.name.trim()) return "请填写商品名称（英文）";
    if (!form.price || Number(form.price) < 0) return "请填写有效的价格";
    if (form.stock === "" || Number(form.stock) < 0) return "请填写有效的库存";
    if (!form.imageUrl.trim()) return "请上传或填写商品图片";
    if (isClothing) {
      if (selectedSizes.length === 0) return "服饰商品请至少选择一个尺码";
      if (selectedColors.length === 0) return "服饰商品请至少选择一个颜色";
    }
    return null;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setSaving(true);
    setError(null);

    const payload = {
      name: form.name.trim(),
      nameTh: form.nameTh.trim(),
      description: form.description.trim(),
      descriptionTh: form.descriptionTh.trim() || form.description.trim(),
      category: form.category,
      brand: form.brand.trim() || undefined,
      price: Number(form.price),
      stock: Number(form.stock),
      imageUrl: form.imageUrl.trim(),
      status: form.status,
      isFeatured: form.isFeatured,
      isHot: form.isHot,
    };

    try {
      const res = isNew
        ? await fetch("/api/admin/products", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch(`/api/admin/products/${product!.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "保存失败");
      const saved: Product = json.data;

      // 服饰：保存 SKU
      if (categoryHasVariants(form.category)) {
        const variantsPayload = buildVariantPayload();
        const vRes = await fetch(
          `/api/admin/products/${saved.id}/variants`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ variants: variantsPayload }),
          },
        );
        const vJson = await vRes.json();
        if (!vRes.ok) throw new Error(vJson.error ?? "规格保存失败");
        saved.variants = vJson.data;
      }

      onSaved(saved, isNew);
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  /** 从 selectedSizes × selectedColors + variantDrafts 组装最终 SKU 列表。 */
  function buildVariantPayload() {
    const out: {
      size: ProductSize;
      color: ProductColor;
      stock: number;
      priceOverride: number | null;
    }[] = [];
    for (const size of selectedSizes) {
      for (const color of selectedColors) {
        const d = variantDrafts[skuKey(size, color)];
        const stock = d ? Math.max(0, Math.floor(Number(d.stock) || 0)) : 0;
        const priceOverride =
          d && d.priceOverride.trim() !== "" ? Number(d.priceOverride) : null;
        out.push({ size, color, stock, priceOverride });
      }
    }
    return out;
  }

  // SKU 矩阵总库存（用于显示）
  const totalSkuStock = useMemo(
    () =>
      Object.values(variantDrafts).reduce(
        (sum, d) => sum + (Math.max(0, Math.floor(Number(d.stock) || 0))),
        0,
      ),
    [variantDrafts],
  );

  return (
    <>
      {/* Scrim */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-ink/30 backdrop-blur-sm transition-opacity duration-300",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
        aria-hidden
      />

      {/* Panel */}
      <aside
        className={cn(
          "fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-float transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full",
        )}
        role="dialog"
        aria-modal="true"
        aria-label={isNew ? "新增商品" : "编辑商品"}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-sakura-100 px-6 py-4">
          <div>
            <h2 className="font-display text-lg font-bold text-ink">
              {isNew ? "新增商品" : "编辑商品"}
            </h2>
            <p className="text-xs text-ink-muted">
              {isNew ? "创建一条新的商品记录" : "修改商品信息后保存生效"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full text-ink-muted transition-colors hover:bg-sakura-50 hover:text-ink"
            aria-label="关闭"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={submit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
            <div className="grid grid-cols-2 gap-3">
              <Field label="商品名称（泰文）" required>
                <Input
                  value={form.nameTh}
                  onChange={(e) => set("nameTh", e.target.value)}
                  placeholder="เช่น ขนมปังกรอบ"
                />
              </Field>
              <Field label="商品名称（英文）" required>
                <Input
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="e.g. Cracker"
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="商品分类" required>
                <SelectInput
                  value={form.category}
                  onChange={(v) => set("category", v as CategorySlug)}
                  options={[
                    { value: "snacks", label: "零食" },
                    { value: "beauty", label: "美妆" },
                    { value: "drinks", label: "饮料" },
                    { value: "clothing", label: "服饰" },
                  ]}
                />
              </Field>
              <Field label="品牌">
                <Input
                  value={form.brand}
                  onChange={(e) => set("brand", e.target.value)}
                  placeholder="如 Lay's / Maybelline"
                />
              </Field>
            </div>

            <Field label="商品描述（泰文）">
              <textarea
                value={form.descriptionTh}
                onChange={(e) => set("descriptionTh", e.target.value)}
                rows={2}
                placeholder="รายละเอียดสินค้า..."
                className="w-full rounded-2xl border border-sakura-200 bg-white/80 px-4 py-2.5 text-sm text-ink outline-none transition-colors focus:border-sakura-400 focus:ring-2 focus:ring-sakura-200"
              />
            </Field>
            <Field label="商品描述（英文）">
              <textarea
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                rows={2}
                placeholder="Product description..."
                className="w-full rounded-2xl border border-sakura-200 bg-white/80 px-4 py-2.5 text-sm text-ink outline-none transition-colors focus:border-sakura-400 focus:ring-2 focus:ring-sakura-200"
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="商品价格 (THB)" required>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => set("price", e.target.value)}
                  placeholder="0.00"
                />
              </Field>
              <Field
                label={isClothing ? "商品总库存（参考）" : "库存数量"}
                required
                hint={
                  isClothing
                    ? "服饰按 SKU 库存自动统计"
                    : undefined
                }
              >
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={isClothing ? String(totalSkuStock) : form.stock}
                  onChange={(e) => !isClothing && set("stock", e.target.value)}
                  placeholder="0"
                  disabled={isClothing}
                  readOnly={isClothing}
                />
              </Field>
            </div>

            <Field label="商品图片" required>
              <ImageInput
                value={form.imageUrl}
                onChange={(url) => set("imageUrl", url)}
              />
            </Field>

            {/* ───────── 服饰规格编辑器 ───────── */}
            {isClothing && (
              <VariantEditor
                loaded={variantsLoaded}
                selectedSizes={selectedSizes}
                selectedColors={selectedColors}
                variantDrafts={variantDrafts}
                onToggleSize={(s) => toggleSize(s, selectedSizes, setSelectedSizes, variantDrafts, setVariantDrafts)}
                onToggleColor={(c) => toggleColor(c, selectedColors, setSelectedColors, variantDrafts, setVariantDrafts)}
                onDraftChange={(size, color, field, value) =>
                  setVariantDrafts((prev) => ({
                    ...prev,
                    [skuKey(size, color)]: {
                      ...(prev[skuKey(size, color)] ?? {
                        size,
                        color,
                        stock: 0,
                        priceOverride: "",
                      }),
                      [field]: value,
                    },
                  }))
                }
                onBulkStock={(stock) => {
                  setVariantDrafts((prev) => {
                    const next = { ...prev };
                    for (const s of selectedSizes) {
                      for (const c of selectedColors) {
                        const k = skuKey(s, c);
                        next[k] = {
                          ...(next[k] ?? { size: s, color: c, stock: 0, priceOverride: "" }),
                          stock,
                        };
                      }
                    }
                    return next;
                  });
                }}
              />
            )}

            <Field label="商品状态">
              <div className="flex gap-2">
                <StatusChip
                  active={form.status === "ACTIVE"}
                  tone="green"
                  onClick={() => set("status", "ACTIVE")}
                >
                  上架
                </StatusChip>
                <StatusChip
                  active={form.status === "INACTIVE"}
                  tone="gray"
                  onClick={() => set("status", "INACTIVE")}
                >
                  下架
                </StatusChip>
              </div>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <ToggleRow
                label="推荐商品"
                checked={form.isFeatured}
                onChange={(v) => set("isFeatured", v)}
              />
              <ToggleRow
                label="热门商品"
                checked={form.isHot}
                onChange={(v) => set("isHot", v)}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-2 border-t border-sakura-100 px-6 py-4">
            {error && (
              <p className="mr-auto self-center text-xs text-rose-600">{error}</p>
            )}
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={saving}
            >
              取消
            </Button>
            <Button type="submit" variant="gradient" disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saving ? "保存中..." : "保存"}
            </Button>
          </div>
        </form>
      </aside>
    </>
  );
}

// ───────────────────── Variant Editor ─────────────────────

function VariantEditor({
  loaded,
  selectedSizes,
  selectedColors,
  variantDrafts,
  onToggleSize,
  onToggleColor,
  onDraftChange,
  onBulkStock,
}: {
  loaded: boolean;
  selectedSizes: ProductSize[];
  selectedColors: ProductColor[];
  variantDrafts: Record<string, VariantDraft>;
  onToggleSize: (s: ProductSize) => void;
  onToggleColor: (c: ProductColor) => void;
  onDraftChange: (
    size: ProductSize,
    color: ProductColor,
    field: "stock" | "priceOverride",
    value: string,
  ) => void;
  onBulkStock: (stock: number) => void;
}) {
  const [bulkStock, setBulkStock] = useState("");

  if (!loaded) {
    return (
      <div className="rounded-2xl border border-sakura-100 bg-sakura-50/40 p-4 text-center text-xs text-ink-muted">
        <Loader2 className="mx-auto mb-2 h-4 w-4 animate-spin" />
        กำลังโหลดข้อมูลสินค้า...
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-2xl border border-sakura-200 bg-sakura-50/40 p-4">
      <div className="flex items-center gap-2">
        <span className="text-sm">👕</span>
        <span className="text-sm font-semibold text-ink">服饰规格 (SKU)</span>
      </div>

      {/* 尺码多选 */}
      <div>
        <p className="mb-1.5 text-xs font-medium text-ink-soft">
          尺码 <span className="text-rose-500">*</span>
          <span className="ml-1 text-ink-muted">
            （已选 {selectedSizes.length}）
          </span>
        </p>
        <div className="flex flex-wrap gap-1.5">
          {PRODUCT_SIZES.map((s) => {
            const active = selectedSizes.includes(s.value);
            return (
              <button
                key={s.value}
                type="button"
                onClick={() => onToggleSize(s.value)}
                className={cn(
                  "grid h-8 min-w-8 place-items-center rounded-full border px-2.5 text-xs font-semibold transition-all active:scale-95",
                  active
                    ? "border-sakura-400 bg-sakura-500 text-white shadow-soft"
                    : "border-sakura-200 bg-white text-ink-soft hover:bg-sakura-50",
                )}
              >
                {s.value}
              </button>
            );
          })}
        </div>
      </div>

      {/* 颜色多选 */}
      <div>
        <p className="mb-1.5 text-xs font-medium text-ink-soft">
          颜色 <span className="text-rose-500">*</span>
          <span className="ml-1 text-ink-muted">
            （已选 {selectedColors.length}）
          </span>
        </p>
        <div className="flex flex-wrap gap-1.5">
          {PRODUCT_COLORS.map((c) => {
            const active = selectedColors.includes(c.value);
            return (
              <button
                key={c.value}
                type="button"
                onClick={() => onToggleColor(c.value)}
                className={cn(
                  "flex h-8 items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium transition-all active:scale-95",
                  active
                    ? "border-sakura-400 bg-sakura-100 text-ink shadow-soft"
                    : "border-sakura-200 bg-white text-ink-soft hover:bg-sakura-50",
                )}
                title={c.labelTh}
              >
                <span
                  className={cn(
                    "h-3.5 w-3.5 rounded-full border",
                    c.swatch,
                  )}
                />
                {c.labelTh}
              </button>
            );
          })}
        </div>
      </div>

      {/* SKU 矩阵 */}
      {selectedSizes.length > 0 && selectedColors.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-ink-soft">
              SKU 库存矩阵
              <span className="ml-1 text-ink-muted">
                ({selectedSizes.length}×{selectedColors.length} =
                {selectedSizes.length * selectedColors.length})
              </span>
            </p>
            {/* 批量设置 */}
            <div className="flex items-center gap-1">
              <Input
                type="number"
                min="0"
                value={bulkStock}
                onChange={(e) => setBulkStock(e.target.value)}
                placeholder="批量"
                className="h-7 w-16 px-2 text-xs"
              />
              <button
                type="button"
                onClick={() => {
                  const n = Number(bulkStock);
                  if (!Number.isNaN(n) && n >= 0) {
                    onBulkStock(Math.floor(n));
                    setBulkStock("");
                  }
                }}
                className="rounded-full bg-sakura-100 px-2.5 py-1 text-xs font-medium text-sakura-700 transition-colors hover:bg-sakura-200"
              >
                应用
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-sakura-100 bg-white">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-sakura-100 bg-sakura-50/60">
                  <th className="sticky left-0 z-10 bg-sakura-50/60 px-2 py-1.5 text-left font-semibold text-ink-soft">
                    Size \ Color
                  </th>
                  {selectedColors.map((c) => {
                    const meta = COLOR_META[c];
                    return (
                      <th
                        key={c}
                        className="px-2 py-1.5 text-center font-semibold text-ink-soft"
                      >
                        <span className="inline-flex items-center gap-1">
                          <span
                            className={cn(
                              "h-3 w-3 rounded-full border",
                              meta.swatch,
                            )}
                          />
                          {meta.labelTh}
                        </span>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {selectedSizes.map((size) => (
                  <tr
                    key={size}
                    className="border-b border-sakura-50 last:border-0"
                  >
                    <td className="sticky left-0 z-10 bg-white px-2 py-1.5 font-semibold text-ink">
                      {size}
                    </td>
                    {selectedColors.map((color) => {
                      const draft =
                        variantDrafts[skuKey(size, color)] ?? {
                          size,
                          color,
                          stock: 0,
                          priceOverride: "",
                        };
                      return (
                        <td key={color} className="px-1.5 py-1">
                          <input
                            type="number"
                            min="0"
                            value={draft.stock}
                            onChange={(e) =>
                              onDraftChange(size, color, "stock", e.target.value)
                            }
                            className="h-7 w-16 rounded-lg border border-sakura-200 bg-white px-1.5 text-center text-xs text-ink outline-none focus:border-sakura-400 focus:ring-1 focus:ring-sakura-200"
                            placeholder="0"
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-ink-muted">
            提示：每个颜色×尺码组合的库存独立管理。库存为 0 的 SKU 仍会保存但前台显示缺货。
          </p>
        </div>
      )}
    </div>
  );
}

// ───────────────────── helpers ─────────────────────

function skuKey(size: ProductSize, color: ProductColor): string {
  return `${size}__${color}`;
}

function toggleSize(
  size: ProductSize,
  selected: ProductSize[],
  setSelected: (s: ProductSize[]) => void,
  drafts: Record<string, VariantDraft>,
  setDrafts: (d: Record<string, VariantDraft>) => void,
) {
  if (selected.includes(size)) {
    setSelected(selected.filter((s) => s !== size));
    // 清理被移除 size 相关的草稿
    const next: Record<string, VariantDraft> = {};
    for (const [k, v] of Object.entries(drafts)) {
      if (v.size !== size) next[k] = v;
    }
    setDrafts(next);
  } else {
    setSelected([...selected, size]);
  }
}

function toggleColor(
  color: ProductColor,
  selected: ProductColor[],
  setSelected: (c: ProductColor[]) => void,
  drafts: Record<string, VariantDraft>,
  setDrafts: (d: Record<string, VariantDraft>) => void,
) {
  if (selected.includes(color)) {
    setSelected(selected.filter((c) => c !== color));
    const next: Record<string, VariantDraft> = {};
    for (const [k, v] of Object.entries(drafts)) {
      if (v.color !== color) next[k] = v;
    }
    setDrafts(next);
  } else {
    setSelected([...selected, color]);
  }
}

// ───────────────────── small UI atoms ─────────────────────

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-ink-soft">
        {label}
        {required && <span className="ml-0.5 text-rose-500">*</span>}
        {hint && <span className="ml-1 font-normal text-ink-muted">· {hint}</span>}
      </span>
      {children}
    </label>
  );
}

function SelectInput({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-11 w-full rounded-full border border-sakura-200 bg-white/80 px-5 text-sm text-ink outline-none transition-colors focus:border-sakura-400 focus:ring-2 focus:ring-sakura-200"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function StatusChip({
  active,
  tone,
  onClick,
  children,
}: {
  active: boolean;
  tone: "green" | "gray";
  onClick: () => void;
  children: React.ReactNode;
}) {
  const base =
    "flex-1 rounded-full px-4 py-2 text-sm font-semibold transition-all";
  const on =
    tone === "green"
      ? "bg-emerald-500 text-white shadow-soft"
      : "bg-zinc-500 text-white shadow-soft";
  const off = "bg-sakura-50 text-ink-muted ring-1 ring-inset ring-sakura-200";
  return (
    <button type="button" onClick={onClick} className={cn(base, active ? on : off)}>
      {children}
    </button>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center justify-between rounded-2xl border border-sakura-100 bg-white/60 px-4 py-3 text-sm font-medium text-ink-soft transition-colors hover:bg-sakura-50"
    >
      <span>{label}</span>
      <span
        className={cn(
          "relative h-6 w-11 rounded-full transition-colors",
          checked ? "bg-sakura-500" : "bg-sakura-200",
        )}
        aria-hidden
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-[22px]" : "translate-x-0.5",
          )}
        />
      </span>
    </button>
  );
}
