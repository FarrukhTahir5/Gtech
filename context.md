# Gillani Tech - Agent Context File
> Auto-updated by agents. Read this first before exploring the project.
> **Last Updated**: 2026-04-19

---

## Project Summary
E-commerce platform for selling printers & computer accessories. Three deliverables:
1. **Customer Website** (Next.js 16 + Tailwind + Zustand) — port 3000
2. **Admin Mobile App** (Expo / React Native) — Android APK
3. **Backend API** (Express + Prisma 7 + Supabase PostgreSQL) — port 5000

---

## Architecture Quick Reference

### API (`api/`)
- Entry: `server.js` → `src/app.js`
- Controllers: `auth`, `product`, `category`, `order`, `payment`, `stats`, `cart`, `review`, `coupon`, `address`, `buyback`, `dashboard`, `wishlist`
- Routes: `auth`, `product`, `category`, `stats`, `order`, `payment`, `cart`, `review`, `coupon`, `address`, `buyback`, `dashboard`, `wishlist`
- Middleware: `authenticate.js` (JWT + admin check), `upload.js` (Cloudinary/Multer), `rateLimiter.js`
- Services: `email.service.js` (Nodemailer), `fcm.service.js` (Firebase push)
- Observability: Sentry (`@sentry/node`), Pino structured logging (`pino-http`)
- Utils: `generateSlug.js`, `generateOrderNumber.js`
- DB: Prisma 7 with `@prisma/adapter-pg` driver (NOT direct URL strings)
- Schema: `prisma/schema.prisma` — 12 tables

### Frontend (`frontend/`)
- App Router (Next.js 16), React 19, Tailwind 4 — 30 pages, builds clean
- Theme: "Precision" light theme — Manrope (headings) + Inter (body)
- Layout: `Header.tsx` (sticky backdrop-blur) + `Footer.tsx` (4-column)
- SEO: `JsonLd.tsx`, `Analytics.tsx` (GA4 + FB Pixel)
- Pages: `/`, `/shop`, `/product/[slug]`, `/cart`, `/checkout`, `/account`, `/account/addresses`, `/sell`, `/about`, `/contact`, `/faq`, `/terms`, `/privacy`, `/wishlist`, `/auth/login`, `/auth/register`, `/auth/forgot-password`, `/auth/reset-password`, `/dashboard/orders`, `/admin` (dashboard), `/admin/orders`, `/admin/orders/[id]`, `/admin/products`, `/admin/categories`, `/admin/coupons`, `/admin/buyback`
- Payment: Cash on Delivery only (Stripe removed)
- Components: `ProductCard.tsx` (spec boxes + wishlist), `ProductGrid.tsx`, layout + SEO components
- Store: `authStore.ts`, `cartStore.ts`, `wishlistStore.ts` (Zustand)
- SEO: `sitemap.ts` (auto-generated from API)

### Admin App (`admin-app/`)
- Expo SDK 52, React Native 0.81, React Navigation (Stack + Bottom Tabs)
- 5 tabs: Dashboard, Products, Orders (with stack to detail), Settings (with stack to manage screens)
- Screens: Login, Dashboard, ProductList, OrderList, OrderDetail, Settings, CategoryManage, CouponManage, BuybackList, BuybackDetail
- Store: `authStore.ts` (AsyncStorage)

---

## Critical Technical Notes
- **Prisma 7**: Must use `new PrismaClient({ adapter })` — direct URL strings deprecated
- **Stripe**: Lazy-loaded to prevent startup crashes when keys are empty
- **Next.js Images**: Whitelists Unsplash, Placeholder, Cloudinary in `next.config.ts`
- **useSearchParams**: Must wrap in `<Suspense>` boundary (Next.js 16)
- **globals.css**: Uses `@import "tailwindcss"` (Tailwind 4 syntax)
- **Font variables**: `--font-manrope` and `--font-inter` from `next/font/google`
- **Admin API URL**: Hardcoded `http://10.0.2.2:5000` (Android emulator)
- **Email/FCM**: Gracefully skip if env vars not configured

