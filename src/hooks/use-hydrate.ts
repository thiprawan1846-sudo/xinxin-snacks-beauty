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
 * Always fetches on mount so the UI reflects the latest database state,
 * not stale localStorage cache.
 */
export function useHydrate(options: {
  products?: boolean;
  orders?: boolean;
  userOrders?: boolean;
  userId?: string;
}) {
  const setProducts = useProducts((s) => s.setProducts);
  const setOrders = useOrders((s) => s.setOrders);

  useEffect(() => {
    if (options.products) {
      fetch("/api/admin/products")
        .then((r) => r.json())
        .then((d) => d.data && setProducts(d.data))
        .catch(() => {});
    }
    if (options.orders) {
      fetch("/api/admin/orders")
        .then((r) => r.json())
        .then((d) => d.data && setOrders(d.data))
        .catch(() => {});
    }
    if (options.userOrders) {
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
