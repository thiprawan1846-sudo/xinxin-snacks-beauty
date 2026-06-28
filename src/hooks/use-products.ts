"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Product, ProductStatus } from "@/types";

interface ProductState {
  products: Product[];
  setProducts: (products: Product[]) => void;
  updateStock: (id: string, stock: number) => void;
  updateStatus: (id: string, status: ProductStatus) => void;
  updatePrice: (id: string, price: number) => void;
  upsert: (product: Product) => void;
  getById: (id: string) => Product | undefined;
}

/**
 * Client-side product cache for admin UI. Hydrated from /api/admin/products
 * on mount; mutations are optimistic and should be followed by API calls to
 * persist to the database.
 */
export const useProducts = create<ProductState>()(
  persist(
    (set, get) => ({
      products: [],
      setProducts: (products) => set({ products }),
      updateStock: (id, stock) =>
        set((s) => ({
          products: s.products.map((p) =>
            p.id === id ? { ...p, stock: Math.max(0, stock) } : p,
          ),
        })),
      updateStatus: (id, status) =>
        set((s) => ({
          products: s.products.map((p) =>
            p.id === id ? { ...p, status } : p,
          ),
        })),
      updatePrice: (id, price) =>
        set((s) => ({
          products: s.products.map((p) =>
            p.id === id ? { ...p, price: Math.max(0, price) } : p,
          ),
        })),
      upsert: (product) =>
        set((s) => {
          const exists = s.products.some((p) => p.id === product.id);
          return {
            products: exists
              ? s.products.map((p) => (p.id === product.id ? product : p))
              : [product, ...s.products],
          };
        }),
      getById: (id) => get().products.find((p) => p.id === id),
    }),
    {
      name: "xinxin-products",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ products: state.products }),
    },
  ),
);
