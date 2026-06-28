"use client";

import { useCallback, useEffect, useState } from "react";
import type { Product, ProductStatus } from "@/types";

/**
 * Admin product list query state. Mirrors the query params accepted by
 * GET /api/admin/products so the server does the heavy lifting (search,
 * filter, sort, paginate) against Supabase.
 */
export interface AdminProductFilters {
  search: string;
  category: string; // all | snacks | beauty | drinks
  status: ProductStatus | "ALL";
  featured: boolean | "ALL";
  hot: boolean | "ALL";
  deleted: boolean; // show soft-deleted bin?
  sort: "createdAt" | "name" | "price" | "stock";
  order: "asc" | "desc";
  page: number;
  pageSize: number;
}

export const DEFAULT_FILTERS: AdminProductFilters = {
  search: "",
  category: "all",
  status: "ALL",
  featured: "ALL",
  hot: "ALL",
  deleted: false,
  sort: "createdAt",
  order: "desc",
  page: 1,
  pageSize: 10,
};

export interface AdminProductState {
  data: Product[];
  total: number;
  loading: boolean;
  error: string | null;
  filters: AdminProductFilters;
  setFilters: (
    patch: Partial<AdminProductFilters> | ((f: AdminProductFilters) => Partial<AdminProductFilters>),
  ) => void;
  refresh: () => void;
  /** optimistic helpers that call the API then refresh */
  toggleStatus: (p: Product) => Promise<void>;
  remove: (id: string) => Promise<void>;
  restore: (id: string) => Promise<void>;
}

export function useAdminProducts(): AdminProductState {
  const [filters, setFiltersState] = useState<AdminProductFilters>(DEFAULT_FILTERS);
  const [data, setData] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const setFilters: AdminProductState["setFilters"] = useCallback((patch) => {
    setFiltersState((prev) => {
      const next = { ...prev, ...(typeof patch === "function" ? patch(prev) : patch) };
      // any filter change (except page) resets to page 1
      if (
        next.search !== prev.search ||
        next.category !== prev.category ||
        next.status !== prev.status ||
        next.featured !== prev.featured ||
        next.hot !== prev.hot ||
        next.deleted !== prev.deleted ||
        next.sort !== prev.sort ||
        next.order !== prev.order
      ) {
        next.page = 1;
      }
      return next;
    });
  }, []);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  // Fetch list whenever filters or refresh tick change.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const sp = new URLSearchParams();
    if (filters.search.trim()) sp.set("q", filters.search.trim());
    if (filters.category !== "all") sp.set("category", filters.category);
    if (filters.status !== "ALL") sp.set("status", filters.status);
    if (filters.featured !== "ALL") sp.set("featured", String(filters.featured));
    if (filters.hot !== "ALL") sp.set("hot", String(filters.hot));
    if (filters.deleted) sp.set("deleted", "true");
    sp.set("sort", filters.sort);
    sp.set("order", filters.order);
    sp.set("page", String(filters.page));
    sp.set("pageSize", String(filters.pageSize));

    fetch(`/api/admin/products?${sp.toString()}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`${res.status}`);
        return res.json() as Promise<{ data: Product[]; total: number }>;
      })
      .then((json) => {
        if (cancelled) return;
        setData(json.data);
        setTotal(json.total);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "加载失败");
      })
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [filters, tick]);

  const toggleStatus = useCallback(
    async (p: Product) => {
      const next: ProductStatus = p.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      // optimistic
      setData((rows) =>
        rows.map((r) => (r.id === p.id ? { ...r, status: next } : r)),
      );
      const res = await fetch(`/api/admin/products/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) {
        // revert on failure
        setData((rows) =>
          rows.map((r) => (r.id === p.id ? { ...r, status: p.status } : r)),
        );
        setError("上下架失败");
      }
    },
    [],
  );

  const remove = useCallback(async (id: string) => {
    const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("删除失败");
    refresh();
  }, [refresh]);

  const restore = useCallback(async (id: string) => {
    const res = await fetch(`/api/admin/products/${id}?restore=true`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("恢复失败");
    refresh();
  }, [refresh]);

  return {
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
  };
}
