# Vercel setup (step-by-step)

Do these steps **after** you’ve completed [Firebase setup](FIREBASE_SETUP.md) and have your `.env.local` with `VITE_FIREBASE_*` filled in. The repo already has `vercel.json` configured for the SPA and `/api/*` routes.

---

## Part 1: Push your code (you do this)

### Step 1.1 – Push to GitHub

1. Create a new repository on [GitHub](https://github.com/new) (e.g. **pm-budgeting-tool**).
2. From your **PM Budgeting Tool** folder:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

Use your real GitHub username and repo name. If the repo already exists and is connected, just push your latest commits.

---

## Part 2: Create the Vercel project (you do this in the browser)

### Step 2.1 – Import the project

1. Go to [Vercel](https://vercel.com) and sign in (GitHub is easiest).
2. Click **Add New… → Project**.
3. **Import** the Git repository that contains the PM Budgeting Tool (e.g. **pm-budgeting-tool**).
4. Vercel will detect the repo. Leave the defaults:
   - **Framework Preset:** Other (or Vite if shown)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`
5. **Do not deploy yet.** Click **Environment Variables** (or expand it) so we can add variables first.

### Step 2.2 – Add environment variables

Add these in the Vercel project’s **Environment Variables** section. Use the same values you have in `.env.local` from the Firebase setup (and optional keys if you use them).

| Name | Value | Notes |
|------|--------|--------|
| `VITE_FIREBASE_API_KEY` | (from Firebase) | Required |
| `VITE_FIREBASE_AUTH_DOMAIN` | (from Firebase) | Required |
| `VITE_FIREBASE_PROJECT_ID` | (from Firebase) | Required |
| `VITE_FIREBASE_STORAGE_BUCKET` | (from Firebase) | Required |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | (from Firebase) | Required |
| `VITE_FIREBASE_APP_ID` | (from Firebase) | Required |
| `VITE_ADMIN_UIDS` | (optional) | Comma-separated Firebase UIDs for admin access |
| `VITE_GEMINI_API_KEY` | (optional) | For AI features |
| `POSTMARK_API_KEY` | (optional) | For email; from Postmark |
| `EMAIL_FROM` | (optional) | e.g. `noreply@techephi.com` |

- Set **Environment** to **Production** (and Preview if you want the same vars on preview deployments).
- Click **Save** after each, or add all and save.

### Step 2.3 – Deploy

1. Click **Deploy**.
2. Wait for the build to finish. If it fails, check the build log (often a missing env var or Node version).
3. When it’s done, Vercel gives you a URL like `pm-budgeting-tool-xxx.vercel.app`.

---

## Part 3: Allow your app URL in Firebase Auth (you do this)

So that “Sign in with Google” and email auth work on your live URL:

1. In [Firebase Console](https://console.firebase.google.com) → your project → **Authentication → Settings** (or **Sign-in method**).
2. Under **Authorized domains**, click **Add domain**.
3. Add your Vercel domain, e.g. `pm-budgeting-tool-xxx.vercel.app` (and any custom domain you add later).
4. Save.

---

## You’re done on Vercel

- The app is live at the Vercel URL.
- The `/api/email` route works if you set `POSTMARK_API_KEY` and `EMAIL_FROM`; otherwise welcome/password-reset emails won’t send.

To update the site, push to the connected branch (e.g. `main`); Vercel will redeploy automatically.
