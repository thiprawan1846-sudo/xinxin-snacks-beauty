import type {
  OrderStatus,
  ProductStatus,
  Category,
  ProductSize,
  ProductColor,
} from "@/types";

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

// ───────────────────── 服饰规格 ─────────────────────

export const PRODUCT_SIZES: { value: ProductSize; label: string }[] = [
  { value: "XS", label: "XS" },
  { value: "S", label: "S" },
  { value: "M", label: "M" },
  { value: "L", label: "L" },
  { value: "XL", label: "XL" },
  { value: "XXL", label: "XXL" },
];

export interface ColorMeta {
  value: ProductColor;
  label: string;
  labelTh: string;
  /** 色块 CSS 颜色（用于详情页 swatch） */
  swatch: string;
  /** 文字颜色，用于深底色块上的标签 */
  text?: string;
}

export const PRODUCT_COLORS: ColorMeta[] = [
  {
    value: "White",
    label: "White",
    labelTh: "ขาว",
    swatch: "bg-white border-sakura-200",
  },
  {
    value: "Black",
    label: "Black",
    labelTh: "ดำ",
    swatch: "bg-ink-soft",
    text: "text-white",
  },
  {
    value: "Pink",
    label: "Pink",
    labelTh: "ชมพู",
    swatch: "bg-sakura-400",
    text: "text-white",
  },
  {
    value: "Blue",
    label: "Blue",
    labelTh: "น้ำเงิน",
    swatch: "bg-sky-400",
    text: "text-white",
  },
  {
    value: "Green",
    label: "Green",
    labelTh: "เขียว",
    swatch: "bg-emerald-400",
    text: "text-white",
  },
  {
    value: "Beige",
    label: "Beige",
    labelTh: "เบจ",
    swatch: "bg-amber-100",
  },
];

export const COLOR_META: Record<ProductColor, ColorMeta> = PRODUCT_COLORS.reduce(
  (acc, c) => {
    acc[c.value] = c;
    return acc;
  },
  {} as Record<ProductColor, ColorMeta>,
);

/** 仅服饰分类需要规格 */
export function categoryHasVariants(category: string): boolean {
  return category === "clothing";
}

/** 仅美妆分类支持自定义规格（Options） */
export function categoryHasOptions(category: string): boolean {
  return category === "beauty";
}
