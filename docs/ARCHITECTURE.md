# ScopeLedger — Architecture Overview

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, Vite, React Router 7, Tailwind CSS |
| Auth | Firebase Authentication (Email/Password, Google Sign-In) |
| Database | Firebase Firestore (user-scoped) |
| Email | Postmark via Vercel serverless `/api/email` |
| AI | Google Gemini (`@google/generative-ai`) |
| Hosting | Vercel (SPA + serverless API) |

## Auth & User Management

- **Auth:** Firebase Auth. Sessions persist via SDK; no custom tokens.
- **Users:** Firestore `users/{uid}` stores profile (`displayName`, `photoURL`, `onboardingCompleted`).
- **Scoping:** All project/cost/change-order/forecast/audit data is keyed by `ownerId` (Firebase UID) or `projectId` → `ownerId`.
- **Admin:** Admin rights determined by **Firebase UID** allowlist in `VITE_ADMIN_UIDS` (comma-separated). Admin-only routes and Admin Guide check this.

## Firestore Schema

See `docs/FIRESTORE_SCHEMA.md`.

## Security (Firebase Rules)

See `firestore.rules`. Summary:

- `users/{uid}`: read/write only by `request.auth.uid == uid`.
- `projects`: user can read/write only their own (`ownerId == request.auth.uid`).
- `costs`, `changeOrders`, `forecasts`, `auditLogs`: readable/writable only if user has access to the linked project (project `ownerId` check).

## AI (Google Gemini)

- **Usage:** Budget insights, forecast risk, monthly summaries, natural-language Q&A.
- **Behaviour:** Optional, explainable, **never** mutates data. All suggestions are advisory; user explicitly applies changes.
- **Config:** `VITE_GEMINI_API_KEY` (client-side; consider backend proxy for higher sensitivity).

## Email (Postmark)

- **Flow:** App calls Vercel `POST /api/email` with `{ type, to, ... }`. Serverless function uses `POSTMARK_API_KEY` and sends via Postmark.
- **Types:** `welcome`, `password_reset`, `notification`.

## Routing

- **Public:** `/`, `/terms`, `/privacy`, `/login` (redirect if authenticated).
- **Onboarding:** `/onboarding` (steps 1–4); skippable, progress stored in profile.
- **App:** `/app/*` — protected. Layout: sidebar (desktop) / bottom nav (mobile), main content.
- **Admin:** `/app/admin/*` and Admin Guide — admin-only.

## Deployment (Vercel)

- **Build:** `npm run build`; output `dist/`.
- **API:** `/api/*` → serverless functions in `/api`.
- **Env:** `VITE_*` for client; `POSTMARK_API_KEY`, `EMAIL_FROM` for API. Configure in Vercel project settings.

## Project Structure

```
src/
  auth/          # auth helpers, protected-route HOC
  components/    # shared UI (buttons, inputs, forms, modals)
  pages/         # route-level pages
  layouts/       # app layout, onboarding layout
  hooks/         # useProjects, useCosts, etc.
  services/      # firebase, firestore, email client
  ai/            # Gemini integration
  context/       # Auth, onboarding
  utils/         # cn, format, scrollIntoView
  types/         # TS types
  styles/        # global CSS (Tailwind)
api/
  email.ts       # Postmark serverless handler
```
