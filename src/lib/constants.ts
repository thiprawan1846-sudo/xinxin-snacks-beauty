import type { OrderStatus, ProductStatus, Category } from "@/types";

export const ORDER_STATUS_META: Record<
  OrderStatus,
  { label: string; labelTh: string; emoji: string; className: string }
> = {
  PENDING: {
    label: "Pending",
    labelTh: "รอยืนยัน",
    emoji: "⏳",
    className: "bg-amber-100 text-amber-700 border-amber-200",
  },
  CONFIRMED: {
    label: "Confirmed",
    labelTh: "ยืนยันแล้ว",
    emoji: "✅",
    className: "bg-sky-100 text-sky-700 border-sky-200",
  },
  SHIPPING: {
    label: "Shipping",
    labelTh: "กำลังจัดส่ง",
    emoji: "🚚",
    className: "bg-violet-100 text-violet-700 border-violet-200",
  },
  DELIVERED: {
    label: "Delivered",
    labelTh: "จัดส่งแล้ว",
    emoji: "📦",
    className: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  CANCELLED: {
    label: "Cancelled",
    labelTh: "ยกเลิก",
    emoji: "❌",
    className: "bg-rose-100 text-rose-700 border-rose-200",
  },
};

export const ORDER_STATUS_FLOW: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "SHIPPING",
  "DELIVERED",
];

export const PRODUCT_STATUS_META: Record<
  ProductStatus,
  { label: string; className: string }
> = {
  ACTIVE: { label: "上架中", className: "bg-emerald-100 text-emerald-700" },
  INACTIVE: { label: "已下架", className: "bg-zinc-100 text-zinc-600" },
  DRAFT: { label: "草稿", className: "bg-amber-100 text-amber-700" },
};

export const CATEGORY_LABEL: Record<Category, { label: string; emoji: string }> = {
  all: { label: "ทั้งหมด", emoji: "🛍️" },
  snacks: { label: "ขนม", emoji: "🍪" },
  beauty: { label: "เครื่องสำอาง", emoji: "💄" },
  drinks: { label: "เครื่องดื่ม", emoji: "🧋" },
  clothing: { label: "เสื้อผ้า", emoji: "👕" },
};

export const LOW_STOCK_THRESHOLD = 15;
