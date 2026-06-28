"use client";

import { useState } from "react";
import Link from "next/link";
import { SafeImage as Image } from "@/components/ui/safe-image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ProductDrawer } from "@/components/admin/product-drawer";
import { useAdminProducts } from "@/hooks/use-admin-products";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  RotateCcw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Loader2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { formatTHB, cn, paginationRange } from "@/lib/utils";
import { CATEGORY_LABEL, PRODUCT_STATUS_META } from "@/lib/constants";
import type { Product, ProductStatus } from "@/types";

type SortKey = "createdAt" | "name" | "price" | "stock";
const SORT_LABEL: Record<SortKey, string> = {
  createdAt: "最新创建",
  name: "商品名称",
  price: "价格",
  stock: "库存",
};

export default function AdminProductsPage() {
  const {
    data,
    total,
    loading,
    error,
    filters,
    setFilters,
    refresh,
    toggleStatus,
    remove,
    restore,
  } = useAdminProducts();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / filters.pageSize));

  function openCreate() {
    setEditing(null);
    setDrawerOpen(true);
  }
  function openEdit(p: Product) {
    setEditing(p);
    setDrawerOpen(true);
  }
  function onSaved(_p: Product, _isNew: boolean) {
    setDrawerOpen(false);
    refresh();
  }

  async function handleDelete(id: string) {
    setActionError(null);
    try {
      await remove(id);
      setConfirmId(null);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "删除失败");
    }
  }
  async function handleRestore(id: string) {
    setActionError(null);
    try {
      await restore(id);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "恢复失败");
    }
  }

  const confirmProduct = data.find((p) => p.id === confirmId) ?? null;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink md:text-3xl">
            商品管理
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            新增、编辑、上下架与软删除商品 · 共 {total} 件
            {filters.deleted ? "（回收站）" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={filters.deleted ? "secondary" : "ghost"}
            onClick={() => setFilters({ deleted: !filters.deleted })}
          >
            <RotateCcw className="h-4 w-4" />
            {filters.deleted ? "返回商品列表" : "回收站"}
          </Button>
          {!filters.deleted && (
            <Button variant="gradient" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              新增商品
            </Button>
          )}
        </div>
      </div>

      {/* Toolbar: search + filters + sort */}
      <div className="rounded-3xl border border-sakura-100/70 bg-white/80 p-3 shadow-soft backdrop-blur-sm">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-sakura-400" />
            <Input
              value={filters.search}
              onChange={(e) => setFilters({ search: e.target.value })}
              placeholder="搜索商品名称 / 品牌..."
              className="pl-11"
            />
          </div>

          {/* Category filter */}
          <FilterSelect
            value={filters.category}
            onChange={(v) => setFilters({ category: v })}
            options={[
              { value: "all", label: "全部分类" },
              { value: "snacks", label: CATEGORY_LABEL.snacks.label },
              { value: "beauty", label: CATEGORY_LABEL.beauty.label },
              { value: "drinks", label: CATEGORY_LABEL.drinks.label },
            ]}
          />

          {/* Status filter */}
          <FilterSelect
            value={filters.status}
            onChange={(v) => setFilters({ status: v as ProductStatus | "ALL" })}
            options={[
              { value: "ALL", label: "全部状态" },
              { value: "ACTIVE", label: "上架" },
              { value: "INACTIVE", label: "下架" },
            ]}
          />

          {/* Featured filter */}
          <FilterSelect
            value={String(filters.featured)}
            onChange={(v) =>
              setFilters({
                featured: v === "ALL" ? "ALL" : v === "true",
              })
            }
            options={[
              { value: "ALL", label: "推荐：全部" },
              { value: "true", label: "推荐：是" },
              { value: "false", label: "推荐：否" },
            ]}
          />

          {/* Hot filter */}
          <FilterSelect
            value={String(filters.hot)}
            onChange={(v) =>
              setFilters({ hot: v === "ALL" ? "ALL" : v === "true" })
            }
            options={[
              { value: "ALL", label: "热门：全部" },
              { value: "true", label: "热门：是" },
              { value: "false", label: "热门：否" },
            ]}
          />

          {/* Sort */}
          <div className="flex items-center gap-1">
            <FilterSelect
              value={filters.sort}
              onChange={(v) => setFilters({ sort: v as SortKey })}
              options={(Object.keys(SORT_LABEL) as SortKey[]).map((k) => ({
                value: k,
                label: SORT_LABEL[k],
              }))}
            />
            <button
              onClick={() =>
                setFilters({
                  order: filters.order === "asc" ? "desc" : "asc",
                })
              }
              className="grid h-11 w-11 place-items-center rounded-full border border-sakura-200 bg-white/80 text-ink-soft transition-colors hover:bg-sakura-50"
              title={filters.order === "asc" ? "升序" : "降序"}
            >
              {filters.order === "asc" ? (
                <ArrowUp className="h-4 w-4" />
              ) : (
                <ArrowDown className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Error banner */}
      {(error || actionError) && (
        <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error ?? actionError}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-3xl border border-sakura-100/70 bg-white/80 shadow-soft backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-sakura-100/70 bg-sakura-50/50">
                <th className="w-10 px-4 py-3.5">
                  {/* reserved for batch selection */}
                  <input
                    type="checkbox"
                    disabled
                    className="h-4 w-4 rounded border-sakura-300 text-sakura-500 opacity-40"
                    aria-label="批量选择（预留）"
                  />
                </th>
                <Th>商品</Th>
                <Th>分类</Th>
                <Th>品牌</Th>
                <Th
                  sortable
                  active={filters.sort === "price"}
                  order={filters.order}
                  onClick={() => toggleSort("price")}
                >
                  价格
                </Th>
                <Th
                  sortable
                  active={filters.sort === "stock"}
                  order={filters.order}
                  onClick={() => toggleSort("stock")}
                >
                  库存
                </Th>
                <Th>状态</Th>
                <Th>标记</Th>
                <th className="px-4 py-3.5 text-right font-display text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sakura-50">
              {loading && data.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-16 text-center text-ink-muted">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-sakura-400" />
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-16 text-center text-ink-muted">
                    <span className="mb-1 block text-3xl">🪹</span>
                    {filters.deleted ? "回收站为空" : "暂无符合条件的商品"}
                  </td>
                </tr>
              ) : (
                data.map((p) => (
                  <ProductRow
                    key={p.id}
                    p={p}
                    deleted={!!p.deletedAt}
                    binMode={filters.deleted}
                    onEdit={() => openEdit(p)}
                    onToggleStatus={() => toggleStatus(p)}
                    onAskDelete={() => setConfirmId(p.id)}
                    onRestore={() => handleRestore(p.id)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-sakura-100/70 px-5 py-3">
          <p className="text-xs text-ink-muted">
            第 {filters.page} / {totalPages} 页 · 共 {total} 条
          </p>
          <div className="flex items-center gap-1">
            <PagerBtn
              disabled={filters.page <= 1}
              onClick={() => setFilters({ page: filters.page - 1 })}
              aria-label="上一页"
            >
              <ChevronLeft className="h-4 w-4" />
            </PagerBtn>
            {paginationRange(filters.page, totalPages).map((n, i) =>
              n === "..." ? (
                <span key={`d${i}`} className="px-2 text-ink-muted">
                  …
                </span>
              ) : (
                <button
                  key={n}
                  onClick={() => setFilters({ page: n })}
                  className={cn(
                    "grid h-9 min-w-9 place-items-center rounded-full px-3 text-sm font-medium transition-colors",
                    n === filters.page
                      ? "bg-sakura-500 text-white shadow-soft"
                      : "text-ink-soft hover:bg-sakura-50",
                  )}
                >
                  {n}
                </button>
              ),
            )}
            <PagerBtn
              disabled={filters.page >= totalPages}
              onClick={() => setFilters({ page: filters.page + 1 })}
              aria-label="下一页"
            >
              <ChevronRight className="h-4 w-4" />
            </PagerBtn>
          </div>
        </div>
      </div>

      {/* Create / Edit drawer */}
      <ProductDrawer
        open={drawerOpen}
        product={editing}
        onClose={() => setDrawerOpen(false)}
        onSaved={onSaved}
      />

      {/* Delete confirmation */}
      {confirmProduct && (
        <ConfirmDialog
          name={confirmProduct.nameTh || confirmProduct.name}
          onCancel={() => setConfirmId(null)}
          onConfirm={() => handleDelete(confirmProduct.id)}
        />
      )}
    </div>
  );

  function toggleSort(key: SortKey) {
    setFilters((f) => ({
      sort: key,
      order: f.sort === key && f.order === "desc" ? "asc" : "desc",
    }));
  }
}

function ProductRow({
  p,
  deleted,
  binMode,
  onEdit,
  onToggleStatus,
  onAskDelete,
  onRestore,
}: {
  p: Product;
  deleted: boolean;
  binMode: boolean;
  onEdit: () => void;
  onToggleStatus: () => void;
  onAskDelete: () => void;
  onRestore: () => void;
}) {
  const meta = PRODUCT_STATUS_META[p.status];
  const cat = CATEGORY_LABEL[p.category as keyof typeof CATEGORY_LABEL];
  return (
    <tr className={cn("transition-colors hover:bg-sakura-50/60", deleted && "opacity-60")}>
      <td className="px-4 py-4">
        <input
          type="checkbox"
          disabled
          className="h-4 w-4 rounded border-sakura-300 text-sakura-500 opacity-40"
          aria-label="批量选择（预留）"
        />
      </td>
      <td className="px-4 py-4">
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
            <p className="line-clamp-1 text-xs text-ink-muted">{p.name}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-4">
        <Badge variant="outline">
          {cat ? `${cat.emoji} ${cat.label}` : p.category}
        </Badge>
      </td>
      <td className="px-4 py-4 text-sm text-ink-soft">
        {p.brand || <span className="text-ink-muted">—</span>}
      </td>
      <td className="px-4 py-4">
        <span className="font-display font-semibold text-ink">
          {formatTHB(p.price)}
        </span>
      </td>
      <td className="px-4 py-4">
        <span
          className={cn(
            "font-semibold",
            p.stock === 0
              ? "text-rose-500"
              : p.stock <= 15
                ? "text-amber-600"
                : "text-ink-soft",
          )}
        >
          {p.stock}
        </span>
      </td>
      <td className="px-4 py-4">
        {binMode ? (
          <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
            已删除
          </span>
        ) : (
          <button
            onClick={onToggleStatus}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-opacity hover:opacity-80",
              meta.className,
            )}
            title="点击切换上下架"
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                p.status === "ACTIVE" ? "bg-emerald-500" : "bg-zinc-400",
              )}
            />
            {meta.label}
          </button>
        )}
      </td>
      <td className="px-4 py-4">
        <div className="flex gap-1">
          {p.isFeatured && (
            <span className="rounded-full bg-sakura-100 px-2 py-0.5 text-[10px] font-semibold text-sakura-700">
              推荐
            </span>
          )}
          {p.isHot && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
              热门
            </span>
          )}
          {!p.isFeatured && !p.isHot && (
            <span className="text-ink-muted">—</span>
          )}
        </div>
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center justify-end gap-1">
          {binMode ? (
            <button
              onClick={onRestore}
              className="grid h-8 w-8 place-items-center rounded-full text-emerald-600 transition-colors hover:bg-emerald-50"
              title="恢复商品"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          ) : (
            <>
              <button
                onClick={onEdit}
                className="grid h-8 w-8 place-items-center rounded-full text-ink-muted transition-colors hover:bg-sakura-50 hover:text-sakura-600"
                title="编辑"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={onAskDelete}
                className="grid h-8 w-8 place-items-center rounded-full text-rose-600 transition-colors hover:bg-rose-50"
                title="删除"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          )}
          <Link
            href={`/products/${p.id}`}
            className="grid h-8 w-8 place-items-center rounded-full text-ink-muted transition-colors hover:bg-sakura-50 hover:text-sakura-600"
            title="查看前台页"
          >
            <ArrowUpDown className="h-3.5 w-3.5 rotate-45" />
          </Link>
        </div>
      </td>
    </tr>
  );
}

