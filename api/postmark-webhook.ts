/**
 * Postmark webhook: handles Bounce and SpamComplaint events.
 * Configure in Postmark: Server → Message Stream → Webhooks → Add webhook (Bounce, Spam complaint).
 * URL: https://your-domain.vercel.app/api/postmark-webhook
 * Optional: append ?secret=YOUR_SECRET and set POSTMARK_WEBHOOK_SECRET in Vercel.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getFirestore } from './lib/firebase-admin'

const SUPPRESSED_COLLECTION = 'suppressedEmails'

function toDocId(email: string): string {
  return email.toLowerCase().trim().replace(/@/g, '_at_').replace(/\./g, '_')
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const webhookSecret = process.env.POSTMARK_WEBHOOK_SECRET
  const reqSecret = typeof req.query?.secret === 'string' ? req.query.secret : null
  if (webhookSecret && reqSecret !== webhookSecret) {
    res.status(401).json({ error: 'Invalid webhook secret' })
    return
  }

  const recordType = (req.body as { RecordType?: string })?.RecordType
  const email = (req.body as { Email?: string })?.Email

  if (!recordType || !email || typeof email !== 'string') {
    res.status(400).json({ error: 'Missing RecordType or Email' })
    return
  }

  if (recordType !== 'Bounce' && recordType !== 'SpamComplaint') {
    res.status(200).json({ ok: true, skipped: true })
    return
  }

  try {
    const db = getFirestore()
    const reason = recordType === 'Bounce' ? (req.body as { Type?: string }).Type ?? 'Bounce' : 'SpamComplaint'
    const bouncedAt = (req.body as { BouncedAt?: string }).BouncedAt ?? new Date().toISOString()

    const docId = toDocId(email)
    await db.collection(SUPPRESSED_COLLECTION).doc(docId).set(
      {
        email: email.toLowerCase().trim(),
        reason,
        recordType,
        bouncedAt,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    )

    res.status(200).json({ ok: true })
  } catch (e) {
    console.error('Postmark webhook error:', e)
    res.status(500).json({ error: 'Webhook processing failed' })
  }
}
