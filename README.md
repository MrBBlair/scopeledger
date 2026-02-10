# ScopeLedger

A **mobile-first, production-grade React web application** for project management budgeting: authentication, AI insights, cost tracking, change orders, and forecasting.

## Tech stack

- **Frontend:** React 19, TypeScript, Vite, React Router 7, Tailwind CSS v4
- **Auth & DB:** Firebase Authentication (Email/Password, Google), Firestore
- **Email:** Postmark via Vercel serverless `/api/email`
- **AI:** Google Gemini (`@google/generative-ai`)
- **Hosting:** Vercel (SPA + serverless API)

## Features

- **Auth:** Email/password + Google Sign-In, protected routes, admin via Firebase UID allowlist
- **Projects:** Create, edit, archive; baseline budget, overhead, lock after creation
- **Costs:** Add/edit/delete, categories & vendors, manual/automatic deductions, audit logs
- **Change orders:** Positive/negative, approval flow, budget recalculation
- **Forecasting:** Cost-to-date, burn rate, remaining budget, AI-assisted insights, versioned snapshots
- **Logs:** Immutable audit log, CSV export
- **Onboarding:** 4-step flow (Welcome → Login → Profile → Tour), skippable
- **Guides:** User Guide (Settings), Admin Guide (admin-only)

## Setup

### 1. Clone and install

```bash
git clone <repo>
cd "PM Budgeting Tool"
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env.local` and fill in:

```bash
cp .env.example .env.local
```

**Client (Vite):**

- `VITE_FIREBASE_*` — Firebase project config (see [Firebase Console](https://console.firebase.google.com))
- `VITE_ADMIN_UIDS` — Comma-separated Firebase UIDs for admin access
- `VITE_GEMINI_API_KEY` — Google Gemini API key (optional; AI disabled if missing)

**Server (Vercel):** Set in project settings, not in `.env.local`:

- `POSTMARK_API_KEY` — Postmark server API token
- `EMAIL_FROM` — e.g. `noreply@techephi.com`

### 3. Firebase

**Follow [docs/FIREBASE_SETUP.md](docs/FIREBASE_SETUP.md)** for step-by-step instructions:

1. Create a Firebase project in the Console and enable Auth (Email/Password, Google) and Firestore.
2. Register the web app and copy config into `.env.local` as `VITE_FIREBASE_*`.
3. Run `firebase use --add` and `firebase deploy --only firestore` to deploy rules and indexes (the repo has `firebase.json` configured).

### 4. Run locally

```bash
npm run dev
```

- App: [http://localhost:5173](http://localhost:5173)
- Email API: use `vercel dev` for `/api/email` locally, or skip (welcome emails etc. will no-op without Postmark).

## Vercel deployment

**Follow [docs/VERCEL_SETUP.md](docs/VERCEL_SETUP.md)** for step-by-step instructions:

1. Push the repo to GitHub, then **Import** the project in [Vercel](https://vercel.com).
2. Add **Environment Variables** (same `VITE_FIREBASE_*` as in `.env.local`, plus optional `VITE_ADMIN_UIDS`, `VITE_GEMINI_API_KEY`, `POSTMARK_API_KEY`, `EMAIL_FROM`).
3. Deploy; then add your Vercel URL to **Firebase Console → Authentication → Authorized domains**.

### API routes

- `POST /api/email` — Body: `{ type: 'welcome'|'password_reset'|'notification', to, ... }`.  
  Implemented in `api/email.ts`; uses Postmark when `POSTMARK_API_KEY` is set.

## Project structure

```
src/
  auth/           # ProtectedRoute
  components/     # Button, Input, Card, Modal, Footer, etc.
  context/        # Auth, Onboarding
  hooks/          # useProjects, useProjectDetail
  layouts/        # Main, Onboarding, Public
  pages/          # Home, Login, Onboarding, App pages, Terms, Privacy
  services/       # firebase, firestore, email client
  ai/             # Gemini integration
  utils/          # cn, format, scrollIntoView
  types/          # Shared TS types
api/
  email.ts        # Vercel serverless Postmark handler
docs/
  ARCHITECTURE.md
  FIRESTORE_SCHEMA.md
firestore.rules
firestore.indexes.json
```

## Documentation

- **Architecture:** `docs/ARCHITECTURE.md`
- **Firestore schema:** `docs/FIRESTORE_SCHEMA.md`
- **Firebase setup:** `docs/FIREBASE_SETUP.md` — step-by-step to create the Firebase project and deploy rules/indexes.
- **Vercel setup:** `docs/VERCEL_SETUP.md` — step-by-step to deploy on Vercel.
- **Legal:** Terms and Privacy pages in-app; footer links to Techephi.

## Scripts

- `npm run dev` — Start Vite dev server
- `npm run build` — Production build
- `npm run preview` — Preview production build
- `npm run lint` — Run ESLint

## License

Proprietary. See Terms & Conditions and Privacy Policy in-app.
