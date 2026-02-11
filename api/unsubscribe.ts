/**
 * Process unsubscribe request. Verifies token and updates user profile or suppressedEmails.
 * POST /api/unsubscribe
 * Body: { email, token }
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import admin from 'firebase-admin'
import { getFirestore } from './lib/firebase-admin'
import { verifyUnsubscribeToken } from './lib/unsubscribe-token'

function toDocId(email: string): string {
  return email.toLowerCase().trim().replace(/@/g, '_at_').replace(/\./g, '_')
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const { email, token } = (req.body ?? {}) as { email?: string; token?: string }

  if (!email || typeof email !== 'string' || !token || typeof token !== 'string') {
    res.status(400).json({ error: 'Missing email or token' })
    return
  }

  const normalized = email.toLowerCase().trim()
  if (!verifyUnsubscribeToken(normalized, token)) {
    res.status(400).json({ error: 'Invalid token' })
    return
  }

  if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    res.status(500).json({ error: 'Unsubscribe not configured' })
    return
  }

  try {
    const db = getFirestore()

    // Find user by email
    const usersSnap = await db.collection('users').where('email', '==', normalized).limit(1).get()

    if (!usersSnap.empty) {
      const userDoc = usersSnap.docs[0]
      await userDoc.ref.update({
        emailOptOut: true,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      })
    } else {
      // No user account - add to suppressedEmails so we don't send project invites etc
      const docId = toDocId(normalized)
      await db.collection('suppressedEmails').doc(docId).set(
        {
          email: normalized,
          reason: 'ManualSuppression',
          recordType: 'Unsubscribe',
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      )
    }

    res.status(200).json({ ok: true })
  } catch (e) {
    console.error('Unsubscribe error:', e)
    res.status(500).json({ error: 'Failed to process unsubscribe' })
  }
}
