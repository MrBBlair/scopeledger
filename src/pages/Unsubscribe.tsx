import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'

export function Unsubscribe() {
  const [searchParams] = useSearchParams()
  const email = searchParams.get('email') ?? ''
  const token = searchParams.get('token') ?? ''
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!email || !token) {
      setStatus('error')
      setError('Invalid link. Missing email or token.')
      return
    }

    setStatus('loading')
    const base = typeof window !== 'undefined' ? window.location.origin : ''
    fetch(`${base}/api/unsubscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, token }),
    })
      .then(async (res) => {
        const j = await res.json().catch(() => ({}))
        if (res.ok) {
          setStatus('success')
        } else {
          setStatus('error')
          setError((j as { error?: string }).error ?? 'Failed to unsubscribe')
        }
      })
      .catch(() => {
        setStatus('error')
        setError('Network error')
      })
  }, [email, token])

  return (
    <div className="min-h-screen flex flex-col bg-app items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <h1 className="font-display text-2xl font-bold text-slate-900 mb-4">
          Unsubscribe
        </h1>
        {status === 'loading' && (
          <p className="text-slate-600">Processing your request…</p>
        )}
        {status === 'success' && (
          <>
            <p className="text-slate-600 mb-6">
              You have been unsubscribed from non-essential emails. You may still receive transactional emails such as password resets and project invites.
            </p>
            <Link
              to="/"
              className="text-brand-600 hover:underline focus-ring rounded"
            >
              Return to ScopeLedger
            </Link>
          </>
        )}
        {status === 'error' && (
          <>
            <p className="text-red-600 mb-6">{error}</p>
            <Link
              to="/"
              className="text-brand-600 hover:underline focus-ring rounded"
            >
              Return to ScopeLedger
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
