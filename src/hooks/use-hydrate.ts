"use client";

import { useEffect } from "react";
import { useProducts } from "@/hooks/use-products";
import { useOrders } from "@/hooks/use-orders";

/**
 * Hydrate client stores from the API on mount.
 *
 * Call once in a client page that renders product/order lists:
 *   useHydrate({ products: true });      // fetches /api/admin/products
 *   useHydrate({ orders: true });        // fetches /api/admin/orders
 *   useHydrate({ userOrders: true });    // fetches /api/orders?userId=...
 *
 * Skipped if the store already has data (persisted from localStorage).
 */
export function useHydrate(options: {
  products?: boolean;
  orders?: boolean;
  userOrders?: boolean;
  userId?: string;
}) {
  const setProducts = useProducts((s) => s.setProducts);
  const products = useProducts((s) => s.products);
  const setOrders = useOrders((s) => s.setOrders);
  const orders = useOrders((s) => s.orders);

  useEffect(() => {
    if (options.products && products.length === 0) {
      fetch("/api/admin/products")
        .then((r) => r.json())
        .then((d) => d.data && setProducts(d.data))
        .catch(() => {});
    }
    if (options.orders && orders.length === 0) {
      fetch("/api/admin/orders")
        .then((r) => r.json())
        .then((d) => d.data && setOrders(d.data))
        .catch(() => {});
    }
    if (options.userOrders && orders.length === 0) {
      const url = options.userId
        ? `/api/orders?userId=${encodeURIComponent(options.userId)}`
        : "/api/orders";
      fetch(url)
        .then((r) => r.json())
        .then((d) => d.data && setOrders(d.data))
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
