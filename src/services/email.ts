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
  const appUrl = typeof window !== 'undefined' ? window.location.origin : ''
  await callEmailAPI({ type: 'welcome', to, name, tag: 'welcome', appUrl })
}

export async function sendPasswordResetEmail(to: string, resetLink: string): Promise<void> {
  await callEmailAPI({ type: 'password_reset', to, resetLink, tag: 'password_reset' })
}

export async function sendNotificationEmail(
  to: string,
  subject: string,
  body: string
): Promise<void> {
  const appUrl = typeof window !== 'undefined' ? window.location.origin : ''
  await callEmailAPI({ type: 'notification', to, subject, body, tag: 'notification', appUrl })
}

export async function sendProjectInviteEmail(
  to: string,
  projectName: string,
  appUrl: string
): Promise<void> {
  const subject = `You've been invited to ${projectName}`
  const body = `
    <p>You've been invited to collaborate on <strong>${projectName}</strong> in ScopeLedger.</p>
    <p><a href="${appUrl}/app/projects">View your projects</a> to accept or decline the request.</p>
    <p>If you don't already have an account, please create one using the same email address this invite was sent to. You can update your email later in Settings.</p>
    <p>— ScopeLedger</p>
  `
  await callEmailAPI({ type: 'notification', to, subject, body, tag: 'project_invite', appUrl })
}
