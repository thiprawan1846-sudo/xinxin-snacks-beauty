# XinXin Snacks & Beauty 🌸

> ร้านขนมและเครื่องสำอางจีนส่งตรงจากจีน — คัดสรรสินค้ายอดนิยมจาก Xiaohongshu และ TikTok ส่งถึงบ้านคุณทั่วประเทศไทย

A cross-border e-commerce MVP targeting Thai consumers, selling curated Chinese snacks & beauty products. Built with Next.js 15 (App Router), TypeScript, Tailwind CSS, and Prisma (schema ready, mock data for MVP).

## ✨ Features

**Shop (用户端)**
- 🏠 Home — hero banner, categories, featured products, new arrivals, beauty spotlight
- 🛍️ Products — category filter, search, sort, pagination
- 📦 Product detail — gallery, rating, friend recommendation, add-to-cart, related items
- 🛒 Cart — drawer + checkout page with shipping form (COD)
- 🧾 Orders — list + detail with status tracker (Pending → Confirmed → Shipping → Delivered)

**Admin (后台管理)**
- 📊 Dashboard — revenue, pending orders, stock alerts, recent activity
- 🛍️ Products — add/edit/toggle status, search
- 📦 Inventory — inline stock editing, low-stock & out-of-stock alerts
- 🧾 Orders — filter by status, advance order through fulfillment flow

## 🎨 Design System

A distinctive **warm sakura** palette (not bubblegum pink) paired with **Quicksand** display + **Noto Sans Thai** body fonts. Thai language is a first-class citizen.

| Token | Hex | Usage |
|-------|-----|-------|
| sakura-500 | `#FF6B9D` | Primary |
| sakura-600 | `#E64980` | CTAs |
| cream-100 | `#FFF8F3` | Warm background |
| peach-300 | `#FFD8A8` | Snacks accent |
| ink | `#2D1B2E` | Body text |

Signature element: a floating product collage in the hero with gentle float animation.

## 🛠️ Tech Stack

- **Next.js 15** (App Router, RSC) + **TypeScript**
- **Tailwind CSS** + **shadcn/ui** primitives (`components.json` configured)
- **Zustand** (cart, orders, products state — persisted to localStorage)
- **Prisma** + **PostgreSQL** (schema ready in `prisma/schema.prisma`)
- **Supabase** (placeholder config in `.env.example`)
- **lucide-react** icons

## 🚀 Getting Started

```bash
# 1. Install dependencies
npm install

# 2. (Optional) set up env
cp .env.example .env

# 3. Run the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Admin console: [http://localhost:3000/admin](http://localhost:3000/admin)

## 📁 Project Structure

```text
src/
├── app/
│   ├── (shop)/              # User-facing routes (route group)
│   │   ├── page.tsx         # Home
│   │   ├── products/        # List + [id] detail
│   │   ├── cart/            # Cart & checkout
│   │   └── orders/          # Orders list + [id] detail
│   ├── admin/               # Admin console
│   │   ├── page.tsx         # Dashboard
│   │   ├── products/        # Product management
│   │   ├── inventory/       # Stock management
│   │   └── orders/          # Order management
│   ├── api/                 # Route Handlers (mock-backed)
│   │   ├── products/
│   │   ├── cart/
│   │   ├── orders/
│   │   └── admin/
│   ├── globals.css          # Design tokens + base styles
│   ├── layout.tsx           # Root layout (fonts, metadata)
│   └── not-found.tsx
├── components/
│   ├── ui/                  # shadcn-style primitives (button, card, badge, input)
│   ├── shop/                # Header, Footer, Hero, ProductCard, CartDrawer, ...
│   └── admin/               # AdminSidebar, AdminTable
├── hooks/                   # Zustand stores (use-cart, use-orders, use-products)
├── lib/                     # utils, constants, prisma client
├── data/                    # Mock data (products, orders, categories)
├── types/                   # Shared domain types
└── prisma/                  # schema.prisma (ready for DB)
```

## 🔄 Business Flow (跑通)

```
首页 → 商品列表 → 商品详情 → 加入购物车 → 提交订单 → 我的订单 → 后台查看订单
```

The full flow works end-to-end with mock data:
1. Browse → add to cart (persisted)
2. Checkout → creates order (persisted, PENDING status)
3. Admin → advances order through fulfillment statuses
4. Admin → adjusts stock (reflects in shop as availability)

## 🔌 Wiring Up Real Data (后续开发建议)

The MVP uses mock data via Zustand stores. To go live:

1. **Database** — `cp .env.example .env`, set `DATABASE_URL`, run `npx prisma migrate dev`
2. **Replace stores** — swap Zustand store reads in `src/hooks/*` with Prisma queries, or replace page data fetching with `prisma.product.findMany()` in RSCs
3. **API routes** — `src/app/api/*` already mirror the Prisma shape; replace in-memory arrays with `prisma.*` calls
4. **Auth** — add NextAuth/Auth.js with the `User` model (role: CUSTOMER/ADMIN)
5. **Image storage** — wire Supabase Storage for product images (replace Unsplash URLs in `src/data/mock.ts`)
6. **Payments** — add Omise/PromptPay at checkout (replace COD stub)
7. **i18n** — Thai is the default; add `next-intl` for Chinese/English toggles

### Module-by-module order
- **Auth & users** → protect `/admin`, attach `userId` to orders
- **Products API** → swap mock for Prisma, add image upload
- **Orders API** → transactional stock decrement on order create
- **Admin orders** → server actions for status updates
- **SEO** — generate static params for products, add structured data
- **Analytics** — page views, add-to-cart, purchase events

## 📦 Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |
| `npm run prisma:generate` | Generate Prisma client |
| `npm run prisma:migrate` | Run migrations |
| `npm run prisma:studio` | Open Prisma Studio |
