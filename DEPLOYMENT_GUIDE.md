# Gillani Tech Ecosystem - Deployment & Local Setup Guide

This guide provides step-by-step instructions for running the **Gillani Tech** platform locally and deploying it to production environments.

---

## 1. Local Setup Instructions

### Backend (API)
1. **Navigate**: `cd api`
2. **Install**: `npm install`
3. **Database**: 
   - Ensure your `.env` has the `DATABASE_URL` (Supabase).
   - Run `npx prisma generate` to update the client.
4. **Run**: `npm start` (Runs on `http://localhost:5000`)

### Frontend (Next.js Storefront)
1. **Navigate**: `cd frontend`
2. **Install**: `npm install`
3. **Run**: `npm run dev` (Runs on `http://localhost:3000`)
4. **Environment**: Ensure `NEXT_PUBLIC_API_URL=http://localhost:5000/api`

### Admin App (Expo Mobile)
1. **Navigate**: `cd admin-app`
2. **Install**: `npm install`
3. **Run**: `npx expo start`
4. **Testing**: Use the **Expo Go** app on your physical device or an emulator.

---

## 2. Production Deployment Strategy

### API Deployment (Recommendation: [Railway](https://railway.app) or [Render](https://render.com))
1. Connect your GitHub repository.
2. Direct the build to the `api` folder.
3. **Required Env Variables**:
   - `DATABASE_URL` (Supabase Connection String)
   - `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `CLOUDINARY_CLOUD_NAME` / `API_KEY` / `API_SECRET`
   - `FRONTEND_URL` (Your production domain)

### Storefront Deployment (Recommendation: [Vercel](https://vercel.com))
1. Connect your GitHub repository.
2. Select the `frontend` folder as the root.
3. **Required Env Variables**:
   - `NEXT_PUBLIC_API_URL` (Your deployed API domain + `/api`)

### Mobile App Publishing (Recommendation: [Expo EAS](https://expo.dev/eas))
1. Install EAS CLI: `npm install -g eas-cli`
2. Login: `eas login`
3. Configure: `eas build:configure`
4. Build for Production: `eas build --platform ios` or `eas build --platform android`

---

## 3. Stripe Webhook Testing (Development)
To test payments locally without a public URL:
1. Install the [Stripe CLI](https://stripe.com/docs/stripe-cli).
2. Login: `stripe login`
3. Forward Webhooks: `stripe listen --forward-to localhost:5000/api/payments/webhook`
4. Copy the **Webhook Secret** provided and paste it into `api/.env`.

---

**Gillani Tech - Building the Future of Premium Commerce.**
