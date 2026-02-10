import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useOnboarding } from '@/context/OnboardingContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export function OnboardingLogin() {
  const { signIn, signUp, signInWithGoogle, user } = useAuth()
  const { next, prev, skip, progress, totalSteps } = useOnboarding()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (user) {
    next()
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email.trim() || !password) {
      setError('Email and password are required')
      return
    }
    if (mode === 'signup' && password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    setLoading(true)
    try {
      if (mode === 'signin') await signIn(email.trim(), password)
      else await signUp(email.trim(), password)
      next()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setError('')
    setLoading(true)
    try {
      await signInWithGoogle()
      next()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-6">
        <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full bg-brand-500 transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-xs text-slate-500 mt-1">Step 2 of {totalSteps}</p>
      </div>

      <h2 className="font-display text-xl font-semibold text-slate-900 mb-2">
        {mode === 'signin' ? 'Sign in' : 'Create account'}
      </h2>
      <p className="text-slate-600 mb-6 text-sm">
        Use email or Google to continue. Autofill-friendly.
      </p>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-sm" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 mb-4">
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
        <Button type="submit" fullWidth loading={loading}>
          {mode === 'signin' ? 'Sign in' : 'Create account'}
        </Button>
      </form>

      <div className="relative my-4">
        <span className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-slate-200" />
        </span>
        <span className="relative flex justify-center text-sm">
          <span className="bg-transparent px-2 text-slate-500">or</span>
        </span>
      </div>

      <Button variant="secondary" fullWidth onClick={handleGoogle} disabled={loading}>
        Sign in with Google
      </Button>

      <p className="text-center text-sm text-slate-600 mt-4">
        {mode === 'signin' ? (
          <>
            No account?{' '}
            <button type="button" className="text-brand-600 hover:underline focus-ring rounded" onClick={() => { setMode('signup'); setError(''); }}>
              Sign up
            </button>
          </>
        ) : (
          <>
            Have an account?{' '}
            <button type="button" className="text-brand-600 hover:underline focus-ring rounded" onClick={() => { setMode('signin'); setError(''); }}>
              Sign in
            </button>
          </>
        )}
      </p>

      <div className="flex justify-between mt-8">
        <Button variant="ghost" onClick={prev}>Previous</Button>
        <Button variant="ghost" onClick={skip}>Skip</Button>
      </div>
    </div>
  )
}
