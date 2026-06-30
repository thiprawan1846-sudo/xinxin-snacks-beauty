"use client";

import { useEffect, useState } from "react";
import { X, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageInput } from "@/components/admin/image-input";
import { cn } from "@/lib/utils";
import type { Product, ProductStatus } from "@/types";

type CategorySlug = "snacks" | "beauty" | "drinks";

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
 */
export function ProductDrawer({ open, product, onClose, onSaved }: Props) {
  const [form, setForm] = useState<FormState>(toForm(product));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form whenever the drawer opens or the target product changes.
  useEffect(() => {
    if (open) {
      setForm(toForm(product));
      setError(null);
    }
  }, [open, product]);

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
      onSaved(json.data as Product, isNew);
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

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
              <Field label="库存数量" required>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={form.stock}
                  onChange={(e) => set("stock", e.target.value)}
                  placeholder="0"
                />
              </Field>
            </div>

            <Field label="商品图片" required>
              <ImageInput
                value={form.imageUrl}
                onChange={(url) => set("imageUrl", url)}
              />
            </Field>

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

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-ink-soft">
        {label}
        {required && <span className="ml-0.5 text-rose-500">*</span>}
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
