# Gillani Tech — VPS Deployment Guide

> Complete guide to deploy alongside an existing site on the same VPS, with domain setup from Namecheap, Supabase database, and admin app build.

---

## Architecture Overview

```
VPS (Ubuntu)
├── Nginx (reverse proxy)
│   ├── gillanicomputersandprinters.com → :3000 (Gillani Frontend)
│   ├── api.gillanicomputersandprinters.com → :5000 (Gillani API)
│   └── existing-site.com → existing config
├── PM2 (process manager)
│   ├── gillani-api    (Express, port 5000)
│   └── gillani-frontend (Next.js, port 3000)
└── Supabase (external PostgreSQL)
```

---

## Step 1 — Supabase Database Setup

### 1.1 Create Supabase Project

1. Go to https://supabase.com → Sign up / Log in
2. Click **New Project**
3. Fill in:
   - **Name**: `gillani-tech`
   - **Database Password**: Generate a strong password → SAVE THIS
   - **Region**: Pick closest to your users (e.g., Singapore for Pakistan)
4. Wait ~2 minutes for project to provision

### 1.2 Get Connection String

1. In Supabase dashboard → **Settings** (gear icon) → **Database**
2. Scroll to **Connection string** → URI format
3. Copy it. It looks like:
   ```
   postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
   ```
4. This is your `DATABASE_URL` for the `.env` file

### 1.3 Sync the Schema

Run from your LOCAL machine (with the API code):
```bash
cd api
npx prisma db push
```
This creates all 14 tables (users, products, orders, etc.) in Supabase.

### 1.4 Create Admin User

After schema is synced, create your admin user. In Supabase dashboard:
- Go to **SQL Editor**
- Run:
```sql
-- First register via the API, then update role to admin:
UPDATE users SET role = 'admin' WHERE email = 'your-admin@email.com';
```

Or use the API:
```bash
# Register
curl -X POST http://YOUR_VPS_IP:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin","email":"admin@gillanitech.com","password":"StrongPass123","phone":"+923001234567"}'

# Then update role in Supabase SQL Editor:
UPDATE users SET role = 'admin' WHERE email = 'admin@gillanitech.com';
```

---

## Step 2 — VPS Preparation

### 2.1 SSH into your VPS

```bash
ssh root@YOUR_VPS_IP
```

### 2.2 Install Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v  # Should show v20.x
```

### 2.3 Install PM2 (Process Manager)

```bash
sudo npm install -g pm2
```

### 2.4 Install Nginx (if not already)

```bash
sudo apt update
sudo apt install -y nginx
```

---

## Step 3 — Upload Code to VPS

### Option A: Git Clone (Recommended)

```bash
# On your LOCAL machine
cd d:/gillanitechwebsite
git init
git add .
git commit -m "Initial commit"
# Push to GitHub/GitLab (create a private repo first)
git remote add origin https://github.com/YOUR_USERNAME/gillanitech.git
git push -u origin main

# On VPS
cd /var/www
git clone https://github.com/YOUR_USERNAME/gillanitech.git
cd gillanitech
```

### Option B: SCP Upload

```bash
# From your LOCAL machine
scp -r d:/gillanitechwebsite root@YOUR_VPS_IP:/var/www/gillanitech
```

---

## Step 4 — Configure API

### 4.1 Install Dependencies

```bash
cd /var/www/gillanitech/api
npm install
```

### 4.2 Create .env File

```bash
nano .env
```

Paste this (fill in your real values):

```env
# Server
PORT=5000
NODE_ENV=production

# Database (from Supabase Settings → Database → Connection String)
DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres

# Auth
JWT_ACCESS_SECRET=generate-a-random-64-char-string-here
JWT_REFRESH_SECRET=another-random-64-char-string-here

# Stripe (get from https://dashboard.stripe.com/apikeys)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Cloudinary (get from https://cloudinary.com/console)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Frontend URL (for CORS)
FRONTEND_URL=https://gillanicomputersandprinters.com

# Email (optional — use Gmail App Password or SendGrid)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=noreply@gillanicomputersandprinters.com

