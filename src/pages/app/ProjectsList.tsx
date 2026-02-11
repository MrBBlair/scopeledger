import { Link } from 'react-router-dom'
import { useProjects } from '@/hooks/useProjects'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { formatCurrency, formatDate } from '@/utils/format'
import { projectPath } from '@/utils/projectPath'

export function ProjectsList() {
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="font-display text-2xl font-bold text-slate-900">Projects</h1>
        <Link to="/app/projects/new">
          <Button>New project</Button>
        </Link>
      </div>

      {pendingInviteProjects.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-slate-900">Pending requests</h2>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 mb-4">
              You&apos;ve been invited to collaborate on these projects. Accept to get access or decline to remove the request.
            </p>
            <ul className="divide-y divide-slate-100">
              {pendingInviteProjects.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
                  <div>
                    <span className="font-medium text-slate-900 block">{p.name}</span>
                    <span className="text-sm text-slate-500">
                      {formatDate(p.startDate)}
                      {p.endDate ? ` – ${formatDate(p.endDate)}` : ''}
                    </span>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" onClick={() => acceptProjectInvite(p.id)}>
                      Accept
                    </Button>
                    <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => declineProjectInvite(p.id)}>
                      Decline
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-slate-900">All projects</h2>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <p className="text-slate-600 py-8 text-center">No projects yet. Create one to get started.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {projects.map((p) => (
                <li key={p.id}>
                  <Link
                    to={projectPath(p)}
                    className="flex flex-wrap items-center justify-between gap-4 py-4 text-left hover:bg-slate-50 -mx-4 px-4 rounded-lg transition-colors"
                  >
                    <div>
                      <span className="font-medium text-slate-900 block">{p.name}</span>
                      <span className="text-sm text-slate-500">
                        {formatDate(p.startDate)}
                        {p.endDate ? ` – ${formatDate(p.endDate)}` : ''} · {p.status}
                      </span>
                    </div>
                    <span className="text-slate-700 font-medium">
                      {formatCurrency(p.baselineBudget + p.overheadAmount)}
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