---

## Implementation Status

### DONE — ALL CORE FEATURES BUILT

**Backend API (14 route groups):**
- [x] Auth: register, login, refresh-token, forgot/reset password, profile CRUD, change password
- [x] Products: CRUD, slug-based lookup, image upload, spec management, full-text search
- [x] Categories: CRUD with hierarchy
- [x] Orders: create (COD + Stripe), customer history, admin list/filter/status/payment/notes
- [x] Payments: Stripe checkout + webhooks
- [x] Cart: server-side cart (add, update, remove, clear)
- [x] Reviews: submit, approve, delete, product-level listing with aggregates
- [x] Coupons: validate, CRUD (percentage + fixed types, limits, expiry)
- [x] Addresses: CRUD, set default
- [x] Buyback: submit (guest OK), admin review/price/status
- [x] Dashboard: stats, low-stock alerts, admin order management
- [x] Wishlist: server-side API + local-store sync, toggle in ProductCard, dedicated page
- [x] Contact form: backend endpoint + newsletter subscribe endpoint
- [x] Rate limiting middleware
- [x] Email service (Nodemailer + templates)
- [x] Push notification service (FCM)
- [x] Slug + order number generators

**Frontend (22 pages, all light theme):**
- [x] Home (hero, categories, products, trust badges, newsletter)
- [x] Shop (sidebar filters, sort, search, mobile drawer)
- [x] Product Detail (gallery, specs, reviews, related products, add to cart)
- [x] Cart (items, quantity stepper, coupon code, checkout link)
- [x] Checkout (COD + Stripe, form validation)
- [x] Account (profile edit, change password, logout)
- [x] Sell/Buyback (form submission)
- [x] My Orders (order history with status badges)
- [x] Addresses management (add, delete, set default)
- [x] About, Contact, FAQ, Terms, Privacy (static pages)
- [x] Login + Register
- [x] Forgot Password + Reset Password
- [x] Wishlist page (local-store + toggle)
- [x] Header (sticky, categories dropdown, search, mobile drawer, cart badge, wishlist badge)
- [x] Footer (4-column, social links, contact)
- [x] SEO: JSON-LD, meta tags, GA4, FB Pixel, sitemap.xml, robots.txt, not-found.tsx, loading.tsx

**Admin App (10 screens):**
- [x] Login (admin role validation)
- [x] Dashboard (stats, recent orders, pull-to-refresh)
- [x] Product List (search, inventory)
- [x] Add/Edit Product screens (form, specs, image upload)
- [x] Products stack navigation (List → Add/Edit)
- [x] Order List (filter tabs, search, status badges)
- [x] Order Detail (status update, tracking, payment, admin notes, call/WhatsApp)
- [x] Settings (password change, notification toggles, management shortcuts)
- [x] Category Management (list, add, delete)
- [x] Coupon Management (list, add form)
- [x] Buyback List + Detail (status, offer price, admin notes)
- [x] Navigation: 5 tabs + stack navigation for detail screens

### INFRASTRUCTURE (Done)
- [x] Test suite (Vitest for API — auth, products, categories, contact, stats)
- [x] Error tracking (Sentry for frontend + API)
- [x] Structured logging (Pino + pino-http replacing morgan)
- [x] CI/CD pipeline (GitHub Actions — frontend build, API tests, admin-app export)
- [x] Social media links in footer (facebook.com/gillanitech, instagram.com/gillanitech)
- [x] Admin app: image picker in AddProductScreen (expo-image-picker)
- [ ] Prisma db push (run `npx prisma db push` in api/ — DB currently offline)

---

## Key Environment Variables

### API `.env`
`DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `FRONTEND_URL`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `FROM_EMAIL`, `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`

### Frontend `.env.local`
`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_FB_PIXEL_ID`

### Admin App
`API_URL` (hardcoded to 10.0.2.2:5000), Firebase config vars
