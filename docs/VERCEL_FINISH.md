# Finish Vercel setup

Your ScopeLedger project is connected to Vercel. Complete these steps so the app works in production.

---

## 1. Add environment variables in Vercel

1. Open your project on [Vercel](https://vercel.com) → **Settings** → **Environment Variables**.
2. Add each variable below. Use the **same values** as in your local `.env.local` (from [Firebase setup](FIREBASE_SETUP.md)).

| Variable | Required | Notes |
|----------|----------|--------|
| `VITE_FIREBASE_API_KEY` | Yes | From Firebase web app config |
| `VITE_FIREBASE_AUTH_DOMAIN` | Yes | From Firebase web app config |
| `VITE_FIREBASE_PROJECT_ID` | Yes | From Firebase web app config |
| `VITE_FIREBASE_STORAGE_BUCKET` | Yes | From Firebase web app config |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Yes | From Firebase web app config |
| `VITE_FIREBASE_APP_ID` | Yes | From Firebase web app config |
| `VITE_ADMIN_UIDS` | No | Comma-separated Firebase UIDs for admin |
| `POSTMARK_API_KEY` | No | For welcome/password-reset emails |
| `EMAIL_FROM` | No | e.g. `noreply@techephi.com` |

- **Environment:** select **Production** (and **Preview** if you want preview deployments to work).
- **Save** each variable.

If you added variables **after** the first deploy, trigger a new deploy: **Deployments** → … on the latest → **Redeploy**.

---

## 2. Add your Vercel URL to Firebase

So sign-in (including Google) works on the live site:

1. Go to [Firebase Console](https://console.firebase.google.com) → your project.
2. Open **Build** → **Authentication** → **Settings** (or the **Sign-in method** tab and look for **Authorized domains**).
3. Under **Authorized domains**, click **Add domain**.
4. Enter your Vercel hostname, e.g. `scopeledger-xxx.vercel.app` (no `https://`).
5. Save.

---

## 3. Confirm

- Visit your Vercel URL; the app should load.
- Sign up or sign in; auth should work after step 2.
- Create a project and add a cost; Firestore should work if the six `VITE_FIREBASE_*` variables are set.

You’re done. Future pushes to `main` will deploy automatically.
