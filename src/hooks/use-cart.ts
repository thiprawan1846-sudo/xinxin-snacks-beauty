"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CartItem, Product, ProductColor, ProductSize } from "@/types";

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  /** True once we've attempted to load the server-side cart for the current user. */
  hydrated: boolean;
  add: (
    product: Product,
    qty?: number,
    variant?: { id: string; size?: ProductSize | null; color?: ProductColor | null },
  ) => void;
  remove: (productId: string, variantId?: string | null) => void;
  updateQty: (productId: string, qty: number, variantId?: string | null) => void;
  clear: () => void;
  setOpen: (open: boolean) => void;
  /** Replace local items with the server-side cart. Called after login/mount. */
  hydrate: () => Promise<void>;
  totalItems: () => number;
  totalAmount: () => number;
}

/** 购物车行的唯一 key：productId + variantId（同一商品不同 SKU 各占一行）。 */
function cartKey(productId: string, variantId?: string | null): string {
  return variantId ? `${productId}__${variantId}` : productId;
}

/** Push the current items array to the server. No-op for guests. */
async function syncToServer(items: CartItem[]) {
  try {
    await fetch("/api/cart", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          variantId: i.variantId ?? null,
          size: i.size ?? null,
          color: i.color ?? null,
        })),
      }),
    });
  } catch {
    // Fire-and-forget; local state is the source of truth for the UI.
  }
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      hydrated: false,

      add: (product, qty = 1, variant) =>
        set((state) => {
          const vId = variant?.id ?? null;
          const key = cartKey(product.id, vId);
          // 服饰 SKU 库存；非服饰沿用 Product.stock
          const stock = variant ? variantStock(product, vId) : product.stock;
          const clampedQty = Math.min(qty, stock);
          if (clampedQty <= 0) return state;

          const existing = state.items.find((i) => cartKey(i.productId, i.variantId) === key);
          let items: CartItem[];
          if (existing) {
            items = state.items.map((i) =>
              cartKey(i.productId, i.variantId) === key
                ? { ...i, quantity: Math.min(i.quantity + qty, stock) }
                : i,
            );
          } else {
            items = [
              ...state.items,
              {
                productId: product.id,
                name: product.name,
                nameTh: product.nameTh,
                price: product.price,
                imageUrl: product.imageUrl,
                quantity: clampedQty,
                stock,
                variantId: vId,
                size: variant?.size ?? null,
                color: variant?.color ?? null,
              },
            ];
          }
          void syncToServer(items);
          return { items, isOpen: true };
        }),

      remove: (productId, variantId) =>
        set((state) => {
          const key = cartKey(productId, variantId);
          const items = state.items.filter(
            (i) => cartKey(i.productId, i.variantId) !== key,
          );
          void syncToServer(items);
          return { items };
        }),

      updateQty: (productId, qty, variantId) =>
        set((state) => {
          const key = cartKey(productId, variantId);
          const items = state.items.map((i) =>
            cartKey(i.productId, i.variantId) === key
              ? { ...i, quantity: Math.max(1, Math.min(qty, i.stock)) }
              : i,
          );
          void syncToServer(items);
          return { items };
        }),

      clear: () => {
        set({ items: [] });
        void syncToServer([]);
      },

      setOpen: (open) => set({ isOpen: open }),

      hydrate: async () => {
        if (get().hydrated) return;
        try {
          const res = await fetch("/api/cart", { cache: "no-store" });
          if (res.ok) {
            const { data } = (await res.json()) as { data: CartItem[] };
            const serverItems = Array.isArray(data) ? data : [];
            // Merge: server items win; any local-only items are appended
            // so a guest's pre-login cart isn't silently dropped.
            const local = get().items;
            const serverKeys = new Set(
              serverItems.map((i) => cartKey(i.productId, i.variantId)),
            );
            const localOnly = local.filter(
              (i) => !serverKeys.has(cartKey(i.productId, i.variantId)),
            );
            const merged =
              localOnly.length > 0 ? [...serverItems, ...localOnly] : serverItems;
            set({ items: merged, hydrated: true });
            // Push the merged result back so the server is in sync.
            if (localOnly.length > 0) void syncToServer(merged);
            return;
          }
        } catch {
          // ignore — fall back to local storage
        }
        set({ hydrated: true });
      },

      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      totalAmount: () =>
        get().items.reduce((sum, i) => sum + i.quantity * i.price, 0),
    }),
    {
      name: "xinxin-cart",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
    },
  ),
);

/** 从 product.variants 中取指定 SKU 的库存。 */
function variantStock(product: Product, variantId: string | null): number {
  if (!variantId || !product.variants) return product.stock;
  return product.variants.find((v) => v.id === variantId)?.stock ?? 0;
}
