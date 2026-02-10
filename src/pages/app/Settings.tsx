import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { setProfile } from '@/services/firestore'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'

export function Settings() {
  const { user, profile, refreshProfile } = useAuth()
  const [displayName, setDisplayName] = useState(profile?.displayName ?? '')
  const [guideOpen, setGuideOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    setMessage('')
    try {
      await setProfile(user.uid, { displayName: (displayName.trim() || user.email) ?? 'User' })
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
            {message && <p className="text-sm text-slate-600">{message}</p>}
            <Button type="submit" loading={saving}>Save</Button>
          </form>
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
            <p>View cost-to-date, burn rate, and remaining budget in the Forecast tab. Use &quot;Save forecast&quot; to store versioned snapshots. AI insights are available from the Overview tab.</p>
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
