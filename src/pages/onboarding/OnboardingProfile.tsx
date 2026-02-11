import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useOnboarding } from '@/context/OnboardingContext'
import { setProfile } from '@/services/firestore'
import { sendWelcomeEmail } from '@/services/email'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export function OnboardingProfile() {
  const { user, profile, refreshProfile } = useAuth()
  const { next, prev, skip, progress, totalSteps } = useOnboarding()
  const [displayName, setDisplayName] = useState(profile?.displayName ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (profile?.displayName) setDisplayName(profile.displayName)
    else if (user?.displayName) setDisplayName(user.displayName)
  }, [profile?.displayName, user?.displayName])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setError('')
    setLoading(true)
    try {
      await setProfile(user.uid, { displayName: (displayName.trim() || user.email) ?? 'User' })
      await refreshProfile()
      if (!profile?.emailOptOut) {
        try {
          await sendWelcomeEmail(user.email ?? '', displayName.trim() || 'User')
        } catch {
          // Non-blocking
        }
      }
      next()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
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
        <p className="text-xs text-slate-500 mt-1">Step 3 of {totalSteps}</p>
      </div>

      <h2 className="font-display text-xl font-semibold text-slate-900 mb-2">Profile basics</h2>
      <p className="text-slate-600 mb-6 text-sm">Just a few details. You can change these later.</p>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-sm" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Username / Display name"
          type="text"
          autoComplete="name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Your name"
        />
        <div className="flex gap-3">
          <Button type="submit" loading={loading}>Continue</Button>
          <Button type="button" variant="ghost" onClick={prev}>Previous</Button>
        </div>
      </form>

      <div className="mt-6">
        <Button variant="ghost" onClick={skip}>Skip</Button>
      </div>
    </div>
  )
}