# Sentry (optional)
SENTRY_DSN=https://...@sentry.io/...

# Logging
LOG_LEVEL=info
```

**Generate JWT secrets:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 4.3 Generate Prisma Client

```bash
npx prisma generate
```

### 4.4 Start API with PM2

```bash
pm2 start server.js --name gillani-api
pm2 save
pm2 startup  # Follow the command it prints
```

Verify:
```bash
pm2 logs gillani-api  # Should show "Server running on port 5000"
curl http://localhost:5000  # Should return welcome message
```

---

## Step 5 — Configure Frontend

### 5.1 Install Dependencies

```bash
cd /var/www/gillanitech/frontend
npm install
```

### 5.2 Create .env.local

```bash
nano .env.local
```

```env
NEXT_PUBLIC_API_URL=https://api.gillanicomputersandprinters.com/api
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
NEXT_PUBLIC_SITE_URL=https://gillanicomputersandprinters.com
```

### 5.3 Build & Start

```bash
npm run build
pm2 start npm --name gillani-frontend -- start
pm2 save
```

Verify:
```bash
curl http://localhost:3000  # Should return HTML
```

---

## Step 6 — Namecheap Domain Setup

### 6.1 Point Domain to VPS IP

1. Log into https://www.namecheap.com
2. Go to **Domain List** → **Manage** next to `gillanicomputersandprinters.com`
3. Go to **Advanced DNS** tab
4. Add these records:

| Type | Host | Value | TTL |
|------|------|-------|-----|
| A Record | `@` | `YOUR_VPS_IP` | Automatic |
| A Record | `www` | `YOUR_VPS_IP` | Automatic |
| A Record | `api` | `YOUR_VPS_IP` | Automatic |
| CNAME Record | `admin` | `gillanicomputersandprinters.com` | Automatic |

Wait 5–30 minutes for DNS propagation.

### 6.2 Verify DNS Propagation

```bash
# On your local machine
ping gillanicomputersandprinters.com
# Should resolve to your VPS IP
```

---

## Step 7 — SSL Certificates (HTTPS)

### 7.1 Install Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 7.2 Get Certificates (AFTER Nginx config in Step 8)

```bash
sudo certbot --nginx -d gillanicomputersandprinters.com -d www.gillanicomputersandprinters.com
sudo certbot --nginx -d api.gillanicomputersandprinters.com
```

Certbot will automatically modify your Nginx configs to use HTTPS.

### 7.3 Auto-Renewal

```bash
sudo certbot renew --dry-run  # Test renewal
# Certbot installs a cron job automatically
```

---

## Step 8 — Nginx Configuration

### 8.1 Gillani Frontend

```bash
sudo nano /etc/nginx/sites-available/gillani-frontend
```

```nginx
server {
    listen 80;
    server_name gillanicomputersandprinters.com www.gillanicomputersandprinters.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Next.js static files caching
    location /_next/static {
        proxy_pass http://127.0.0.1:3000;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }
}
```

### 8.2 Gillani API

```bash
sudo nano /etc/nginx/sites-available/gillani-api
```

```nginx
server {
    listen 80;
    server_name api.gillanicomputersandprinters.com;

    client_max_body_size 10M;  # For image uploads

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Stripe webhook raw body — important!
        proxy_request_buffering off;
    }
}
```

### 8.3 Enable Sites

```bash
sudo ln -s /etc/nginx/sites-available/gillani-frontend /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/gillani-api /etc/nginx/sites-enabled/
sudo nginx -t  # Test config
sudo systemctl reload nginx
```

### 8.4 NOW Run Certbot (Step 7.2)

```bash
sudo certbot --nginx -d gillanicomputersandprinters.com -d www.gillanicomputersandprinters.com
sudo certbot --nginx -d api.gillanicomputersandprinters.com
```

---

## Step 9 — Stripe Webhook Setup

1. Go to https://dashboard.stripe.com/webhooks
2. Click **Add endpoint**
3. URL: `https://api.gillanicomputersandprinters.com/api/payments/webhook`
4. Events to listen: `checkout.session.completed`
5. Copy the **Signing secret** (starts with `whsec_...`)
6. Add it to your API `.env` as `STRIPE_WEBHOOK_SECRET`
7. Restart API:
```bash
cd /var/www/gillanitech/api
pm2 restart gillani-api
```

