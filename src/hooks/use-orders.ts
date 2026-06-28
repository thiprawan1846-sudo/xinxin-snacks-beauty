"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Order, OrderStatus } from "@/types";

interface OrderState {
  orders: Order[];
  setOrders: (orders: Order[]) => void;
  create: (order: Order) => void;
  updateStatus: (id: string, status: OrderStatus) => void;
  getById: (id: string) => Order | undefined;
}

/**
 * Client-side order cache. Hydrated from /api/orders on mount; mutations
 * are optimistic and should be followed by API calls to persist to the DB.
 */
export const useOrders = create<OrderState>()(
  persist(
    (set, get) => ({
      orders: [],
      setOrders: (orders) => set({ orders }),
      create: (order) => set((s) => ({ orders: [order, ...s.orders] })),
      updateStatus: (id, status) =>
        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === id
              ? { ...o, status, updatedAt: new Date().toISOString() }
              : o,
          ),
        })),
      getById: (id) => get().orders.find((o) => o.id === id),
    }),
    {
      name: "xinxin-orders",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ orders: state.orders }),
    },
  ),
);
