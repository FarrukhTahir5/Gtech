# Gillani Tech — Complete Product Specification
### E-Commerce Website + Admin Mobile App (APK)
**Version 1.0 | Full Build Spec for Developers**

---

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [Tech Stack Recommendation](#2-tech-stack-recommendation)
3. [Database Schema](#3-database-schema)
4. [Customer Website — Full Spec](#4-customer-website)
5. [Admin Mobile App — Full Spec](#5-admin-mobile-app-apk)
6. [API Endpoints](#6-api-endpoints)
7. [Authentication & Security](#7-authentication--security)
8. [File Storage](#8-file-storage)
9. [Order Flow — End to End](#9-order-flow-end-to-end)
10. [Notifications](#10-notifications)
11. [Environment Variables](#11-environment-variables)
12. [Deployment Guide](#12-deployment-guide)
13. [Folder Structure](#13-folder-structure)
14. [Design System & UI/UX](#14-design-system--uiux)
15. [API Standards & Error Handling](#15-api-standards--error-handling)
16. [SEO & Analytics](#16-seo--analytics)
17. [Testing & QA Strategy](#17-testing--qa-strategy)
18. [Maintenance & Monitoring](#18-maintenance--monitoring)
19. [Future Roadmap](#19-future-roadmap)

---

## 1. Project Overview

**Business**: Retail store selling and buying printers, printer accessories, computer accessories (ink, toner, cables, keyboards, mice, drives, etc.)

**Two deliverables:**
- `Website` — Public-facing customer storefront (web, mobile-responsive)
- `Admin APK` — Android app for the store owner/agent to manage products & orders

**Core features:**
- Customers browse, search, filter, and purchase products
- Guest checkout + registered account checkout
- Owner adds/edits/deletes products with photos and stock
- Owner views orders, updates order status, marks as delivered
- Real-time stock update when order is placed
- Push notification to admin on new order

---

## 2. Tech Stack Recommendation

### Backend (Shared by Website + App)
| Layer | Technology |
|---|---|
| Runtime | Node.js (v20+) |
| Framework | Express.js |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | JWT (access + refresh tokens) |
| File Storage | Cloudinary (product images) |
| Email | Nodemailer + Gmail SMTP or Resend.io |
| Push Notifications | Firebase Cloud Messaging (FCM) |
| Payment | Stripe or manual (cash on delivery) |
| Hosting | Railway / Render / VPS |

### Customer Website (Frontend)
| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| State | Zustand (cart, auth) |
| Forms | React Hook Form + Zod |
| HTTP Client | Axios |
| Hosting | Vercel |

### Admin APK (Mobile)
| Layer | Technology |
|---|---|
| Framework | React Native (Expo) |
| Navigation | React Navigation v6 |
| HTTP Client | Axios |
| Image Picker | expo-image-picker |
| Storage | AsyncStorage (JWT token) |
| Push | expo-notifications + FCM |
| Build | EAS Build → .apk |

---

## 3. Database Schema

### 3.1 Users Table
```
users
  id            UUID PK default uuid_generate_v4()
  name          VARCHAR(100) NOT NULL
  email         VARCHAR(150) UNIQUE NOT NULL
  password_hash VARCHAR(255) NOT NULL
  phone         VARCHAR(20)
  role          ENUM('customer', 'admin') DEFAULT 'customer'
  is_verified   BOOLEAN DEFAULT false
  fcm_token     VARCHAR(255)               -- for push notifications (admin)
  created_at    TIMESTAMP DEFAULT NOW()
  updated_at    TIMESTAMP DEFAULT NOW()
```

### 3.2 Addresses Table
```
addresses
  id          UUID PK
  user_id     UUID FK → users.id ON DELETE CASCADE
  label       VARCHAR(50)  -- e.g. "Home", "Office"
  full_name   VARCHAR(100) NOT NULL
  phone       VARCHAR(20) NOT NULL
  line1       VARCHAR(200) NOT NULL
  line2       VARCHAR(200)
  city        VARCHAR(100) NOT NULL
  province    VARCHAR(100)
  postal_code VARCHAR(20)
  country     VARCHAR(100) DEFAULT 'Pakistan'
  is_default  BOOLEAN DEFAULT false
  created_at  TIMESTAMP DEFAULT NOW()
```

### 3.3 Categories Table
```
categories
  id          UUID PK
  name        VARCHAR(100) UNIQUE NOT NULL   -- e.g. "Printers", "Ink & Toner", "Cables"
  slug        VARCHAR(120) UNIQUE NOT NULL
  image_url   VARCHAR(500)
  parent_id   UUID FK → categories.id        -- for subcategories (nullable)
  sort_order  INTEGER DEFAULT 0
  created_at  TIMESTAMP DEFAULT NOW()
```

### 3.4 Products Table
```
products
  id               UUID PK
  category_id      UUID FK → categories.id
  name             VARCHAR(200) NOT NULL
  slug             VARCHAR(220) UNIQUE NOT NULL
  description      TEXT NOT NULL
  short_desc       VARCHAR(300)
  brand            VARCHAR(100)
  model_number     VARCHAR(100)
  sku              VARCHAR(100) UNIQUE
  price            DECIMAL(10,2) NOT NULL
  compare_price    DECIMAL(10,2)             -- original/crossed-out price
  cost_price       DECIMAL(10,2)             -- for profit tracking
  stock_quantity   INTEGER NOT NULL DEFAULT 0
  low_stock_alert  INTEGER DEFAULT 5
  weight_kg        DECIMAL(5,2)
  is_active        BOOLEAN DEFAULT true
  is_featured      BOOLEAN DEFAULT false
  is_buyback       BOOLEAN DEFAULT false     -- customer can sell this item to store
  buyback_price    DECIMAL(10,2)             -- price store pays customer
  tags             TEXT[]                    -- for search
  meta_title       VARCHAR(200)
  meta_description VARCHAR(300)
  created_at       TIMESTAMP DEFAULT NOW()
  updated_at       TIMESTAMP DEFAULT NOW()
```

### 3.5 Product Images Table
```
product_images
  id          UUID PK
  product_id  UUID FK → products.id ON DELETE CASCADE
  url         VARCHAR(500) NOT NULL
  alt_text    VARCHAR(200)
  sort_order  INTEGER DEFAULT 0
  is_primary  BOOLEAN DEFAULT false
  created_at  TIMESTAMP DEFAULT NOW()
```

### 3.6 Product Specifications Table
```
product_specs
  id          UUID PK
  product_id  UUID FK → products.id ON DELETE CASCADE
  label       VARCHAR(100) NOT NULL   -- e.g. "Print Speed", "Connectivity"
  value       VARCHAR(300) NOT NULL   -- e.g. "22 ppm", "USB 3.0, WiFi"
  sort_order  INTEGER DEFAULT 0
```

### 3.7 Cart Table (server-side cart for logged-in users)
```
cart_items
  id          UUID PK
  user_id     UUID FK → users.id ON DELETE CASCADE
  product_id  UUID FK → products.id ON DELETE CASCADE
  quantity    INTEGER NOT NULL DEFAULT 1
  created_at  TIMESTAMP DEFAULT NOW()
  updated_at  TIMESTAMP DEFAULT NOW()
  UNIQUE(user_id, product_id)
```

### 3.8 Orders Table
```
orders
  id               UUID PK
  order_number     VARCHAR(30) UNIQUE NOT NULL   -- e.g. "ORD-20240501-0001"
  user_id          UUID FK → users.id (nullable for guest)
  guest_name       VARCHAR(100)
  guest_email      VARCHAR(150)
  guest_phone      VARCHAR(20)
  status           ENUM('pending','confirmed','processing','shipped','delivered','cancelled','refunded')
                   DEFAULT 'pending'
  payment_method   ENUM('cod','stripe','bank_transfer') DEFAULT 'cod'
  payment_status   ENUM('unpaid','paid','refunded') DEFAULT 'unpaid'
  payment_ref      VARCHAR(200)
  subtotal         DECIMAL(10,2) NOT NULL
  discount_amount  DECIMAL(10,2) DEFAULT 0
  shipping_fee     DECIMAL(10,2) DEFAULT 0
  tax_amount       DECIMAL(10,2) DEFAULT 0
  total_amount     DECIMAL(10,2) NOT NULL
  coupon_code      VARCHAR(50)
  notes            TEXT                          -- customer notes
  admin_notes      TEXT                          -- internal notes
  -- Shipping address (snapshot at order time)
  ship_name        VARCHAR(100) NOT NULL
  ship_phone       VARCHAR(20) NOT NULL
  ship_line1       VARCHAR(200) NOT NULL
  ship_line2       VARCHAR(200)
  ship_city        VARCHAR(100) NOT NULL
  ship_province    VARCHAR(100)
  ship_postal      VARCHAR(20)
  ship_country     VARCHAR(100) DEFAULT 'Pakistan'
  -- Tracking
  tracking_number  VARCHAR(100)
  courier          VARCHAR(100)
  shipped_at       TIMESTAMP
  delivered_at     TIMESTAMP
  cancelled_at     TIMESTAMP
  cancel_reason    VARCHAR(300)
  created_at       TIMESTAMP DEFAULT NOW()
  updated_at       TIMESTAMP DEFAULT NOW()
```

### 3.9 Order Items Table
```
order_items
  id              UUID PK
  order_id        UUID FK → orders.id ON DELETE CASCADE
  product_id      UUID FK → products.id
  product_name    VARCHAR(200) NOT NULL   -- snapshot
  product_sku     VARCHAR(100)
  product_image   VARCHAR(500)
  quantity        INTEGER NOT NULL
  unit_price      DECIMAL(10,2) NOT NULL
  total_price     DECIMAL(10,2) NOT NULL
  created_at      TIMESTAMP DEFAULT NOW()
```

### 3.10 Reviews Table
```
reviews
  id          UUID PK
  product_id  UUID FK → products.id ON DELETE CASCADE
  user_id     UUID FK → users.id
  rating      SMALLINT NOT NULL CHECK(rating BETWEEN 1 AND 5)
  title       VARCHAR(150)
  body        TEXT
  is_approved BOOLEAN DEFAULT false
  created_at  TIMESTAMP DEFAULT NOW()
```

### 3.11 Coupons Table
```
coupons
  id              UUID PK
  code            VARCHAR(50) UNIQUE NOT NULL
  type            ENUM('percentage','fixed') NOT NULL
  value           DECIMAL(10,2) NOT NULL
  min_order_value DECIMAL(10,2) DEFAULT 0
  max_discount    DECIMAL(10,2)            -- cap for percentage coupons
  usage_limit     INTEGER                  -- null = unlimited
  used_count      INTEGER DEFAULT 0
  is_active       BOOLEAN DEFAULT true
  expires_at      TIMESTAMP
  created_at      TIMESTAMP DEFAULT NOW()
```

### 3.12 Buyback Requests Table (Customer selling to store)
```
buyback_requests
  id              UUID PK
  user_id         UUID FK → users.id
  product_id      UUID FK → products.id (nullable if custom item)
  custom_item     VARCHAR(200)             -- if not in catalog
  condition       ENUM('new','like_new','good','fair','poor')
  description     TEXT
  images          TEXT[]                   -- Cloudinary URLs
  offered_price   DECIMAL(10,2)            -- store's offered price
  status          ENUM('pending','reviewed','accepted','rejected') DEFAULT 'pending'
  admin_notes     TEXT
  created_at      TIMESTAMP DEFAULT NOW()
  updated_at      TIMESTAMP DEFAULT NOW()
```

---

## 4. Customer Website

### 4.1 Pages & Routes

| Route | Page | Description |
|---|---|---|
| `/` | Home | Hero, featured products, categories, promotions |
| `/products` | Product Listing | All products with filters & search |
| `/products?category=printers` | Filtered Listing | Category filtered |
| `/products/[slug]` | Product Detail | Full product page |
| `/cart` | Cart | Cart items, summary, coupon |
| `/checkout` | Checkout | Address, payment method |
| `/checkout/success` | Order Success | Confirmation page |
| `/orders` | My Orders | Customer order history |
| `/orders/[id]` | Order Detail | Single order tracking |
| `/account` | Account | Profile, addresses |
| `/account/addresses` | Addresses | Manage saved addresses |
| `/sell` | Sell/Buyback | Submit item to sell to store |
| `/auth/login` | Login | Email + password |
| `/auth/register` | Register | New account |
| `/auth/forgot-password` | Forgot Password | Send reset email |
| `/auth/reset-password` | Reset Password | Token-based reset |
| `/about` | About Us | Company story, mission, team |
| `/contact` | Contact Us | Contact form, map, address |
| `/faq` | FAQs | Common questions & answers |
| `/terms` | Terms of Service | Legal terms, usage policy |
| `/privacy` | Privacy Policy | Data protection, cookies |

### 4.2 Home Page Components

**Hero Section**
- Full-width banner with background image/gradient
- Headline text (editable from admin)
- CTA button → `/products`
- Optional: carousel with 3 slides (managed from admin)

**Category Grid**
- Show top-level categories as cards with icon/image
- Categories: Printers, Ink & Toner, Cables, Keyboards & Mice, Storage, Networking, Other
- Clicking navigates to `/products?category=[slug]`

**Featured Products Section**
- Horizontal scrollable row or 4-column grid
- Show products where `is_featured = true`
- Product card: image, name, price, compare_price (crossed out), Add to Cart button

**Promotional Banner**
- Static or admin-managed banner image
- Links to sale products or specific category

**Recently Added Products**
- Latest 8 products sorted by `created_at` DESC

**Brands Section**
- Logo strip of brands (Epson, HP, Canon, Brother, Dell, Logitech, etc.)

**Why Buy From Us Section**
- Icons + text: Genuine Products, Fast Delivery, Easy Returns, Warranty Support

### 4.3 Product Listing Page

**URL**: `/products`

**Sidebar Filters (left on desktop, drawer on mobile)**
- Category (checkbox tree with subcategories)
- Brand (checkbox, dynamically loaded)
- Price range (dual slider, min-max input)
- In Stock only (toggle)
- Rating (1–5 stars)

**Top Bar**
- Search input (real-time debounce 300ms)
- Sort dropdown: Featured, Newest, Price Low→High, Price High→Low, Top Rated
- Total results count
- Grid/List view toggle

**Product Card (Grid View)**
- Primary image (lazy loaded)
- Product name (max 2 lines, truncated)
- Brand badge
- Star rating (average)
- Price (bold) + compare_price (strikethrough, gray)
- Stock badge: "In Stock" (green) | "Low Stock" (orange) | "Out of Stock" (red/disabled)
- "Add to Cart" button (disabled if out of stock)
- Wishlist heart icon (logged-in users)

**Pagination**
- 20 products per page
- Prev / Next + numbered page buttons

### 4.4 Product Detail Page

**URL**: `/products/[slug]`

**Image Gallery**
- Main large image
- Thumbnail strip (max 6 thumbnails)
- Click thumbnail → update main image
- Optional: lightbox on main image click

**Product Info Section**
- Category breadcrumb (Home > Printers > Laser Printers)
- Product name (H1)
- Brand + Model number
- SKU
- Star rating with review count (links to reviews section below)
- Price section: sale price (large, bold) + compare price (strikethrough) + savings badge ("Save Rs. 500")
- Stock indicator
- Quantity selector (stepper, min 1, max = stock_quantity)
- "Add to Cart" button (primary, large)
- "Buy Now" button (secondary) → goes directly to checkout
- Wishlist button

**Product Description Tab**
- Full HTML description (rendered safely)

**Specifications Tab**
- Table of spec label/value pairs from `product_specs`

**Reviews Tab**
- Average rating with star breakdown (5★ = X, 4★ = X, etc.)
- List of approved reviews (paginated, 5 per page)
- "Write a Review" form (for customers who purchased this product)
  - Star rating selector
  - Title input
  - Review body textarea
  - Submit (requires login)

**Related Products**
- 4 products from same category, excluding current

### 4.5 Cart Page

**Cart Table**
- Product image thumbnail (60×60)
- Product name (links to product page)
- Unit price
- Quantity stepper (update on change)
- Line total
- Remove button (trash icon)

**Cart Summary (right side / bottom)**
- Subtotal
- Coupon code input + Apply button
- Discount line (shown if coupon applied)
- Shipping (show "Calculated at checkout" or flat rate)
- Order Total
- "Proceed to Checkout" button

**Empty Cart State**
- Illustration + "Your cart is empty" message
- "Continue Shopping" button

**Cart Persistence**
- Logged-in users: sync cart to server on add/remove/update
- Guest users: localStorage cart. Merge with server cart on login.

### 4.6 Checkout Page

**Step 1 — Contact & Address**
- If guest: Name, Email, Phone fields
- If logged in: show saved addresses (radio selection) + "Add New Address" form toggle
- Address fields: Full Name, Phone, Address Line 1, Line 2 (optional), City, Province, Postal Code, Country

**Step 2 — Payment Method**
- Cash on Delivery (COD) — default
- Bank Transfer — show account details (admin-configured)
- Stripe Card — Stripe Elements (if enabled)

**Step 3 — Review & Place Order**
- Order summary table
- Total amount
- "Place Order" button

**On Success**
- Reduce `stock_quantity` for each ordered item
- Create order record + order items
- Send order confirmation email to customer
- Send push notification to admin
- Redirect to `/checkout/success?order=[order_number]`

### 4.7 Order Success Page

- "Thank you! Your order has been placed." message
- Order number displayed prominently
- Order summary table
- Estimated delivery note
- "Track My Order" button → `/orders/[id]`
- "Continue Shopping" button

### 4.8 My Orders Page

- List of customer's orders, newest first
- Each order card: Order #, date, status badge, total, "View Details" button
- Status badges with colors:
  - Pending → gray
  - Confirmed → blue
  - Processing → yellow
  - Shipped → purple
  - Delivered → green
  - Cancelled → red

### 4.9 Order Detail Page

- Order number, date, status
- Progress tracker (visual steps: Placed → Confirmed → Processing → Shipped → Delivered)
- Tracking number + courier (if shipped)
- Items table
- Shipping address
- Payment method + payment status
- Price breakdown

### 4.10 Account Page

- Profile form: Name, Email (readonly), Phone — Save button
- Change Password form: Current password, New password, Confirm
- Danger zone: Delete Account

### 4.11 Sell / Buyback Page

- Intro text: "We buy used printers and accessories"
- Form:
  - Item type (dropdown: Printer, Laptop, Monitor, Keyboard, Other)
  - Brand & Model
  - Condition (radio: New, Like New, Good, Fair, Poor)
  - Description textarea
  - Upload photos (up to 4, Cloudinary upload)
  - Your name, email, phone
  - Submit button
- On submit: create `buyback_requests` record, email admin

### 4.12 Header Component

- Logo (left)
- Navigation: Home, Products (dropdown with categories), Sell to Us
- Search bar (expands on click, or always visible on desktop)
- Icons (right): Search, Wishlist, Account dropdown, Cart (with item count badge)
- Mobile: hamburger menu → slide-out drawer

### 4.13 Footer Component

- Logo + tagline
- Links: About, Contact, FAQs, Return Policy, Privacy Policy
- Category links
- Contact info: phone, email, address
- Social links: WhatsApp, Facebook, Instagram
- Copyright

---

## 5. Admin Mobile App (APK)

**Platform**: Android (APK via Expo EAS Build)
**Users**: Store owner and agents only
**Auth**: Email + password, JWT stored in AsyncStorage

### 5.1 Screens & Navigation

**Bottom Tab Navigator (4 tabs)**
1. Dashboard (Home icon)
2. Products (Box icon)
3. Orders (Receipt icon)
4. Settings (Gear icon)

**Stack screens within tabs:**

```
Dashboard Tab
  └── DashboardScreen

Products Tab
  ├── ProductListScreen
  ├── ProductDetailScreen         (view)
  ├── AddProductScreen            (create)
  └── EditProductScreen           (edit)

Orders Tab
  ├── OrderListScreen
  └── OrderDetailScreen

Settings Tab
  ├── SettingsScreen
  ├── CategoryManageScreen
  ├── CouponManageScreen
  ├── BuybackListScreen
  └── BuybackDetailScreen
```

**Auth Stack (shown when not logged in)**
```
LoginScreen
```

### 5.2 Login Screen

**Fields**
- Email input (keyboard: email-address)
- Password input (secureTextEntry, show/hide toggle)
- "Login" button
- Error toast on wrong credentials

**On Success**
- Store access token + refresh token in AsyncStorage
- Navigate to main tab navigator
- Register FCM device token on backend

### 5.3 Dashboard Screen

**Stats Cards (2×2 grid)**
- Today's Orders (count)
- Today's Revenue (Rs. total)
- Pending Orders (count, tappable → filters Orders tab)
- Total Products (count)

**Recent Orders List**
- Last 10 orders
- Each row: Order #, customer name, total, status badge
- Tap → OrderDetailScreen

**Low Stock Alert List**
- Products where `stock_quantity <= low_stock_alert`
- Each row: product name, current stock
- Tap → EditProductScreen

**Pull to refresh** on entire screen

### 5.4 Product List Screen

**Header**
- Title: "Products"
- Right: "+" button → AddProductScreen

**Search Bar** (top, filters list in real-time)

**Filter Chips Row** (horizontal scroll)
- All | Active | Inactive | Out of Stock | Featured

**Product List (FlatList)**
Each item:
- Product thumbnail (60×60, rounded)
- Name (bold, max 1 line)
- SKU + Brand (gray, small)
- Price
- Stock quantity (green if ok, orange if low, red if 0)
- Status badge: Active / Inactive
- Right arrow icon

Tap item → ProductDetailScreen (with Edit + Delete options)

**Pagination**: Load More button or infinite scroll (20 per page)

### 5.5 Add / Edit Product Screen

Scrollable form with sections:

**Section: Basic Info**
- Product Name (text input, required)
- Category (dropdown/picker, required)
- Brand (text input)
- Model Number (text input)
- SKU (text input, auto-generated suggestion)
- Short Description (text input, max 300 chars)
- Full Description (multiline text area)
- Tags (comma-separated text input)

**Section: Pricing**
- Selling Price (numeric, required)
- Compare Price (numeric, optional — shows strikethrough on website)
- Cost Price (numeric, optional — internal only)

**Section: Inventory**
- Stock Quantity (numeric, required)
- Low Stock Alert (numeric, default 5)
- Product Active (toggle switch)
- Featured Product (toggle switch)

**Section: Buyback**
- Accepts Buyback (toggle)
- Buyback Price (shown only if toggle ON)

**Section: Images**
- Image grid (up to 6 images)
- Each image: tap to select from gallery via `expo-image-picker`
- Upload to Cloudinary on select, show preview
- First image is primary (drag to reorder, or tap "Set as Primary")
- Tap existing image → option to Delete

**Section: Specifications**
- Dynamic rows: Label | Value
- "Add Specification" button adds new row
- Swipe to delete row

**Footer**
- "Save Product" button (full width, primary color)
- Shows loading spinner during API call
- Success toast → navigate back to list
- Error toast on failure

### 5.6 Order List Screen

**Header**: "Orders"

**Filter Tabs** (horizontal scroll)
- All | Pending | Confirmed | Processing | Shipped | Delivered | Cancelled

**Search Bar**: search by order number or customer name

**Sort**: Newest First (default) | Oldest First

**Order List (FlatList)**
Each item:
- Order number (bold)
- Customer name
- Date + time
- Item count
- Total (Rs. X)
- Status badge (color-coded)

Tap → OrderDetailScreen

**Pull to refresh**

### 5.7 Order Detail Screen

**Header**: Order # with back button

**Order Info Card**
- Order number
- Date placed
- Customer name, phone, email
- Payment method + payment status

**Status Updater**
- Current status displayed prominently
- "Update Status" button → opens bottom sheet modal with status options
- Statuses available to set: Confirmed → Processing → Shipped → Delivered / Cancelled
- When setting "Shipped": prompt for Tracking Number + Courier name (text inputs)
- When setting "Cancelled": prompt for cancel reason
- Confirm button → API call → refresh screen
- Customer receives email notification on status change

**Payment Toggle**
- "Mark as Paid" button (shown if payment_status = 'unpaid')
- Tap → confirmation dialog → update payment_status = 'paid'

**Admin Notes**
- Editable text area
- "Save Notes" button

**Items Section**
- Product thumbnail, name, quantity, unit price, line total

**Price Breakdown**
- Subtotal
- Discount (if any)
- Shipping
- Total

**Shipping Address**
- Full address display

**Action Buttons**
- Call Customer (opens phone dialer with customer phone)
- WhatsApp Customer (opens WhatsApp with customer number)

### 5.8 Category Management Screen (Settings → Categories)

**List of categories** with name, product count, sort order

**Add Category button** → inline form:
- Name (required)
- Parent Category (picker, optional — for subcategory)
- Upload image (optional)
- Save

**Swipe left on item**: Edit | Delete

**Drag to reorder** categories (sort_order update)

### 5.9 Coupon Management Screen (Settings → Coupons)

**List of coupons**: Code, Type, Value, Usage, Expiry, Active toggle

**Add Coupon button** → form:
- Code (required, auto-suggest random)
- Type: Percentage | Fixed Amount
- Value (required)
- Minimum Order Value
- Max Discount (only for percentage)
- Usage Limit (leave blank for unlimited)
- Expiry Date (date picker, optional)
- Active toggle

**Delete coupon**: swipe left → delete

### 5.10 Buyback Requests Screen (Settings → Buybacks)

**List**: Customer name, item, condition, date, status badge

Tap → Buyback Detail Screen:
- Full request details
- Customer images (swipeable gallery)
- Status picker: Pending / Reviewed / Accepted / Rejected
- "Offer Price" input (what store will pay)
- Admin notes
- Save button
- Email customer with decision

### 5.11 Settings Screen

**Store Settings**
- Store name, phone, email, address (editable, shown on website footer/emails)
- Shipping fee (flat rate or free above X amount)
- Currency (default: PKR / Rs.)

**Admin Account**
- Change password
- Logout button

**Notifications**
- Toggle: New Order notifications ON/OFF
- Toggle: Low Stock alerts ON/OFF

---

## 6. API Endpoints

### Auth Routes (`/api/auth`)
```
POST   /register          Create customer account
POST   /login             Login (returns access + refresh tokens)
POST   /refresh-token     Get new access token
POST   /logout            Invalidate refresh token
POST   /forgot-password   Send reset email
POST   /reset-password    Reset with token
GET    /me                Get current user profile
PUT    /me                Update profile
PUT    /me/password       Change password
```

### Products Routes (`/api/products`)
```
GET    /                  List products (query: category, brand, search, sort, page, limit, minPrice, maxPrice, inStock, isFeatured)
GET    /:slug             Get single product by slug
POST   /                  Create product [ADMIN]
PUT    /:id               Update product [ADMIN]
DELETE /:id               Delete product [ADMIN]
POST   /:id/images        Upload product image [ADMIN]
DELETE /:id/images/:imgId Delete product image [ADMIN]
```

### Categories Routes (`/api/categories`)
```
GET    /                  List all categories (tree structure)
POST   /                  Create category [ADMIN]
PUT    /:id               Update category [ADMIN]
DELETE /:id               Delete category [ADMIN]
PUT    /reorder           Update sort_order [ADMIN]
```

### Cart Routes (`/api/cart`) [Auth required]
```
GET    /                  Get cart items
POST   /                  Add item to cart (body: productId, quantity)
PUT    /:itemId           Update quantity
DELETE /:itemId           Remove item
DELETE /                  Clear cart
```

### Orders Routes (`/api/orders`)
```
POST   /                  Place order (auth or guest)
GET    /                  List orders for current user [AUTH]
GET    /:id               Get order detail [AUTH — customer sees own, admin sees all]
GET    /admin/all         List all orders [ADMIN] (query: status, search, page, dateFrom, dateTo)
PUT    /admin/:id/status  Update order status [ADMIN]
PUT    /admin/:id/payment Mark as paid [ADMIN]
PUT    /admin/:id/notes   Update admin notes [ADMIN]
```

### Reviews Routes (`/api/reviews`)
```
GET    /product/:productId  Get approved reviews for product
POST   /                    Submit review [AUTH]
GET    /admin/all           List all reviews [ADMIN]
PUT    /admin/:id/approve   Approve review [ADMIN]
DELETE /admin/:id           Delete review [ADMIN]
```

### Coupons Routes (`/api/coupons`)
```
POST   /validate           Validate + get discount (body: code, orderAmount)
GET    /admin/all          List coupons [ADMIN]
POST   /admin              Create coupon [ADMIN]
PUT    /admin/:id          Update coupon [ADMIN]
DELETE /admin/:id          Delete coupon [ADMIN]
```

### Buyback Routes (`/api/buyback`)
```
POST   /                   Submit buyback request
GET    /admin/all          List all requests [ADMIN]
GET    /admin/:id          Get request detail [ADMIN]
PUT    /admin/:id          Update status + offer price [ADMIN]
```

### Dashboard Routes (`/api/admin/dashboard`)
```
GET    /stats              Today's orders count, revenue, pending count, total products
GET    /low-stock          Products with stock <= low_stock_alert
```

### Addresses Routes (`/api/addresses`) [Auth required]
```
GET    /                   List user's addresses
POST   /                   Add address
PUT    /:id                Update address
DELETE /:id                Delete address
PUT    /:id/default        Set as default
```

### Upload Route (`/api/upload`)
```
POST   /image              Upload image to Cloudinary [ADMIN] — returns { url, public_id }
DELETE /image              Delete image from Cloudinary [ADMIN] — body: { public_id }
```

---

## 7. Authentication & Security

### JWT Configuration
- Access token: expires in 15 minutes
- Refresh token: expires in 30 days, stored in HttpOnly cookie (web) or AsyncStorage (mobile)
- Rotation: new refresh token issued on each `/refresh-token` call

### Middleware
- `authenticate` — verify access token, attach `req.user`
- `requireAdmin` — check `req.user.role === 'admin'`
- `optionalAuth` — attach user if token present, don't block if absent (for guest checkout)

### Password Hashing
- Use bcrypt with salt rounds = 12

### Input Validation
- Use Zod on all route handlers (server-side)
- Sanitize HTML in product descriptions (use DOMPurify or similar)

### Rate Limiting
- Login endpoint: max 5 attempts per IP per 15 minutes
- Registration: max 10 per IP per hour
- General API: 100 requests per minute per IP

### CORS
- Allow origins: your website domain + localhost in dev
- Credentials: true

---

## 8. File Storage

### Cloudinary Setup
- Create free Cloudinary account
- Create folder: `techstore/products`
- Store: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` in `.env`

### Upload Flow (Admin App)
1. Admin selects image from device gallery
2. App encodes image as base64 or multipart form data
3. App sends to `POST /api/upload/image`
4. Backend uploads to Cloudinary
5. Returns Cloudinary URL
6. App stores URL in product form state
7. On product save, URLs are saved to `product_images` table

### Image Transformations
- Use Cloudinary URL transformations for automatic resizing:
  - Thumbnail: `w_300,h_300,c_fill,q_auto`
  - Product main: `w_800,h_800,c_fit,q_auto`
  - Card: `w_400,h_300,c_fill,q_auto`

---

## 9. Order Flow — End to End

```
Customer adds items to cart
  → Cart synced to server (if logged in) or localStorage (guest)

Customer proceeds to checkout
  → Select/enter shipping address
  → Select payment method (COD / Bank Transfer / Stripe)

Customer places order
  → POST /api/orders
  → Backend validates:
      - All items in stock
      - Stock quantity >= ordered quantity
      - Coupon valid (if applied)
  → Creates order + order_items records
  → Reduces stock_quantity for each product
  → Clears cart
  → Sends confirmation email to customer (Nodemailer)
  → Sends push notification to admin via FCM
  → Returns { orderId, orderNumber }

Customer sees success page

Admin receives push notification on phone
  → Opens Admin App → Orders tab
  → Reviews new order
  → Updates status to "Confirmed"
      → Customer receives status-change email

Admin processes and ships
  → Updates to "Shipped" with tracking number
      → Customer email with tracking info

Admin marks delivered
  → Updates to "Delivered"
      → Customer receives delivery confirmation email
```

---

## 10. Notifications

### Customer Emails (Nodemailer)
Trigger each email with an HTML template:

| Event | Subject |
|---|---|
| Registration | Welcome to Gillani Tech — Verify your email |
| Order placed | Order #ORD-XXX confirmed |
| Order confirmed | Your order is confirmed |
| Order shipped | Your order is on its way! |
| Order delivered | Your order has been delivered |
| Order cancelled | Your order has been cancelled |
| Password reset | Reset your password |
| Buyback reviewed | Update on your buyback request |

### Admin Push Notifications (FCM)
| Event | Notification |
|---|---|
| New order | "New Order #ORD-XXX — Rs. X — [Customer Name]" |
| Low stock | "Low Stock Alert: [Product Name] has only X units left" |
| Buyback submitted | "New buyback request from [Customer Name]" |

---

## 11. Environment Variables

### Backend `.env`
```
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://user:password@host:5432/techstore

JWT_ACCESS_SECRET=your_access_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
JWT_ACCESS_EXPIRE=15m
JWT_REFRESH_EXPIRE=30d

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=youremail@gmail.com
SMTP_PASS=your_app_password
FROM_EMAIL=Gillani Tech <youremail@gmail.com>

FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."

STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

FRONTEND_URL=https://yourdomain.com
```

### Frontend `.env.local`
```
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

### React Native `.env`
```
API_URL=https://api.yourdomain.com
FIREBASE_API_KEY=...
FIREBASE_APP_ID=...
FIREBASE_MESSAGING_SENDER_ID=...
FIREBASE_PROJECT_ID=...
```

---

## 12. Deployment Guide

### Backend
1. Push code to GitHub
2. Create PostgreSQL database on Railway / Supabase / Render
3. Set `DATABASE_URL` + all env vars in hosting dashboard
4. Run `npx prisma migrate deploy` on deploy
5. Start server: `node server.js` or `npm start`

### Website (Next.js)
1. Push to GitHub
2. Connect repo to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy — Vercel auto-deploys on push to main branch

### Admin APK
1. Install EAS CLI: `npm install -g eas-cli`
2. Login: `eas login`
3. Configure `eas.json` with build profile for `android`
4. Run: `eas build --platform android --profile production`
5. Download APK from Expo dashboard
6. Install APK on admin Android device (enable "Install from unknown sources")
7. For updates: re-run EAS build + distribute new APK, or use Expo Updates for OTA JS updates

---

## 13. Folder Structure

### Backend
```
backend/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── products.controller.js
│   │   ├── orders.controller.js
│   │   ├── cart.controller.js
│   │   ├── categories.controller.js
│   │   ├── coupons.controller.js
│   │   ├── reviews.controller.js
│   │   ├── buyback.controller.js
│   │   └── dashboard.controller.js
│   ├── routes/
│   │   └── [matching files]
│   ├── middleware/
│   │   ├── authenticate.js
│   │   ├── requireAdmin.js
│   │   └── rateLimiter.js
│   ├── services/
│   │   ├── email.service.js
│   │   ├── cloudinary.service.js
│   │   ├── fcm.service.js
│   │   └── order.service.js
│   ├── utils/
│   │   ├── generateOrderNumber.js
│   │   └── generateSlug.js
│   └── app.js
├── server.js
├── .env
└── package.json
```

### Frontend (Next.js)
```
frontend/
├── app/
│   ├── page.tsx                  (Home)
│   ├── products/page.tsx
│   ├── products/[slug]/page.tsx
│   ├── cart/page.tsx
│   ├── checkout/page.tsx
│   ├── checkout/success/page.tsx
│   ├── orders/page.tsx
│   ├── orders/[id]/page.tsx
│   ├── account/page.tsx
│   ├── sell/page.tsx
│   └── auth/
│       ├── login/page.tsx
│       ├── register/page.tsx
│       ├── forgot-password/page.tsx
│       └── reset-password/page.tsx
├── components/
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── MobileMenu.tsx
│   ├── product/
│   │   ├── ProductCard.tsx
│   │   ├── ProductGrid.tsx
│   │   ├── ProductFilters.tsx
│   │   ├── ProductGallery.tsx
│   │   └── SpecsTable.tsx
│   ├── cart/
│   │   ├── CartItem.tsx
│   │   └── CartSummary.tsx
│   ├── checkout/
│   │   ├── AddressForm.tsx
│   │   └── PaymentStep.tsx
│   └── ui/
│       ├── StarRating.tsx
│       ├── Badge.tsx
│       └── Spinner.tsx
├── store/
│   ├── cartStore.ts
│   └── authStore.ts
├── lib/
│   └── axios.ts
└── types/
    └── index.ts
```

### Admin App (React Native)
```
admin-app/
├── src/
│   ├── screens/
│   │   ├── auth/LoginScreen.tsx
│   │   ├── dashboard/DashboardScreen.tsx
│   │   ├── products/
│   │   │   ├── ProductListScreen.tsx
│   │   │   ├── ProductDetailScreen.tsx
│   │   │   ├── AddProductScreen.tsx
│   │   │   └── EditProductScreen.tsx
│   │   ├── orders/
│   │   │   ├── OrderListScreen.tsx
│   │   │   └── OrderDetailScreen.tsx
│   │   └── settings/
│   │       ├── SettingsScreen.tsx
│   │       ├── CategoryManageScreen.tsx
│   │       ├── CouponManageScreen.tsx
│   │       └── BuybackScreen.tsx
│   ├── navigation/
│   │   ├── AppNavigator.tsx
│   │   ├── AuthNavigator.tsx
│   │   └── TabNavigator.tsx
│   ├── api/
│   │   ├── axios.ts
│   │   ├── auth.api.ts
│   │   ├── products.api.ts
│   │   └── orders.api.ts
│   ├── store/
│   │   └── authStore.ts
│   └── components/
│       ├── StatusBadge.tsx
│       ├── ProductImagePicker.tsx
│       └── StatCard.tsx
├── app.json
├── eas.json
└── package.json
```

---

## 14. Design System & UI/UX

### 14.1 Visual Identity
- **Primary Color**: `#0F172A` (Slate Dark) — Main text, headers, sidebar background.
- **Secondary Color**: `#0284C7` (Sky Blue) — Primary buttons, links, active states.
- **Accent Color**: `#10B981` (Emerald Green) — In-stock badges, success messages.
- **Warning Color**: `#F59E0B` (Amber) — Low stock alerts, pending status.
- **Danger Color**: `#EF4444` (Red) — Out of stock, delete actions, errors.
- **Background**: `#F8FAFC` (Light Gray) — Main page background.

### 14.2 Typography
- **Primary Font**: `Inter` (Sans-serif) — Clean, modern, highly readable at small sizes.
- **Monospace Font**: `JetBrains Mono` or `Roboto Mono` — For technical specs, SKUs, and order numbers.

### 14.3 Component States
- **Buttons**:
  - `Default`: Secondary color background, white text.
  - `Hover`: 10% darker than default.
  - `Disabled`: Grayed out, `not-allowed` cursor.
  - `Loading`: Spinner icon replaces text, button remains clickable but inactive.
- **Inputs**:
  - `Focus`: 2px border using Secondary color.
  - `Error`: 2px border using Danger color + help text below.

---

## 15. API Standards & Error Handling

### 15.1 Response Structure
All API responses should follow a consistent JSON format:
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```
In case of error:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE_STRING",
    "message": "User-friendly error message",
    "details": [ ... ] 
  }
}
```

### 15.2 HTTP Status Codes
- `200 OK`: Successful GET/PUT/DELETE.
- `201 Created`: Successful POST (resource creation).
- `400 Bad Request`: Validation errors or malformed request.
- `401 Unauthorized`: Missing or invalid JWT.
- `403 Forbidden`: Authenticated but lacks required role (e.g., customer trying to access admin route).
- `404 Not Found`: Resource does not exist.
- `429 Too Many Requests`: Rate limit exceeded.
- `500 Internal Server Error`: Unhandled server exceptions.

---

## 16. SEO & Analytics

### 16.1 Search Engine Optimization
- **Dynamic Meta Tags**: Every product page must have `og:title`, `og:description`, and `og:image` populated from database values.
- **Clean URLs**: Use slugs exclusively (e.g., `/products/hp-laserjet-m15w` instead of `/products/123`).
- **Sitemap**: Auto-generated `sitemap.xml` daily.
- **Structured Data**: JSON-LD scripts on Product Detail pages following Schema.org:
  ```json
  {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": "Product Name",
    "image": [ "url1", "url2" ],
    "description": "...",
    "brand": { "@type": "Brand", "name": "..." },
    "offers": { "@type": "Offer", "price": "100.00", "priceCurrency": "PKR" }
  }
  ```

### 16.2 Analytics
- **Google Analytics 4**: Track page views, sessions, and demographics.
- **Conversion Tracking**: Track "Add to Cart" and "Order Complete" events.
- **Facebook Pixel**: (Pixel API) For retargeting ads based on viewed products.

---

## 17. Testing & QA Strategy

### 17.1 Backend Testing
- **Tool**: Vitest / Supertest.
- **Scope**: Controller logic, service calculations (discounts/tax), and authentication middleware.

### 17.2 Frontend Testing
- **Tool**: Playwright.
- **Scope**: Critical user paths (Login -> Add to Cart -> Checkout -> Order Success).
- **Mobile**: Responsive testing for various viewport sizes.

### 17.3 Admin APK Testing
- **Tool**: Maestro.
- **Scope**: Product creation flow, real-time push notification reception, and order status updates.

---

## 18. Maintenance & Monitoring

### 18.1 Logging
- **Library**: `Pino` or `Winston`.
- **Strategy**: Log all errors with stack traces. In production, send logs to a central service like Axiom or Graylog.

### 18.2 Error Tracking
- **Service**: Sentry.io.
- **Implementation**: Capture all unhandled exceptions in React (ErrorBoundary) and Node.js.

### 18.3 Backups
- **Database**: Daily automated backups of PostgreSQL.
- **Images**: Cloudinary provides its own redundancy for hosted assets.

---

## 19. Future Roadmap

### Phase 2: Engagement & Automation
- **Loyalty Program**: Earn points on every purchase; redeem for discounts.
- **WhatsApp Integration**: Automated order updates via WhatsApp Business API.
- **AI Product Assistant**: Chatbot to help users find the right ink/toner for their printer model.

### Phase 3: Scaling
- **Multi-vendor Support**: Allow trusted partners to list tech accessories.
- **Inventory Barcode Scanner**: Integrated into Admin APK for faster stock updates.
- **PWA (Progressive Web App)**: Enable offline browsing and "Add to Home Screen" for customers.

---

*End of Specification — Gillani Tech v1.0*
*Total deliverables: 1 customer website (Next.js) + 1 admin Android APK (React Native Expo) + 1 REST API backend (Node.js/Express/PostgreSQL)*