---

## Step 10 — Admin App Build

### 10.1 Install EAS CLI

```bash
npm install -g eas-cli
eas login  # Login to your Expo account
```

### 10.2 Configure Build

```bash
cd /var/www/gillanitech/admin-app
```

Update `app.json` to change the API URL:
```json
{
  "expo": {
    "name": "Gillani Tech Admin",
    "slug": "gillani-admin",
    "version": "1.0.0",
    "extra": {
      "apiUrl": "https://api.gillanicomputersandprinters.com/api"
    }
  }
}
```

Then update ALL hardcoded `http://10.0.2.2:5000/api` in the admin app screens to use a constant:
```typescript
const API_BASE = "https://api.gillanicomputersandprinters.com/api";
```

### 10.3 Build APK

```bash
eas build --platform android --profile preview
```

This creates a downloadable APK. Share the link with your admin users.

### 10.4 Alternative: Build Locally

If you have Android Studio:
```bash
cd admin-app
npx expo export --platform android
```

---

## Step 11 — Cloudinary Setup

1. Go to https://cloudinary.com → Sign up free
2. Dashboard shows: **Cloud Name**, **API Key**, **API Secret**
3. Add these to API `.env`
4. In Cloudinary Settings → Upload:
   - Create upload preset named `gillani-products`
   - Signing Mode: **Unsigned** (for admin app uploads)

---

## Step 12 — Post-Deployment Checklist

```bash
# 1. Test API is responding
curl https://api.gillanicomputersandprinters.com

# 2. Test frontend loads
curl https://gillanicomputersandprinters.com

# 3. Test products endpoint
curl https://api.gillanicomputersandprinters.com/api/products

# 4. Register a test user
curl -X POST https://api.gillanicomputersandprinters.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"test123","phone":"03001234567"}'

# 5. Check PM2 processes
pm2 status

# 6. Check logs
pm2 logs

# 7. Check Nginx
sudo nginx -t
sudo systemctl status nginx
```

---

## Quick Reference Commands

```bash
# Restart services
pm2 restart gillani-api
pm2 restart gillani-frontend

# View logs
pm2 logs gillani-api
pm2 logs gillani-frontend

# Update code
cd /var/www/gillanitech
git pull origin main
cd api && npm install && pm2 restart gillani-api
cd ../frontend && npm install && npm run build && pm2 restart gillani-frontend

# Check disk
df -h

# Check memory
free -m

# Check what's using ports
sudo lsof -i :5000
sudo lsof -i :3000
```

---

## Security Hardening

```bash
# Firewall
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable

# Fail2ban (block brute force SSH)
sudo apt install fail2ban -y
sudo systemctl enable fail2ban

# Automatic security updates
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure -plow unattended-upgrades
```

---

## Environment Variables Summary

### API `.env` — ALL required
```env
PORT=5000
NODE_ENV=production
DATABASE_URL=postgresql://postgres.REF:PASS@aws-0-region.pooler.supabase.com:6543/postgres
JWT_ACCESS_SECRET=<64-char-hex>
JWT_REFRESH_SECRET=<different-64-char-hex>
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
FRONTEND_URL=https://gillanicomputersandprinters.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=you@gmail.com
SMTP_PASS=app-password
FROM_EMAIL=noreply@gillanicomputersandprinters.com
SENTRY_DSN=https://xxx@sentry.io/xxx
LOG_LEVEL=info
```

### Frontend `.env.local`
```env
NEXT_PUBLIC_API_URL=https://api.gillanicomputersandprinters.com/api
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
NEXT_PUBLIC_GA_ID=G-XXXXXXX
NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx
NEXT_PUBLIC_SITE_URL=https://gillanicomputersandprinters.com
```
