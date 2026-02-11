import { Link } from 'react-router-dom'
import { useProjects } from '@/hooks/useProjects'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { formatCurrency } from '@/utils/format'
import { projectPath } from '@/utils/projectPath'

export function Dashboard() {
  const { projects, pendingInviteProjects, loading, error, acceptProjectInvite, declineProjectInvite } = useProjects()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-brand-500 border-t-transparent" aria-hidden />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl bg-red-50 text-red-700 p-4" role="alert">
        {error}
      </div>
    )
  }

  const active = projects.filter((p) => p.status === 'active')
  const totalBaseline = active.reduce((sum, p) => sum + p.baselineBudget + p.overheadAmount, 0)

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="font-display text-2xl font-bold text-slate-900">Dashboard</h1>
        <Link to="/app/projects/new">
          <Button>New project</Button>
        </Link>
      </div>

      {pendingInviteProjects.length > 0 && (
        <Card className="border-brand-200 bg-brand-50/50">
          <CardHeader>
            <h2 className="font-semibold text-slate-900">Pending requests</h2>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 mb-4">
              You&apos;ve been invited to collaborate. Accept to get access or decline to remove the request.
            </p>
            <ul className="divide-y divide-slate-200/50">
              {pendingInviteProjects.slice(0, 3).map((p) => (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-4 py-3">
                  <span className="font-medium text-slate-900">{p.name}</span>
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" onClick={() => acceptProjectInvite(p.id)}>Accept</Button>
                    <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => declineProjectInvite(p.id)}>Decline</Button>
                  </div>
                </li>
              ))}
            </ul>
            {pendingInviteProjects.length > 3 && (
              <Link to="/app/projects" className="text-sm text-brand-600 hover:underline mt-2 inline-block">
                View all {pendingInviteProjects.length} requests →
              </Link>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardContent className="py-6">
            <p className="text-sm text-slate-600">Active projects</p>
            <p className="text-2xl font-semibold text-slate-900">{active.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-6">
            <p className="text-sm text-slate-600">Total baseline + overhead</p>
            <p className="text-2xl font-semibold text-slate-900">{formatCurrency(totalBaseline)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-6">
            <p className="text-sm text-slate-600">Archived</p>
            <p className="text-2xl font-semibold text-slate-900">{projects.length - active.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-slate-900">Recent projects</h2>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <p className="text-slate-600 py-4">No projects yet. Create one to get started.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {projects.slice(0, 5).map((p) => (
                <li key={p.id}>
                  <Link
                    to={projectPath(p)}
                    className="flex flex-wrap items-center justify-between gap-2 py-4 text-left hover:bg-slate-50 -mx-4 px-4 rounded-lg transition-colors"
                  >
                    <span className="font-medium text-slate-900">{p.name}</span>
                    <span className="text-sm text-slate-600">
                      {formatCurrency(p.baselineBudget + p.overheadAmount)} · {p.status}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
