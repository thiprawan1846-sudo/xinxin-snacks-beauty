"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CartItem, Product } from "@/types";

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  /** True once we've attempted to load the server-side cart for the current user. */
  hydrated: boolean;
  add: (product: Product, qty?: number) => void;
  remove: (productId: string) => void;
  updateQty: (productId: string, qty: number) => void;
  clear: () => void;
  setOpen: (open: boolean) => void;
  /** Replace local items with the server-side cart. Called after login/mount. */
  hydrate: () => Promise<void>;
  totalItems: () => number;
  totalAmount: () => number;
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

      add: (product, qty = 1) =>
        set((state) => {
          const existing = state.items.find((i) => i.productId === product.id);
          let items: CartItem[];
          if (existing) {
            items = state.items.map((i) =>
              i.productId === product.id
                ? { ...i, quantity: Math.min(i.quantity + qty, i.stock) }
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
                quantity: Math.min(qty, product.stock),
                stock: product.stock,
              },
            ];
          }
          void syncToServer(items);
          return { items, isOpen: true };
        }),

      remove: (productId) =>
        set((state) => {
          const items = state.items.filter((i) => i.productId !== productId);
          void syncToServer(items);
          return { items };
        }),

      updateQty: (productId, qty) =>
        set((state) => {
          const items = state.items.map((i) =>
            i.productId === productId
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
            const serverIds = new Set(serverItems.map((i) => i.productId));
            const localOnly = local.filter((i) => !serverIds.has(i.productId));
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
