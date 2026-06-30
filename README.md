# TRON/BSC USDT System - Full Stack

A full-stack system with 4 apps:

| App | Path | Port | Description |
|-----|------|------|-------------|
| Backend | `apps/backend` | 3000 | Express API + MongoDB |
| Landing | `apps/landing` | 5173 | Vite React landing page |
| Scanner | `apps/scanner` | 3001 | Next.js Trust Wallet UI |
| Admin | `apps/admin` | 5174 | Vite React admin dashboard |

---

## Prerequisites

- Node.js 18+
- Docker (for MongoDB) OR MongoDB installed locally
- npm

---

## Quick Start

### 1. Install dependencies

```bash
# Install root dependencies (concurrently)
npm install

# Install all apps
npm run install:all
```

### 2. Start MongoDB

```bash
# Using Docker (recommended)
npm run docker:up

# OR if you have MongoDB installed locally, just make sure it's running
```

### 3. Configure Environment

Backend `.env` is already set up at `apps/backend/.env`. Update the `TRON_WALLET_PRIVATE_KEY` if needed.

Admin `.env` is at `apps/admin/.env` - defaults to local backend.

Landing and Scanner use `env.ts` files which are already configured for local development.

### 4. Run all apps together

```bash
npm run dev
```

This starts all 4 apps simultaneously:
- Backend: http://localhost:3000
- Landing: http://localhost:5173
- Scanner: http://localhost:3001
- Admin: http://localhost:5174

### 5. Run individually

```bash
npm run dev:backend    # Only backend
npm run dev:landing    # Only landing page
npm run dev:scanner    # Only scanner
npm run dev:admin      # Only admin dashboard
```

---

## Ports Summary

| Service | URL |
|---------|-----|
| Backend API | http://localhost:3000 |
| Landing Page | http://localhost:5173 |
| Scanner (Next.js) | http://localhost:3001 |
| Admin Dashboard | http://localhost:5174 |
| MongoDB | mongodb://localhost:27017 |

---

## Deployment

### Backend (Node.js)
Deploy to any Node.js hosting (Railway, Render, VPS):
```bash
cd apps/backend
npm install
npm start
```
Set environment variables from `.env` in your hosting platform.

### Landing & Admin (Vite)
Build static files and deploy to Vercel/Netlify/any static host:
```bash
cd apps/landing   # or apps/admin
npm install
npm run build
# Output in dist/ folder
```

### Scanner (Next.js)
Deploy to Vercel or any Next.js compatible host:
```bash
cd apps/scanner
npm install
npm run build
npm start
```

### After Deployment
Update the `BASE_URL` in:
- `apps/landing/env.ts` → your deployed backend URL
- `apps/scanner/env.ts` → your deployed backend URL
- `apps/admin/.env` → `VITE_BASE_URL=https://your-backend.com`

---

## Project Structure

```
juber/
├── apps/
│   ├── backend/      # Express API (Node.js)
│   ├── landing/      # Landing page (Vite + React)
│   ├── scanner/      # Wallet scanner UI (Next.js)
│   └── admin/        # Admin dashboard (Vite + React)
├── docker-compose.yml
├── package.json
└── README.md
```

---

## Stop Services

```bash
# Stop MongoDB
npm run docker:down

# Stop dev servers: Ctrl+C in the terminal running `npm run dev`
```
