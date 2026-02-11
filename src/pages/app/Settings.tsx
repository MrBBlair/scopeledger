import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { setProfile } from '@/services/firestore'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'

export function Settings() {
  const { user, profile, refreshProfile } = useAuth()
  const [displayName, setDisplayName] = useState(profile?.displayName ?? '')
  const [businessName, setBusinessName] = useState(profile?.businessName ?? '')
  const [guideOpen, setGuideOpen] = useState(false)

  useEffect(() => {
    setDisplayName(profile?.displayName ?? '')
    setBusinessName(profile?.businessName ?? '')
  }, [profile?.displayName, profile?.businessName])
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [welcomeToggleSaving, setWelcomeToggleSaving] = useState(false)
  const [emailOptOutSaving, setEmailOptOutSaving] = useState(false)

  const showWelcomeOnLogin = !(profile?.welcomeSuppressed ?? false)
  const emailOptOut = profile?.emailOptOut ?? false

  const handleWelcomeToggle = async (show: boolean) => {
    if (!user) return
    setWelcomeToggleSaving(true)
    try {
      await setProfile(user.uid, { welcomeSuppressed: !show })
      await refreshProfile()
    } finally {
      setWelcomeToggleSaving(false)
    }
  }

  const handleEmailOptOutToggle = async (optOut: boolean) => {
    if (!user) return
    setEmailOptOutSaving(true)
    try {
      await setProfile(user.uid, { emailOptOut: optOut })
      await refreshProfile()
    } finally {
      setEmailOptOutSaving(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    setMessage('')
    try {
      await setProfile(user.uid, {
        displayName: (displayName.trim() || user.email) ?? 'User',
        businessName: businessName.trim(),
      })
      await refreshProfile()
      setMessage('Saved.')
    } catch {
      setMessage('Failed to save.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="font-display text-2xl font-bold text-slate-900">Settings</h1>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-slate-900">Profile</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={user?.email ?? ''}
              disabled
            />
            <Input
              label="Display name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
            />
            <Input
              label="Business name"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Your company or organization"
            />
            {message && <p className="text-sm text-slate-600">{message}</p>}
            <Button type="submit" loading={saving}>Save</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-slate-900">Welcome wizard</h2>
        </CardHeader>
        <CardContent>
          <p className="text-slate-600 mb-4">
            Show the welcome wizard (profile and tour) the next time you sign in.
          </p>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={showWelcomeOnLogin}
              onChange={(e) => handleWelcomeToggle(e.target.checked)}
              disabled={welcomeToggleSaving}
              className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            <span className="text-slate-700">Show welcome wizard when I sign in</span>
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-slate-900">Email preferences</h2>
        </CardHeader>
        <CardContent>
          <p className="text-slate-600 mb-4">
            Opt out of non-essential emails (e.g. welcome). Transactional emails such as password reset and project invites will still be sent.
          </p>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={emailOptOut}
              onChange={(e) => handleEmailOptOutToggle(e.target.checked)}
              disabled={emailOptOutSaving}
              className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            <span className="text-slate-700">Opt out of non-essential emails</span>
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-slate-900">Help</h2>
        </CardHeader>
        <CardContent>
          <p className="text-slate-600 mb-4">
            Step-by-step walkthroughs and tips for using ScopeLedger.
          </p>
          <Button variant="secondary" onClick={() => setGuideOpen(true)}>
            Open User Guide
          </Button>
        </CardContent>
      </Card>

      <Modal open={guideOpen} onClose={() => setGuideOpen(false)} title="User Guide">
        <div className="prose prose-slate max-w-none text-sm space-y-4">
          <section>
            <h3 className="font-semibold text-slate-900">Projects</h3>
            <p>Create projects from the Dashboard or Projects page. Set a baseline budget, optional overhead %, and dates. The baseline can be locked after creation.</p>
          </section>
          <section>
            <h3 className="font-semibold text-slate-900">Costs</h3>
            <p>Inside a project, open the Costs tab to add expenses. Use category and vendor for tracking. Deduction type can be manual or automatic.</p>
          </section>
          <section>
            <h3 className="font-semibold text-slate-900">Change orders</h3>
            <p>Add positive or negative change orders to adjust budget. Approve or reject pending items; approved amounts update the total budget.</p>
          </section>
          <section>
            <h3 className="font-semibold text-slate-900">Forecasting</h3>
            <p>View cost-to-date, burn rate, and remaining budget in the Forecast tab. Use &quot;Share forecast&quot; to share the forecast via email. Project insights based on costs and burn rate are shown in the Overview tab.</p>
          </section>
          <section>
            <h3 className="font-semibold text-slate-900">Audit log</h3>
            <p>All cost and change-order actions are logged. Export logs as CSV from the Logs tab.</p>
          </section>
        </div>
      </Modal>
    </div>
  )
}
