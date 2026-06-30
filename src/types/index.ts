/**
 * Domain types for XinXin Snacks & Beauty.
 * These mirror the Prisma schema and are shared across client/server.
 */

export type Category = "snacks" | "beauty" | "drinks" | "clothing" | "all";

export type ProductStatus = "ACTIVE" | "INACTIVE" | "DRAFT";

export interface Product {
  id: string;
  name: string;
  nameTh: string;
  description: string;
  descriptionTh: string;
  category: Exclude<Category, "all">;
  price: number;
  originalPrice?: number;
  stock: number;
  imageUrl: string;
  gallery?: string[];
  tags: string[];
  status: ProductStatus;
  rating: number;
  reviewCount: number;
  reason?: string; // 推荐理由 — why a friend recommends it
  brand?: string; // 品牌
  isFeatured: boolean; // 推荐商品
  isHot: boolean; // 热门商品
  deletedAt?: string | null; // 软删除时间，null = 未删除
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  productId: string;
  name: string;
  nameTh: string;
  price: number;
  imageUrl: string;
  quantity: number;
  stock: number;
}

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "SHIPPING"
  | "DELIVERED"
  | "CANCELLED";

export interface OrderItem {
  id: string;
  productId: string;
  name: string;
  nameTh: string;
  quantity: number;
  price: number;
  imageUrl: string;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: "CUSTOMER" | "ADMIN";
  createdAt: string;
}

export interface CategoryInfo {
  slug: Exclude<Category, "all">;
  label: string;
  labelTh: string;
  emoji: string;
  description: string;
  gradient: string;
}
