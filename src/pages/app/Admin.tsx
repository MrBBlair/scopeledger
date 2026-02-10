import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'

export function Admin() {
  const { isAdmin } = useAuth()
  const [guideOpen, setGuideOpen] = useState(false)

  if (!isAdmin) {
    return (
      <div className="rounded-xl bg-red-50 text-red-700 p-4" role="alert">
        Admin access only. You do not have permission to view this page.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-slate-900">Admin</h1>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-slate-900">Admin controls</h2>
        </CardHeader>
        <CardContent>
          <p className="text-slate-600 mb-4">
            Admin access is granted via Firebase UID allowlist (<code className="text-sm bg-slate-100 px-1 rounded">VITE_ADMIN_UIDS</code>).
            Only listed users can view this page and the Admin Guide.
          </p>
          <p className="text-slate-600 mb-4">
            Use this area to manage users, permissions, and system-wide settings as you extend the app.
          </p>
          <Button variant="secondary" onClick={() => setGuideOpen(true)}>
            Open Admin Guide
          </Button>
        </CardContent>
      </Card>

      <Modal open={guideOpen} onClose={() => setGuideOpen(false)} title="Admin Guide">
        <div className="prose prose-slate max-w-none text-sm space-y-4">
          <section>
            <h3 className="font-semibold text-slate-900">Admin access</h3>
            <p>
              Admins are identified by Firebase UID. Set <code className="bg-slate-100 px-1 rounded">VITE_ADMIN_UIDS</code> in your
              environment (comma-separated list of UIDs). Only these users can access /app/admin and the Admin Guide.
            </p>
          </section>
          <section>
            <h3 className="font-semibold text-slate-900">Users & permissions</h3>
            <p>
              User data lives in Firestore <code className="bg-slate-100 px-1 rounded">users</code>. Projects, costs, and related
              data are scoped by <code className="bg-slate-100 px-1 rounded">ownerId</code>. Admin capabilities can be extended
              to manage users or override project access as needed.
            </p>
          </section>
          <section>
            <h3 className="font-semibold text-slate-900">Security rules</h3>
            <p>
              Firebase Security Rules enforce ownership. Project subcollections (costs, change orders, forecasts, audit logs)
              are readable/writable only if the user has access to the parent project.
            </p>
          </section>
          <section>
            <h3 className="font-semibold text-slate-900">Email & AI</h3>
            <p>
              Postmark is used for transactional email; configure <code className="bg-slate-100 px-1 rounded">POSTMARK_API_KEY</code> and
              <code className="bg-slate-100 px-1 rounded">EMAIL_FROM</code> in your server environment. AI uses Google Gemini;
              set <code className="bg-slate-100 px-1 rounded">VITE_GEMINI_API_KEY</code> for client-side access.
            </p>
          </section>
        </div>
      </Modal>
    </div>
  )
}
