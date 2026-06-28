"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types";
import { useCart } from "@/hooks/use-cart";
import { useOrders } from "@/hooks/use-orders";
import { useProducts } from "@/hooks/use-products";

interface AuthState {
  user: User | null;
  loading: boolean;
  /** Hydrate from /api/auth/me on first load. */
  fetchUser: () => Promise<void>;
  /** Log in with email + password. Returns { ok, error? }. */
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  /** Register a new account. Returns { ok, error? }. */
  register: (input: {
    name: string;
    email: string;
    password: string;
  }) => Promise<{ ok: boolean; error?: string }>;
  /** Log out and clear state. */
  logout: () => Promise<void>;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      loading: true,

      fetchUser: async () => {
        try {
          const res = await fetch("/api/auth/me", { cache: "no-store" });
          if (res.ok) {
            const { data } = await res.json();
            set({ user: data ?? null, loading: false });
            if (data) void useCart.getState().hydrate();
          } else {
            set({ user: null, loading: false });
          }
        } catch {
          set({ user: null, loading: false });
        }
      },

      login: async (email, password) => {
        try {
          const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          });
          const json = await res.json();
          if (!res.ok) return { ok: false, error: json.error ?? "เข้าสู่ระบบไม่สำเร็จ" };
          set({ user: json.data });
          // Reset cart hydration flag then load the server-side cart.
          useCart.setState({ hydrated: false });
          void useCart.getState().hydrate();
          return { ok: true };
        } catch {
          return { ok: false, error: "เกิดข้อผิดพลาด กรุณาลองอีกครั้ง" };
        }
      },

      register: async ({ name, email, password }) => {
        try {
          const res = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password }),
          });
          const json = await res.json();
          if (!res.ok) return { ok: false, error: json.error ?? "สมัครสมาชิกไม่สำเร็จ" };
          set({ user: json.data });
          useCart.setState({ hydrated: false });
          void useCart.getState().hydrate();
          return { ok: true };
        } catch {
          return { ok: false, error: "เกิดข้อผิดพลาด กรุณาลองอีกครั้ง" };
        }
      },

      logout: async () => {
        try {
          await fetch("/api/auth/logout", { method: "POST" });
        } finally {
          set({ user: null });
          // Reset persisted stores so the next user doesn't see the previous
          // user's (or admin's) orders/products/cart from localStorage.
          useCart.setState({ items: [], hydrated: false });
          useOrders.setState({ orders: [] });
          useProducts.setState({ products: [] });
        }
      },
    }),
    {
      name: "xinxin-auth",
      partialize: (s) => ({ user: s.user }),
    },
  ),
);
