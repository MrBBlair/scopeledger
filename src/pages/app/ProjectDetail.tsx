import { useState, useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useProjectDetail } from '@/hooks/useProjectDetail'
import { getAIInsight } from '@/ai/gemini'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { formatCurrency, formatDate } from '@/utils/format'
import { cn } from '@/utils/cn'

type Tab = 'overview' | 'costs' | 'change-orders' | 'forecast' | 'logs'

const tabs: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'costs', label: 'Costs' },
  { id: 'change-orders', label: 'Change orders' },
  { id: 'forecast', label: 'Forecast' },
  { id: 'logs', label: 'Logs' },
]

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const detail = useProjectDetail(id)
  const [tab, setTab] = useState<Tab>('overview')
  const [costModal, setCostModal] = useState(false)
  const [changeOrderModal, setChangeOrderModal] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiSummary, setAiSummary] = useState<string | null>(null)
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

  const {
    project,
    costs,
    changeOrders,
    logs,
    loading,
    error,
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

  const handleAIHealth = async () => {
    if (!id || !project) return
    setAiLoading(true)
    setAiSummary(null)
    try {
      const res = await getAIInsight(
        { projectId: id, prompt: 'health' },
        {
          costToDate,
          totalBudget,
          remainingBudget,
          burnRate,
          baselineBudget: project.baselineBudget,
        }
      )
      setAiSummary(res.summary)
    } catch {
      setAiSummary('Unable to load AI insight.')
    } finally {
      setAiLoading(false)
    }
  }

  const handleSaveForecast = async () => {
    const version = (latestForecast?.version ?? 0) + 1
    await saveForecast({
      version,
      costToDate,
      burnRate,
      remainingBudget,
      projectedTotal: costToDate + remainingBudget,
      manualOverride: null,
      aiSummary: aiSummary ?? null,
    })
  }

  const exportLogsCsv = () => {
    const headers = ['Date', 'Action', 'User', 'Metadata']
    const rows = logs.map((l) => [
      l.createdAt,
      l.action,
      l.userId,
      JSON.stringify(l.metadata),
    ])
    const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `project-${id}-logs.csv`
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link to="/app/projects" className="text-sm text-brand-600 hover:underline mb-1 inline-block">
            ← Projects
          </Link>
          <h1 className="font-display text-2xl font-bold text-slate-900">{project.name}</h1>
          <p className="text-slate-600 text-sm">{project.description || 'No description'}</p>
        </div>
        <Link to={`/app/projects/${id}/edit`}>
          <Button variant="secondary">Edit project</Button>
        </Link>
      </div>

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
              <h2 className="font-semibold text-slate-900">AI insight</h2>
            </CardHeader>
            <CardContent>
              <Button variant="secondary" onClick={handleAIHealth} loading={aiLoading}>
                Explain this project&apos;s financial health
              </Button>
              {aiSummary && (
                <div className="mt-4 p-4 rounded-xl bg-slate-50 text-slate-700">{aiSummary}</div>
              )}
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
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <h2 className="font-semibold text-slate-900">Save snapshot</h2>
              <Button onClick={handleSaveForecast}>Save forecast</Button>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">
                Store current metrics as a versioned snapshot. AI summary is included if you ran &quot;Explain financial health&quot; in Overview.
              </p>
            </CardContent>
          </Card>
        </div>
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
                {logs.map((l) => (
                  <li key={l.id} className="py-2 text-sm">
                    <span className="text-slate-500">{formatDate(l.createdAt)}</span>
                    {' · '}
                    <span className="font-medium">{l.action}</span>
                    {' · '}
                    <span className="text-slate-600">{l.userId}</span>
                    {Object.keys(l.metadata).length > 0 && (
                      <span className="text-slate-400 ml-1"> {JSON.stringify(l.metadata)}</span>
                    )}
                  </li>
                ))}
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
    </div>
  )
}
