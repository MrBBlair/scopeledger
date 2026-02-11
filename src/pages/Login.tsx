import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'

export function Login() {
  const { signIn, signUp, signInWithGoogle, user } = useAuth()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/app'

  if (user) {
    navigate(from, { replace: true })
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email.trim()) {
      setError('Email is required')
      return
    }
    if (!password) {
      setError('Password is required')
      return
    }
    if (password.length < 6 && mode === 'signup') {
      setError('Password must be at least 6 characters')
      return
    }
    setLoading(true)
    try {
      if (mode === 'signin') await signIn(email.trim(), password)
      else await signUp(email.trim(), password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setError('')
    setLoading(true)
    try {
      await signInWithGoogle()
      navigate(from, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center gap-6 pt-48">
      <img src="/logo.png" alt="ScopeLedger" className="fixed left-1/2 -translate-x-1/2 h-[40rem] w-auto z-10 pointer-events-none top-[calc(1rem-2in)]" />
      <Card className="w-full">
        <CardHeader>
          <h1 className="font-display text-xl font-semibold text-slate-900">
          {mode === 'signin' ? 'Sign in' : 'Create account'}
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          {mode === 'signin'
            ? 'Sign in to access your projects.'
            : 'Create an account to get started.'}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-red-50 text-red-700 text-sm" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
          <Input
            label="Password"
            type="password"
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            hint={mode === 'signup' ? 'At least 6 characters' : undefined}
          />
          {mode === 'signin' && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="rounded border-slate-300"
              />
              <span className="text-sm text-slate-600">Remember me</span>
            </label>
          )}
          <Button type="submit" fullWidth loading={loading}>
            {mode === 'signin' ? 'Sign in' : 'Create account'}
          </Button>
        </form>

        <div className="relative">
          <span className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-slate-200" />
          </span>
          <span className="relative flex justify-center text-sm">
            <span className="bg-white px-2 text-slate-500">or</span>
          </span>
        </div>

        <Button variant="secondary" fullWidth onClick={handleGoogle} disabled={loading}>
          Sign in with Google
        </Button>

        <p className="text-center text-sm text-slate-600">
          {mode === 'signin' ? (
            <>
              Don&apos;t have an account?{' '}
              <button
                type="button"
                className="text-brand-600 hover:underline focus-ring rounded"
                onClick={() => { setMode('signup'); setError(''); }}
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                type="button"
                className="text-brand-600 hover:underline focus-ring rounded"
                onClick={() => { setMode('signin'); setError(''); }}
              >
                Sign in
              </button>
            </>
          )}
        </p>

        <p className="text-center">
          <Link to="/onboarding" className="text-sm text-brand-600 hover:underline focus-ring rounded">
            Go to onboarding
          </Link>
        </p>
      </CardContent>
    </Card>
    </div>
  )
}
