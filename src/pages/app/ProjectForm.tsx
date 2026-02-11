import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useProjects } from '@/hooks/useProjects'
import { getProject } from '@/services/firestore'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import type { Project } from '@/types'
import { parseProjectSlug, isLegacyProjectId, resolveSlugToProjectId, projectPath } from '@/utils/projectPath'

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'archived', label: 'Archived' },
]

export function ProjectForm() {
  const { slug } = useParams<{ slug: string }>()
  const { projects, create, update } = useProjects()
  const id = slug
    ? parseProjectSlug(slug) ?? (isLegacyProjectId(slug) ? slug : resolveSlugToProjectId(slug, projects))
    : undefined
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    description: '',
    status: 'active' as Project['status'],
    baselineBudget: '',
    overheadPercent: '0',
    currency: 'USD',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: '',
  })

  const isEdit = Boolean(id)

  useEffect(() => {
    if (!isEdit || !id) return
    getProject(id).then((p) => {
      if (p) {
        setForm({
          name: p.name,
          description: p.description,
          status: p.status,
          baselineBudget: String(p.baselineBudget),
          overheadPercent: String(p.overheadPercent),
          currency: p.currency,
          startDate: p.startDate.slice(0, 10),
          endDate: p.endDate?.slice(0, 10) ?? '',
        })
      }
    })
  }, [isEdit, id])

  const overheadAmount =
    (Number(form.baselineBudget) || 0) * (Number(form.overheadPercent) || 0) / 100

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const budget = Number(form.baselineBudget)
    if (!form.name.trim()) {
      setError('Name is required')
      return
    }
    if (isNaN(budget) || budget < 0) {
      setError('Valid baseline budget is required')
      return
    }
    setLoading(true)
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        status: form.status,
        baselineBudget: budget,
        overheadPercent: Number(form.overheadPercent) || 0,
        overheadAmount,
        currency: form.currency,
        startDate: form.startDate,
        endDate: form.endDate || null,
      }
      if (isEdit && id) {
        await update(id, payload)
        navigate(projectPath({ id, name: payload.name }))
      } else {
        const newId = await create(payload)
        navigate(projectPath({ id: newId, name: payload.name }))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl font-bold text-slate-900 mb-6">
        {isEdit ? 'Edit project' : 'New project'}
      </h1>
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-slate-900">Details</h2>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-sm" role="alert">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Project name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Building A"
              required
            />
            <Textarea
              label="Description"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Brief description"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Baseline budget"
                type="number"
                min={0}
                step={0.01}
                value={form.baselineBudget}
                onChange={(e) => setForm((f) => ({ ...f, baselineBudget: e.target.value }))}
                required
              />
              <Input
                label="Overhead %"
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={form.overheadPercent}
                onChange={(e) => setForm((f) => ({ ...f, overheadPercent: e.target.value }))}
              />
            </div>
            {overheadAmount > 0 && (
              <p className="text-sm text-slate-600">
                Overhead amount: {new Intl.NumberFormat('en-US', { style: 'currency', currency: form.currency }).format(overheadAmount)}
              </p>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Start date"
                type="date"
                value={form.startDate}
                onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
              />
              <Input
                label="End date (optional)"
                type="date"
                value={form.endDate}
                onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
              />
            </div>
            {isEdit && (
              <Select
                label="Status"
                options={statusOptions}
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as Project['status'] }))}
              />
            )}
            <div className="flex gap-3 pt-2">
              <Button type="submit" loading={loading}>
                {isEdit ? 'Save' : 'Create'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => (id ? navigate(projectPath({ id, name: form.name })) : navigate('/app/projects'))}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
