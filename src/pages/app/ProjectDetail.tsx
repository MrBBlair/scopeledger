import { useState, useMemo, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useProjectDetail } from '@/hooks/useProjectDetail'
import { useProjects } from '@/hooks/useProjects'
import { getProjectInsight } from '@/utils/projectInsight'
import {
  addCollaborator,
  removeCollaborator,
  removePendingInvite,
  getProfile,
} from '@/services/firestore'
import { sendProjectInviteEmail } from '@/services/email'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { formatCurrency, formatDate, formatDateTimeLocal } from '@/utils/format'
import { parseProjectSlug, isLegacyProjectId, resolveSlugToProjectId, projectPath, projectEditPath } from '@/utils/projectPath'
import { cn } from '@/utils/cn'

type Tab = 'overview' | 'costs' | 'change-orders' | 'forecast' | 'logs' | 'share'

const ACTION_LABELS: Record<string, string> = {
  cost_added: 'Cost added',
  cost_edited: 'Cost edited',
  cost_deleted: 'Cost deleted',
  change_order_added: 'Change order added',
  change_order_approved: 'Change order approved',
  change_order_rejected: 'Change order rejected',
  forecast_updated: 'Forecast updated',
  project_created: 'Project created',
  project_updated: 'Project updated',
  project_archived: 'Project archived',
}

function formatActionLabel(action: string, projectName?: string, metadata?: Record<string, unknown>): string {
  const base = ACTION_LABELS[action] ?? action.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  const name = (metadata?.projectName as string) ?? projectName
  if (name && ['project_created', 'project_updated', 'project_archived'].includes(action)) {
    return `${base}: ${name}`
  }
  return base
}

const tabs: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'costs', label: 'Costs' },
  { id: 'change-orders', label: 'Change orders' },
  { id: 'forecast', label: 'Forecast' },
  { id: 'logs', label: 'Logs' },
  { id: 'share', label: 'Share' },
]

