# Email setup (Postmark)

ScopeLedger sends transactional email via **Postmark** through a Vercel serverless function. This covers welcome emails, password resets, and notifications.

---

## Part 1: Create a Postmark account

1. Go to [Postmark](https://postmarkapp.com) and sign up (free tier: 100 emails/month).
2. Sign in to the Postmark dashboard.

---

## Part 2: Create a server and get the API key

1. In Postmark, click **Servers** → **Add Server**.
2. Name it (e.g. `ScopeLedger`).
3. After creation, open the server → **API Tokens**.
4. Copy the **Server API token** (starts with a long string). You’ll use this as `POSTMARK_API_KEY`.

---

## Part 3: Add a sender signature (verify your domain)

Postmark must verify the domain or email you send from.

1. In your server, go to **Sender Signatures**.
2. Click **Add Sender Signature**.
3. Choose **Domain** or **Single email**:
   - **Domain** (recommended): e.g. `techephi.com` – lets you use `noreply@techephi.com`, `support@techephi.com`, etc.
   - **Single email**: e.g. `noreply@techephi.com` – you’ll verify that one address.
4. Follow the verification steps (add a DNS record or click the verification link for single email).
5. Wait until the status shows **Verified**.

---

## Part 4: Configure environment variables

### For Vercel (production)

1. In [Vercel](https://vercel.com) → your project → **Settings** → **Environment Variables**.
2. Add:

| Name | Value | Environment |
|------|--------|--------------|
| `POSTMARK_API_KEY` | Your Postmark Server API token | Production (and Preview if desired) |
| `EMAIL_FROM` | e.g. `noreply@techephi.com` | Production (and Preview if desired) |

- `EMAIL_FROM` must match a verified sender. If omitted, it defaults to `noreply@techephi.com`.
3. Redeploy the project so the new variables take effect.

### For local development

1. Add to `.env.local`:

```
POSTMARK_API_KEY=your-postmark-server-api-token
EMAIL_FROM=noreply@yourdomain.com
```

2. Run the app with `vercel dev` so the API route uses these env vars:

```bash
vercel dev
```

(If you use `npm run dev` instead, the `/api/email` route won’t run; the app will still work, but emails will be skipped.)

---

## Part 5: Verify it works

1. Sign up a new user or complete onboarding (triggers a welcome email).
2. Check Postmark → **Activity** → **Message stream** for sent emails.
3. Confirm the message appears in the recipient inbox.

---

## Email types supported

| Type | Usage |
|------|-------|
| `welcome` | Sent after signup/welcome flow |
| `password_reset` | For Firebase password reset links |
| `notification` | Generic notifications (subject + body) |

If `POSTMARK_API_KEY` is not set, the API returns success but skips sending (no error).

---

## Bounce webhook (optional)

To record bounces and spam complaints in Firestore:

1. In Postmark → Server → Message Stream (outbound) → Webhooks → Add webhook.
2. Set URL to `https://your-domain.vercel.app/api/postmark-webhook` (append `?secret=YOUR_SECRET` if using `POSTMARK_WEBHOOK_SECRET`).
3. Enable **Bounce** and **Spam complaint** checkboxes.
4. In Vercel, add:
   - `FIREBASE_SERVICE_ACCOUNT` – Firebase service account JSON (string). Create in Firebase Console → Project settings → Service accounts → Generate new private key.
   - `POSTMARK_WEBHOOK_SECRET` – (optional) Secret to validate webhook requests. If set, add `?secret=YOUR_SECRET` to the webhook URL.
5. Redeploy.

Bounced addresses are stored in `suppressedEmails`; the email API skips sending to them.

---

## Unsubscribe links

Welcome and notification emails include an unsubscribe link when `UNSUBSCRIBE_SECRET` is set.

1. In Vercel, add `UNSUBSCRIBE_SECRET` (any random string, e.g. from `openssl rand -hex 32`).
2. Redeploy. The API will append an unsubscribe link to welcome and notification emails.
3. Users who click the link are taken to `/unsubscribe?email=...&token=...`, which:
   - If they have an account: sets `emailOptOut: true` on their profile.
   - If they don't: adds their email to `suppressedEmails` (no project invites etc).

---

## Troubleshooting

- **Emails not sending**: Check Postmark Activity for bounces or errors.
- **403 / Unauthorized**: Verify `POSTMARK_API_KEY` is correct and set in Vercel.
- **Sender not verified**: `EMAIL_FROM` must match a verified sender signature.
- **Local dev**: Use `vercel dev` so `/api/email` runs; plain `npm run dev` does not execute serverless functions.