function Th({
  children,
  sortable,
  active,
  order,
  onClick,
}: {
  children: React.ReactNode;
  sortable?: boolean;
  active?: boolean;
  order?: "asc" | "desc";
  onClick?: () => void;
}) {
  return (
    <th className="px-4 py-3.5 font-display text-xs font-semibold uppercase tracking-wide text-ink-muted">
      {sortable ? (
        <button
          onClick={onClick}
          className={cn(
            "inline-flex items-center gap-1 transition-colors hover:text-ink",
            active && "text-sakura-600",
          )}
        >
          {children}
          {active &&
            (order === "asc" ? (
              <ArrowUp className="h-3 w-3" />
            ) : (
              <ArrowDown className="h-3 w-3" />
            ))}
        </button>
      ) : (
        children
      )}
    </th>
  );
}

function FilterSelect({
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
      className="h-11 rounded-full border border-sakura-200 bg-white/80 px-4 text-sm text-ink-soft outline-none transition-colors focus:border-sakura-400 focus:ring-2 focus:ring-sakura-200"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function PagerBtn({
  children,
  disabled,
  onClick,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="grid h-9 w-9 place-items-center rounded-full text-ink-soft transition-colors hover:bg-sakura-50 disabled:opacity-40 disabled:hover:bg-transparent"
      {...rest}
    >
      {children}
    </button>
  );
}

function ConfirmDialog({
  name,
  onCancel,
  onConfirm,
}: {
  name: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-float">
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-rose-100">
          <AlertTriangle className="h-5 w-5 text-rose-600" />
        </div>
        <h3 className="font-display text-lg font-bold text-ink">确定删除该商品吗？</h3>
        <p className="mt-1.5 text-sm text-ink-soft">
          将对「{name}」执行软删除：数据库记录保留，前台不再展示，可在回收站恢复。
        </p>
        <div className="mt-5 flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={onCancel}>
            取消
          </Button>
          <Button variant="destructive" className="flex-1" onClick={onConfirm}>
            <Trash2 className="h-4 w-4" />
            确认删除
          </Button>
        </div>
      </div>
    </div>
  );
}
