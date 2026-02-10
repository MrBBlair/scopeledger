/**
 * Client-side email service. Calls Vercel /api/email serverless function,
 * which sends via Postmark. API key stays server-side.
 */

const API = import.meta.env.VITE_API_BASE ?? ''

async function callEmailAPI(payload: Record<string, unknown>): Promise<void> {
  const base = API || (typeof window !== 'undefined' ? window.location.origin : '')
  const res = await fetch(`${base}/api/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const j = await res.json().catch(() => ({}))
    throw new Error((j as { error?: string }).error ?? `Email API ${res.status}`)
  }
}

export async function sendWelcomeEmail(to: string, name: string): Promise<void> {
  await callEmailAPI({ type: 'welcome', to, name })
}

export async function sendPasswordResetEmail(to: string, resetLink: string): Promise<void> {
  await callEmailAPI({ type: 'password_reset', to, resetLink })
}

export async function sendNotificationEmail(
  to: string,
  subject: string,
  body: string
): Promise<void> {
  await callEmailAPI({ type: 'notification', to, subject, body })
}
