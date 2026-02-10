/**
 * Vercel serverless function: send transactional email via Postmark.
 * POST /api/email
 * Body: { type: 'welcome' | 'password_reset' | 'notification', to, ... }
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'

const POSTMARK_API = process.env.POSTMARK_API_KEY ?? ''
const FROM = process.env.EMAIL_FROM ?? 'noreply@techephi.com'

async function postmarkSend(payload: {
  From: string
  To: string
  Subject: string
  HtmlBody: string
}) {
  const res = await fetch('https://api.postmarkapp.com/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Postmark-Server-Token': POSTMARK_API,
    },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const t = await res.text()
    throw new Error(`Postmark error ${res.status}: ${t}`)
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const { type, to, name, resetLink, subject, body } = (req.body ?? {}) as {
    type?: string
    to?: string
    name?: string
    resetLink?: string
    subject?: string
    body?: string
  }

  if (!to || typeof to !== 'string') {
    res.status(400).json({ error: 'Missing or invalid "to" email' })
    return
  }

  if (!POSTMARK_API) {
    console.warn('POSTMARK_API_KEY not set; skipping send.')
    res.status(200).json({ ok: true, skipped: true })
    return
  }

  try {
    switch (type) {
      case 'welcome': {
        await postmarkSend({
          From: FROM,
          To: to,
          Subject: 'Welcome to ScopeLedger',
          HtmlBody: `
            <h1>Welcome, ${name || 'there'}!</h1>
            <p>Thanks for signing up for ScopeLedger. You can start creating projects and tracking costs right away.</p>
            <p>— The Techephi Team</p>
          `,
        })
        break
      }
      case 'password_reset': {
        if (!resetLink) {
          res.status(400).json({ error: 'Missing "resetLink" for password_reset' })
          return
        }
        await postmarkSend({
          From: FROM,
          To: to,
          Subject: 'Reset your password – ScopeLedger',
          HtmlBody: `
            <h1>Password reset</h1>
            <p>We received a request to reset your password. <a href="${resetLink}">Click here</a> to continue.</p>
            <p>If you didn't request this, you can ignore this email.</p>
            <p>— The Techephi Team</p>
          `,
        })
        break
      }
      case 'notification': {
        if (!subject || !body) {
          res.status(400).json({ error: 'Missing "subject" or "body" for notification' })
          return
        }
        await postmarkSend({
          From: FROM,
          To: to,
          Subject: `ScopeLedger: ${subject}`,
          HtmlBody: body,
        })
        break
      }
      default:
        res.status(400).json({ error: 'Invalid "type". Use welcome | password_reset | notification' })
        return
    }
    res.status(200).json({ ok: true })
  } catch (e) {
    console.error('Email send error:', e)
    res.status(500).json({ error: 'Failed to send email' })
  }
}
