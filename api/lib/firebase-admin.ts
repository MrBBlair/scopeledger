/**
 * Firebase Admin SDK for serverless functions (webhooks, email API).
 * Requires FIREBASE_SERVICE_ACCOUNT env var with service account JSON string.
 */

import admin from 'firebase-admin'

let app: admin.app.App | null = null

export function getFirestore(): admin.firestore.Firestore {
  if (!app) {
    const sa = process.env.FIREBASE_SERVICE_ACCOUNT
    if (!sa) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT env var is required for server-side Firestore')
    }
    try {
      const cred = JSON.parse(sa)
      app = admin.initializeApp({ credential: admin.credential.cert(cred) })
    } catch (e) {
      throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT JSON')
    }
  }
  return app.firestore()
}
