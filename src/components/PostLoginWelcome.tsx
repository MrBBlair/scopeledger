import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { setProfile } from '@/services/firestore'
import { sendWelcomeEmail } from '@/services/email'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Footer } from '@/components/ui/Footer'

const TOTAL_STEPS = 3

interface PostLoginWelcomeProps {
  /** Called when user completes the tour (Go to app). Hides overlay for this session without suppressing future logins. */
  onComplete?: () => void
}

export function PostLoginWelcome({ onComplete }: PostLoginWelcomeProps) {
  const { user, profile, refreshProfile } = useAuth()
  const [step, setStep] = useState(1)
  const [displayName, setDisplayName] = useState(profile?.displayName ?? user?.displayName ?? '')
  const [businessName, setBusinessName] = useState(profile?.businessName ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!user || !profile) return null
  if (profile.welcomeSuppressed) return null

  const progress = (step / TOTAL_STEPS) * 100

  const suppressAndClose = async () => {
    if (!user) return
    setLoading(true)
    try {
      await setProfile(user.uid, { welcomeSuppressed: true })
      await refreshProfile()
    } finally {
      setLoading(false)
    }
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setError('')
    setLoading(true)
    try {
      await setProfile(user.uid, {
        displayName: (displayName.trim() || user.email) ?? 'User',
        businessName: businessName.trim(),
      })
      await refreshProfile()
      if (!profile?.emailOptOut) {
        try {
          await sendWelcomeEmail(user.email ?? '', displayName.trim() || 'User')
        } catch {
          // Non-blocking
        }
      }
      setStep(3)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setLoading(false)
    }
  }

  const handleFinish = async () => {
    if (!user) return
    setLoading(true)
    try {
      await setProfile(user.uid, { onboardingCompleted: true })
      await refreshProfile()
      onComplete?.()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-app">
      <img src="/logo.png" alt="ScopeLedger" className="absolute top-4 left-1/2 -translate-x-1/2 h-[40rem] w-auto z-10" />
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg">
          <div className="mb-6">
            <div
              className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden"
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full bg-brand-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Step {step} of {TOTAL_STEPS}
            </p>
          </div>

          {step === 1 && (
            <div className="text-center">
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 mb-4">
                Welcome to ScopeLedger
              </h1>
              <p className="text-slate-600 mb-8">
                Track project budgets, costs, and change orders. Get insights and forecasts—all in one place.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button size="lg" onClick={() => setStep(2)}>
                  Get Started
                </Button>
                <Button variant="ghost" size="lg" onClick={() => setStep(3)}>
                  Skip to tour
                </Button>
              </div>
              <p className="mt-6">
                <button
                  type="button"
                  onClick={suppressAndClose}
                  disabled={loading}
                  className="text-sm text-slate-500 hover:text-slate-700 underline focus-ring rounded"
                >
                  Don&apos;t show this again
                </button>
              </p>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="font-display text-xl font-semibold text-slate-900 mb-2">Profile basics</h2>
              <p className="text-slate-600 mb-6 text-sm">Just a few details. You can change these later in Settings.</p>
              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-sm" role="alert">
                  {error}
                </div>
              )}
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <Input
                  label="Display name"
                  type="text"
                  autoComplete="name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                />
                <Input
                  label="Business name"
                  type="text"
                  autoComplete="organization"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Your company or organization"
                />
                <div className="flex flex-wrap gap-3">
                  <Button type="submit" loading={loading}>
                    Continue
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setStep(1)}>
                    Previous
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setStep(3)}>
                    Skip
                  </Button>
                </div>
              </form>
              <p className="mt-4">
                <button
                  type="button"
                  onClick={suppressAndClose}
                  disabled={loading}
                  className="text-sm text-slate-500 hover:text-slate-700 underline focus-ring rounded"
                >
                  Don&apos;t show this again
                </button>
              </p>
            </div>
          )}

          {step === 3 && (
            <div className="text-center">
              <h2 className="font-display text-xl font-semibold text-slate-900 mb-4">You&apos;re all set</h2>
              <div className="text-left bg-slate-50 rounded-2xl p-6 mb-8 space-y-4">
                <p className="text-slate-700">
                  <strong>Projects</strong> — Create projects, set baseline budgets, and track overhead.
                </p>
                <p className="text-slate-700">
                  <strong>Costs</strong> — Log costs by category and vendor. Automatic deductions supported.
                </p>
                <p className="text-slate-700">
                  <strong>Change orders</strong> — Add positive or negative changes with approval flow.
                </p>
                <p className="text-slate-700">
                  <strong>Forecasting</strong> — Cost-to-date, burn rate, remaining budget. Insights available in Overview.
                </p>
                <p className="text-slate-700">
                  <strong>User Guide</strong> — Find step-by-step help in Settings.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button size="lg" onClick={handleFinish} loading={loading}>
                  Go to app
                </Button>
                <Button variant="ghost" onClick={() => setStep(2)}>
                  Previous
                </Button>
              </div>
              <p className="mt-6">
                <button
                  type="button"
                  onClick={suppressAndClose}
                  disabled={loading}
                  className="text-sm text-slate-500 hover:text-slate-700 underline focus-ring rounded"
                >
                  Don&apos;t show this again
                </button>
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
