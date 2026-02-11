/**
 * Vercel serverless function: send transactional email via Postmark.
 * POST /api/email
 * Body: { type: 'welcome' | 'password_reset' | 'notification', to, ... }
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getFirestore } from './lib/firebase-admin'
import { generateUnsubscribeToken } from './lib/unsubscribe-token'

const POSTMARK_API = process.env.POSTMARK_API_KEY ?? ''
const FROM = process.env.EMAIL_FROM ?? 'noreply@techephi.com'

async function postmarkSend(payload: {
  From: string
  To: string
  Subject: string
  HtmlBody: string
  Tag?: string
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

  const { type, to, name, resetLink, subject, body, tag, appUrl } = (req.body ?? {}) as {
    type?: string
    to?: string
    name?: string
    resetLink?: string
    subject?: string
    body?: string
    tag?: string
    appUrl?: string
  }

  function appendUnsubscribeLink(html: string, email: string): string {
    if (!appUrl || typeof appUrl !== 'string') return html
    const token = generateUnsubscribeToken(email)
    if (!token) return html
    const url = `${appUrl.replace(/\/$/, '')}/unsubscribe?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`
    return `${html}<p style="font-size:12px;color:#64748b;"><a href="${url}">Unsubscribe from non-essential emails</a></p>`
  }

  const emailTag = tag ?? type ?? 'notification'

  if (!to || typeof to !== 'string') {
    res.status(400).json({ error: 'Missing or invalid "to" email' })
    return
  }

  if (!POSTMARK_API) {
    console.warn('POSTMARK_API_KEY not set; skipping send.')
    res.status(200).json({ ok: true, skipped: true })
    return
  }

  // Check suppressedEmails (bounces/spam) if Firebase Admin is configured
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const db = getFirestore()
      const docId = to.toLowerCase().trim().replace(/@/g, '_at_').replace(/\./g, '_')
      const snap = await db.collection('suppressedEmails').doc(docId).get()
      if (snap.exists) {
        res.status(200).json({ ok: true, skipped: true })
        return
      }
    } catch (e) {
      console.warn('Suppression check failed, proceeding with send:', e)
    }
  }

  try {
    switch (type) {
      case 'welcome': {
        const welcomeBody = `
            <h1>Welcome, ${name || 'there'}!</h1>
            <p>Thanks for signing up for ScopeLedger. You can start creating projects and tracking costs right away.</p>
            <p>— The Techephi Team</p>
          `
        await postmarkSend({
          From: FROM,
          To: to,
          Subject: 'Welcome to ScopeLedger',
          Tag: emailTag,
          HtmlBody: appendUnsubscribeLink(welcomeBody, to),
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
          Tag: emailTag,
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
          Tag: emailTag,
          HtmlBody: appendUnsubscribeLink(body, to),
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
