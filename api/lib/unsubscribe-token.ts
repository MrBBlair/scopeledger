import { createHmac } from 'crypto'

const SECRET = process.env.UNSUBSCRIBE_SECRET ?? ''

export function generateUnsubscribeToken(email: string): string {
  if (!SECRET) return ''
  const payload = email.toLowerCase().trim()
  const hmac = createHmac('sha256', SECRET).update(payload).digest('base64')
  return hmac.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function verifyUnsubscribeToken(email: string, token: string): boolean {
  if (!SECRET || !token) return false
  const expected = generateUnsubscribeToken(email)
  return expected !== '' && token === expected
}