export function ProjectDetail() {
  const { slug } = useParams<{ slug: string }>()
  const { projects, remove } = useProjects()
  const rawId = slug
    ? parseProjectSlug(slug) ?? (isLegacyProjectId(slug) ? slug : resolveSlugToProjectId(slug, projects))
    : undefined
  const id = rawId ?? undefined
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const detail = useProjectDetail(id)
  const [tab, setTab] = useState<Tab>('overview')
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [costModal, setCostModal] = useState(false)
  const [changeOrderModal, setChangeOrderModal] = useState(false)
  const [costForm, setCostForm] = useState({
    amount: '',
    category: '',
    vendor: '',
    description: '',
    date: new Date().toISOString().slice(0, 10),
    deductionType: 'manual' as 'manual' | 'automatic',
  })
  const [coForm, setCoForm] = useState({
    type: 'positive' as 'positive' | 'negative',
    amount: '',
    description: '',
  })
  const [shareEmail, setShareEmail] = useState('')
  const [shareLoading, setShareLoading] = useState(false)
  const [collaboratorNames, setCollaboratorNames] = useState<Record<string, string>>({})
  const [logUserNames, setLogUserNames] = useState<Record<string, string>>({})

  const {
    project,
    costs,
    changeOrders,
    logs,
    loading,
    error,
    pendingInvite,
    handleAcceptInvite,
    handleDeclineInvite,
    refresh,
    costToDate,
    totalBudget,
    remainingBudget,
    createCost,
    removeCost,
    createChangeOrder,
    approveChangeOrder,
    rejectChangeOrder: rejectCO,
    saveForecast,
    latestForecast,
  } = detail

  const burnRate = useMemo(() => {
    if (costs.length < 2) return 0
    const sorted = [...costs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    const first = new Date(sorted[0]!.date).getTime()
    const last = new Date(sorted[sorted.length - 1]!.date).getTime()
    const days = (last - first) / (24 * 60 * 60 * 1000) || 1
    return costToDate / days
  }, [costs, costToDate])

  const completionForecast = useMemo(() => {
    const endDate = project?.endDate
    if (!endDate) return null
    const end = new Date(endDate)
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    end.setHours(0, 0, 0, 0)
    const daysUntilEnd = Math.ceil((end.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
    if (daysUntilEnd <= 0) return { completed: true, endDate }
    const projectedCostAtCompletion = costToDate + burnRate * daysUntilEnd
    const projectedRemaining = totalBudget - projectedCostAtCompletion
    return {
      completed: false,
      endDate,
      daysUntilEnd,
      projectedCostAtCompletion,
      projectedRemaining,
    }
  }, [project?.endDate, costToDate, burnRate, totalBudget])

  const handleAddCost = async (e: React.FormEvent) => {
    e.preventDefault()
    const amount = Number(costForm.amount)
    if (!costForm.category.trim() || isNaN(amount) || amount <= 0) return
    await createCost({
      amount,
      category: costForm.category.trim(),
      vendor: costForm.vendor.trim(),
      description: costForm.description.trim(),
      date: costForm.date,
      deductionType: costForm.deductionType,
    })
    setCostModal(false)
    setCostForm({
      amount: '',
      category: '',
      vendor: '',
      description: '',
      date: new Date().toISOString().slice(0, 10),
      deductionType: 'manual',
    })
  }

  const handleAddChangeOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    const amount = Number(coForm.amount)
    if (!coForm.description.trim() || isNaN(amount) || amount <= 0) return
    await createChangeOrder({
      type: coForm.type,
      amount,
      description: coForm.description.trim(),
      status: 'pending',
    })
    setChangeOrderModal(false)
    setCoForm({ type: 'positive', amount: '', description: '' })
  }

  const projectInsight = useMemo(
    () => getProjectInsight(costToDate, totalBudget, remainingBudget, burnRate, costs.length),
    [costToDate, totalBudget, remainingBudget, burnRate, costs.length]
  )

  const isOwner = project && user?.uid === project.ownerId

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id || !shareEmail.trim() || !project) return
    setShareLoading(true)
    try {
      await addCollaborator(id, shareEmail.trim())
      try {
        const appUrl = typeof window !== 'undefined' ? window.location.origin : ''
        await sendProjectInviteEmail(shareEmail.trim(), project.name, appUrl)
      } catch {
        // Non-blocking
      }
      setShareEmail('')
      await refresh()
    } finally {
      setShareLoading(false)
    }
  }

  const handleRemoveCollaborator = async (uid: string) => {
    if (!id) return
    await removeCollaborator(id, uid)
    await refresh()
  }

  const handleRevokeInvite = async (email: string) => {
    if (!id) return
    await removePendingInvite(id, email)
    await refresh()
  }

  const handleDeleteProject = async () => {
    if (!id) return
    setDeleteLoading(true)
    try {
      await remove(id)
      setDeleteConfirmOpen(false)
      navigate('/app/projects')
    } finally {
      setDeleteLoading(false)
    }
  }

  useEffect(() => {
    if (project && id) {
      const prettyPath = projectPath(project)
      if (window.location.pathname !== prettyPath) {
        navigate(prettyPath, { replace: true })
      }
    }
  }, [project, id, navigate])

  useEffect(() => {
    if (tab !== 'share' || !project?.collaboratorIds?.length) return
    const load = async () => {
      const names: Record<string, string> = {}
      for (const uid of project.collaboratorIds ?? []) {
        try {
          const p = await getProfile(uid)
          if (p) names[uid] = p.displayName || p.email || 'Collaborator'
          else names[uid] = 'Collaborator'
        } catch {
          names[uid] = 'Collaborator'
        }
      }
      setCollaboratorNames(names)
    }
    load()
  }, [tab, project?.collaboratorIds])

  useEffect(() => {
    if (tab !== 'logs' || logs.length === 0) return
    const uids = [...new Set(logs.map((l) => l.userId))]
    const load = async () => {
      const names: Record<string, string> = {}
      for (const uid of uids) {
        try {
          const p = await getProfile(uid)
          if (p) names[uid] = p.displayName || p.email || 'User'
          else names[uid] = 'User'
        } catch {
          names[uid] = 'User'
        }
      }
      setLogUserNames(names)
    }
    load()
  }, [tab, logs])

  const handleSaveForecast = async () => {
    const version = (latestForecast?.version ?? 0) + 1
    await saveForecast({
      version,
      costToDate,
      burnRate,
      remainingBudget,
      projectedTotal: costToDate + remainingBudget,
      manualOverride: null,
      aiSummary: projectInsight,
    })
  }

  const exportLogsCsv = () => {
    const headers = ['Date', 'Action', 'User']
    const rows = logs.map((l) => [
      formatDateTimeLocal(l.createdAt),
      formatActionLabel(l.action, project?.name, l.metadata),
      logUserNames[l.userId] ?? l.userId,
    ])
    const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    const safeName = (project?.name ?? 'project').replace(/[^a-zA-Z0-9\u00C0-\u024F\s-]/g, '').replace(/\s+/g, '-') || 'project'
    a.download = `${safeName}-logs.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  if (loading || !project) {
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
      {pendingInvite && project && (
        <div className="rounded-xl bg-brand-50 border border-brand-200 p-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-brand-800 font-medium">
            You&apos;ve been invited to collaborate on this project.
          </p>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAcceptInvite}>
              Accept
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                await handleDeclineInvite()
                navigate('/app/projects')
              }}
            >
              Decline
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link to="/app/projects" className="text-sm text-brand-600 hover:underline mb-1 inline-block">
            ← Projects
          </Link>
          <h1 className="font-display text-2xl font-bold text-slate-900">{project.name}</h1>
          <p className="text-slate-600 text-sm">{project.description || 'No description'}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link to={project ? projectEditPath(project) : `/app/projects/${id}/edit`}>
            <Button variant="secondary">Edit project</Button>
          </Link>
          {isOwner && (
            <Button
              variant="danger"
              onClick={() => setDeleteConfirmOpen(true)}
            >
              Delete project
            </Button>
          )}
        </div>
      </div>

      {!pendingInvite && (
      <div className="flex gap-2 overflow-x-auto pb-2" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors min-h-0',
              tab === t.id ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            )}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      )}

      {tab === 'overview' && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="py-4">
                <p className="text-sm text-slate-600">Total budget</p>
                <p className="text-xl font-semibold text-slate-900">{formatCurrency(totalBudget)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4">
                <p className="text-sm text-slate-600">Cost to date</p>
                <p className="text-xl font-semibold text-slate-900">{formatCurrency(costToDate)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4">
                <p className="text-sm text-slate-600">Remaining</p>
                <p className="text-xl font-semibold text-slate-900">{formatCurrency(remainingBudget)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4">
                <p className="text-sm text-slate-600">Burn rate (est.)</p>
                <p className="text-xl font-semibold text-slate-900">{formatCurrency(burnRate)}/day</p>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-slate-900">Project insight</h2>
            </CardHeader>
            <CardContent>
              <p className="text-slate-700">{projectInsight}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {tab === 'costs' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <h2 className="font-semibold text-slate-900">Costs</h2>
            <Button onClick={() => setCostModal(true)}>Add cost</Button>
          </CardHeader>
          <CardContent>
            {costs.length === 0 ? (
              <p className="text-slate-600 py-4">No costs yet.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {costs.map((c) => (
                  <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                    <div>
                      <span className="font-medium text-slate-900">{c.category}</span>
                      {c.vendor && <span className="text-slate-500 text-sm ml-2">· {c.vendor}</span>}
                      <p className="text-sm text-slate-600">{c.description || '—'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{formatCurrency(c.amount)}</span>
                      <span className="text-sm text-slate-500">{formatDate(c.date)}</span>
                      <Button variant="ghost" size="sm" onClick={() => removeCost(c.id)} className="!min-h-0 text-red-600">
                        Delete
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      {tab === 'change-orders' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <h2 className="font-semibold text-slate-900">Change orders</h2>
            <Button onClick={() => setChangeOrderModal(true)}>Add change order</Button>
          </CardHeader>
          <CardContent>
            {changeOrders.length === 0 ? (
              <p className="text-slate-600 py-4">No change orders yet.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {changeOrders.map((co) => (
                  <li key={co.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                    <div>
                      <span className={cn('font-medium', co.type === 'positive' ? 'text-green-700' : 'text-red-700')}>
                        {co.type === 'positive' ? '+' : '−'} {formatCurrency(co.amount)}
                      </span>
                      <p className="text-sm text-slate-600">{co.description}</p>
                      <span className="text-xs text-slate-500">{co.status}</span>
                    </div>
                    {co.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => approveChangeOrder(co.id)} className="!min-h-0">
                          Approve
                        </Button>
                        <Button variant="danger" size="sm" onClick={() => rejectCO(co.id)} className="!min-h-0">
                          Reject
                        </Button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      {tab === 'forecast' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-slate-900">Current metrics</h2>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <p><span className="text-slate-600">Cost to date:</span> {formatCurrency(costToDate)}</p>
              <p><span className="text-slate-600">Burn rate:</span> {formatCurrency(burnRate)}/day</p>
              <p><span className="text-slate-600">Remaining budget:</span> {formatCurrency(remainingBudget)}</p>
              <p><span className="text-slate-600">Projected total:</span> {formatCurrency(costToDate + remainingBudget)}</p>
            </CardContent>
          </Card>

          {/* Projected at completion date */}
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-slate-900">Projected at completion</h2>
            </CardHeader>
            <CardContent>
              {!completionForecast ? (
                <p className="text-slate-600">
                  Set a project end date in Edit project to see where the budget will be at completion.
                </p>
              ) : completionForecast.completed ? (
                <p className="text-slate-600">
                  Project completion date: {formatDate(completionForecast.endDate)}. Project is past its end date.
                </p>
              ) : (
                <div className="space-y-4">
                  <p className="text-slate-600">
                    Completion date: <span className="font-medium text-slate-900">{formatDate(completionForecast.endDate)}</span>
                    {' · '}
                    {completionForecast.daysUntilEnd} day{completionForecast.daysUntilEnd !== 1 ? 's' : ''} remaining
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <p className="text-sm text-slate-600">Projected cost at completion</p>
                      <p className="text-xl font-semibold text-slate-900">
                        {formatCurrency(completionForecast.projectedCostAtCompletion as number)}
                      </p>
                      <p className="text-xs text-slate-500">
                        Cost to date + burn rate × {completionForecast.daysUntilEnd} days
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Projected profit</p>
                      <p className={cn(
                        'text-xl font-semibold',
                        (completionForecast.projectedRemaining ?? 0) >= 0 ? 'text-green-700' : 'text-red-700'
                      )}>
                        {formatCurrency(completionForecast.projectedRemaining ?? 0)}
                      </p>
                      <p className="text-xs text-slate-500">
                        Total budget − projected cost
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <h2 className="font-semibold text-slate-900">Share forecast</h2>
              <Button onClick={handleSaveForecast}>Share forecast</Button>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">
                Share the current forecast via email. The project insight from Overview is included.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {tab === 'share' && project && (
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-slate-900">Share project</h2>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleInvite} className="flex gap-2">
              <Input
                type="email"
                placeholder="Email address"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" loading={shareLoading} disabled={!shareEmail.trim()}>
                Send request
              </Button>
            </form>
            <p className="text-sm text-slate-500">
              They&apos;ll see the request in their Projects list and must accept to get access.
            </p>

            {(project.collaboratorIds?.length ?? 0) > 0 && (
              <div>
                <h3 className="text-sm font-medium text-slate-700 mb-2">Collaborators</h3>
                <ul className="divide-y divide-slate-100">
                  {(project.collaboratorIds ?? []).map((uid) => (
                    <li key={uid} className="py-2 flex items-center justify-between">
                      <span className="text-slate-700">
                        {collaboratorNames[uid] ?? 'Collaborator'}
                      </span>
                      {isOwner && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="!min-h-0 text-red-600"
                          onClick={() => handleRemoveCollaborator(uid)}
                        >
                          Remove
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {(project.pendingInvites?.length ?? 0) > 0 && (
              <div>
                <h3 className="text-sm font-medium text-slate-700 mb-2">Pending requests</h3>
                <ul className="divide-y divide-slate-100">
                  {[...new Map((project.pendingInvites ?? []).map((e) => [e.toLowerCase().trim(), e])).values()].map((email) => (
                    <li key={email} className="py-2 flex items-center justify-between">
                      <span className="text-slate-600">{email}</span>
                      {isOwner && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="!min-h-0 text-red-600"
                          onClick={() => handleRevokeInvite(email)}
                        >
                          Revoke
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {(!project.collaboratorIds?.length && !project.pendingInvites?.length) && (
              <p className="text-sm text-slate-500">
                No collaborators yet. Send a request by email; they must accept to get access.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {tab === 'logs' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <h2 className="font-semibold text-slate-900">Audit log</h2>
            <Button variant="secondary" onClick={exportLogsCsv}>Export CSV</Button>
          </CardHeader>
          <CardContent>
            {logs.length === 0 ? (
              <p className="text-slate-600 py-4">No log entries yet.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {logs.map((l) => {
                  const who = l.userId === user?.uid
                    ? (profile?.displayName || user?.email || 'You')
                    : (logUserNames[l.userId] ?? 'Loading…')
                  return (
                    <li key={l.id} className="py-2 text-sm">
                      <span className="text-slate-500">{formatDateTimeLocal(l.createdAt)}</span>
                      {' · '}
                      <span className="font-medium">
                        {formatActionLabel(l.action, project?.name, l.metadata)}
                      </span>
                      {' · '}
                      <span className="text-slate-600">{who}</span>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      <Modal open={costModal} onClose={() => setCostModal(false)} title="Add cost">
        <form onSubmit={handleAddCost} className="space-y-4">
          <Input
            label="Amount"
            type="number"
            min={0}
            step={0.01}
            value={costForm.amount}
            onChange={(e) => setCostForm((f) => ({ ...f, amount: e.target.value }))}
            required
          />
          <Input
            label="Category"
            value={costForm.category}
            onChange={(e) => setCostForm((f) => ({ ...f, category: e.target.value }))}
            required
          />
          <Input
            label="Vendor"
            value={costForm.vendor}
            onChange={(e) => setCostForm((f) => ({ ...f, vendor: e.target.value }))}
          />
          <Input
            label="Date"
            type="date"
            value={costForm.date}
            onChange={(e) => setCostForm((f) => ({ ...f, date: e.target.value }))}
          />
          <Select
            label="Deduction"
            options={[
              { value: 'manual', label: 'Manual' },
              { value: 'automatic', label: 'Automatic' },
            ]}
            value={costForm.deductionType}
            onChange={(e) => setCostForm((f) => ({ ...f, deductionType: e.target.value as 'manual' | 'automatic' }))}
          />
          <Textarea
            label="Description"
            value={costForm.description}
            onChange={(e) => setCostForm((f) => ({ ...f, description: e.target.value }))}
          />
          <div className="flex gap-2">
            <Button type="submit">Add</Button>
            <Button type="button" variant="ghost" onClick={() => setCostModal(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>

      <Modal open={changeOrderModal} onClose={() => setChangeOrderModal(false)} title="Add change order">
        <form onSubmit={handleAddChangeOrder} className="space-y-4">
          <Select
            label="Type"
            options={[
              { value: 'positive', label: 'Positive' },
              { value: 'negative', label: 'Negative' },
            ]}
            value={coForm.type}
            onChange={(e) => setCoForm((f) => ({ ...f, type: e.target.value as 'positive' | 'negative' }))}
          />
          <Input
            label="Amount"
            type="number"
            min={0}
            step={0.01}
            value={coForm.amount}
            onChange={(e) => setCoForm((f) => ({ ...f, amount: e.target.value }))}
            required
          />
          <Textarea
            label="Description"
            value={coForm.description}
            onChange={(e) => setCoForm((f) => ({ ...f, description: e.target.value }))}
            required
          />
          <div className="flex gap-2">
            <Button type="submit">Add</Button>
            <Button type="button" variant="ghost" onClick={() => setChangeOrderModal(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>

      <Modal open={deleteConfirmOpen} onClose={() => !deleteLoading && setDeleteConfirmOpen(false)} title="Delete project">
        <div className="space-y-4">
          <p className="text-slate-700">
            Permanently delete &quot;{project.name}&quot;? All costs, change orders, forecasts, and audit logs will be removed. This cannot be undone.
          </p>
          <div className="flex gap-2">
            <Button variant="danger" onClick={handleDeleteProject} loading={deleteLoading} disabled={deleteLoading}>
              Delete project
            </Button>
            <Button type="button" variant="ghost" onClick={() => setDeleteConfirmOpen(false)} disabled={deleteLoading}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
