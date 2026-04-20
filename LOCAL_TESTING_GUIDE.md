# Gillani Tech — Local Testing Guide

## Prerequisites

- Node.js 20+ installed
- Supabase project (or any PostgreSQL database)
- Git

---

## Step 1 — Start the API

```bash
cd d:/gillanitechwebsite/api

# Install dependencies (first time only)
npm install

# Generate Prisma client
npx prisma generate

# Sync database tables (first time only, requires DB to be online)
npx prisma db push

# Start the API
node server.js
```

You should see:
```
Server running on port 5000
```

Test it:
```bash
curl http://localhost:5000
# {"message":"Welcome to Gillani Tech API","status":"active"}
```

---

## Step 2 — Start the Frontend

Open a NEW terminal (keep API running in the first one):

```bash
cd d:/gillanitechwebsite/frontend

# Install dependencies (first time only)
npm install

# Start dev server
npm run dev
```

Open http://localhost:3000 in your browser.

---

## Step 3 — Start the Admin App

Open a THIRD terminal:

```bash
cd d:/gillanitechwebsite/admin-app

# Install dependencies (first time only)
npm install

# Start Expo
npx expo start
```

Then:
- **Android emulator**: press `a`
- **iOS simulator**: press `i`
- **Physical phone**: scan the QR code with Expo Go app

> Note: Admin app connects to `http://10.0.2.2:5000` (Android emulator) or `http://localhost:5000` (iOS/web). For a real device, change to your computer's LAN IP (e.g., `http://192.168.1.100:5000`).

---

## Testing the Full Flow

### 1. Create an Admin User

Register via the website:
1. Go to http://localhost:3000/auth/register
2. Fill in name, email, phone, password
3. Submit

Then make them admin. In Supabase SQL Editor:
```sql
UPDATE users SET role = 'admin' WHERE email = 'your-email@test.com';
```

### 2. Test the Website (Customer Flow)

| What to test | URL | Steps |
|---|---|---|
| Browse products | http://localhost:3000 | See home page with categories and products |
| Search & filter | http://localhost:3000/shop | Use sidebar filters, search bar, sort |
| Add to cart | Click any product → Add to Cart | Check cart badge updates in header |
| View cart | http://localhost:3000/cart | Change quantities, remove items |
| Checkout (COD) | Click "Proceed to Checkout" | Fill shipping form → Place Order |
| View orders | http://localhost:3000/dashboard/orders | See your order history |
| Wishlist | Click heart icon on product cards | Check http://localhost:3000/wishlist |
| Account | http://localhost:3000/account | Edit profile, change password |

### 3. Test the Web Admin Dashboard

1. Login with your **admin** account at http://localhost:3000/auth/login
2. Go to http://localhost:3000/admin

| What to test | URL | Steps |
|---|---|---|
| Dashboard stats | /admin | See revenue, orders, pending, products |
| Manage orders | /admin/orders | Filter by status, search, update status |
| Order detail | /admin/orders/[id] | Add tracking, notes, mark paid |
| Manage products | /admin/products | Search, toggle active, delete |
| Manage categories | /admin/categories | Add/delete categories |
| Manage coupons | /admin/coupons | Create coupons, toggle active |
| Buyback requests | /admin/buyback | Review buyback submissions |

### 4. Test the Admin Mobile App

1. Open the admin app in Expo Go
2. Login with your **admin** credentials
3. Test each tab:
   - **Dashboard**: Pull to refresh, view stats
   - **Products**: Search, tap "+" to add product
   - **Orders**: Filter tabs, tap order → update status
   - **Settings**: Change password, manage categories/coupons/buyback

---

## Adding Test Data

If your database is empty, add categories and products via the API:

### Add Categories
```bash
curl -X POST http://localhost:5000/api/categories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{"name":"Printers","description":"All types of printers"}'

curl -X POST http://localhost:5000/api/categories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{"name":"Ink & Toner"}'

curl -X POST http://localhost:5000/api/categories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{"name":"Cables & Adapters"}'

curl -X POST http://localhost:5000/api/categories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{"name":"Keyboards & Mice"}'
```

### Get Your Admin Token
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your-admin@email.com","password":"your-password"}'
# Copy the accessToken from the response
```

### Add a Product
```bash
curl -X POST http://localhost:5000/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "name": "HP LaserJet Pro M404n",
    "slug": "hp-laserjet-pro-m404n",
    "brand": "HP",
    "model_number": "M404n",
    "sku": "HP-M404N-001",
    "price": 45000,
    "compare_price": 52000,
    "stock_quantity": 15,
    "category_id": "CATEGORY_ID_FROM_ABOVE",
    "description": "Reliable monochrome laser printer for small offices",
    "specs": [
      {"label": "Print Speed", "value": "38 ppm"},
      {"label": "Resolution", "value": "1200 x 1200 dpi"},
      {"label": "Connectivity", "value": "WiFi, USB, Ethernet"}
    ]
  }'
```

---

## Running Tests

```bash
cd d:/gillanitechwebsite/api
npm test
```

---

## Common Issues

| Problem | Fix |
|---|---|
| "Can't reach database server" | Supabase project is paused. Go to Supabase dashboard → click "Restore" |
| API crashes on start | Check `.env` file has all required variables |
| Frontend shows blank page | Make sure API is running on port 5000 |
| CORS errors | API `.env` should have `FRONTEND_URL=http://localhost:3000` |
| Admin app can't connect | Check API URL matches your setup (localhost vs 10.0.2.2 vs LAN IP) |
| "Prisma Client not generated" | Run `npx prisma generate` in the api folder |
| Images not loading | Check Cloudinary env vars are set in API `.env` |
