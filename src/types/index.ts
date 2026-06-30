/**
 * Domain types for XinXin Snacks & Beauty.
 * These mirror the Prisma schema and are shared across client/server.
 */

export type Category = "snacks" | "beauty" | "drinks" | "clothing" | "all";

export type ProductStatus = "ACTIVE" | "INACTIVE" | "DRAFT";

/** 服饰规格 — 尺码 */
export type ProductSize = "XS" | "S" | "M" | "L" | "XL" | "XXL";

/** 服饰规格 — 颜色 */
export type ProductColor =
  | "White"
  | "Black"
  | "Pink"
  | "Blue"
  | "Green"
  | "Beige";

/**
 * 商品 SKU（规格变体）。
 * 服饰类商品每个 size×color 组合占一行，库存独立管理。
 * 非服饰商品不创建 variant。
 */
export interface ProductVariant {
  id: string;
  productId: string;
  size: ProductSize | null;
  color: ProductColor | null;
  stock: number;
  /** 可选：覆盖 Product.price（同款不同色加价场景）。null = 沿用商品价 */
  priceOverride?: number | null;
  /** 人类可读 SKU 码，如 TEE-PINK-M */
  sku?: string | null;
}

export interface Product {
  id: string;
  name: string;
  nameTh: string;
  /** 友好英文名（可选，用于详情页显示）。区别于 name（后台管理用英文标识）。 */
  englishName?: string | null;
  description: string;
  descriptionTh: string;
  category: Exclude<Category, "all">;
  price: number;
  originalPrice?: number;
  stock: number;
  /** 封面图（gallery 第一张；旧数据兼容字段） */
  imageUrl: string;
  /** 多图数组（第一张为封面）。null/空 = 仅 imageUrl 一张。 */
  gallery?: string[] | null;
  /** 美妆自定义规格（管理员自由新增的 string 数组，例：["04 乌龙冻","03 蔷薇冻"]）。
   *  非美妆分类或无规格时为 null/空。 */
  options?: string[] | null;
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
  /** 服饰类商品的 SKU 列表；非服饰为 undefined/空 */
  variants?: ProductVariant[];
}

export interface CartItem {
  productId: string;
  name: string;
  nameTh: string;
  /** 英文名快照（订单/购物车显示用） */
  englishName?: string | null;
  price: number;
  imageUrl: string;
  quantity: number;
  stock: number;
  /** 服饰 SKU id（同一商品不同颜色/尺码各占一行购物车） */
  variantId?: string | null;
  size?: ProductSize | null;
  color?: ProductColor | null;
  /** 美妆自定义规格快照（用户选中的 option 字符串） */
  optionLabel?: string | null;
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
  /** 英文名快照（订单显示用） */
  englishName?: string | null;
  quantity: number;
  price: number;
  imageUrl: string;
  /** 服饰 SKU 信息（订单创建时快照，便于发货时核对规格） */
  variantId?: string | null;
  size?: ProductSize | null;
  color?: ProductColor | null;
  /** 美妆自定义规格快照（用户选中的 option 字符串） */
  optionLabel?: string | null;
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
