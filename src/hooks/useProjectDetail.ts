import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import {
  getProject,
  getCosts,
  getChangeOrders,
  getForecastSnapshots,
  getAuditLogs,
  addCost,
  updateCost,
  deleteCost,
  addChangeOrder,
  approveChangeOrder,
  rejectChangeOrder,
  addForecastSnapshot,
  addAuditLog,
} from '@/services/firestore'
import type { Project, Cost, ChangeOrder, ForecastSnapshot, AuditLogEntry } from '@/types'

export function useProjectDetail(projectId: string | undefined) {
  const { user } = useAuth()
  const [project, setProject] = useState<Project | null>(null)
  const [costs, setCosts] = useState<Cost[]>([])
  const [changeOrders, setChangeOrders] = useState<ChangeOrder[]>([])
  const [forecasts, setForecasts] = useState<ForecastSnapshot[]>([])
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    setError(null)
    try {
      const [p, c, co, f, l] = await Promise.all([
        getProject(projectId),
        getCosts(projectId),
        getChangeOrders(projectId),
        getForecastSnapshots(projectId, 10),
        getAuditLogs(projectId, 50),
      ])
      setProject(p ?? null)
      setCosts(c)
      setChangeOrders(co)
      setForecasts(f)
      setLogs(l)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    fetch()
  }, [fetch])

  const costToDate = costs.reduce((sum, x) => sum + x.amount, 0)
  const approvedChangeTotal = changeOrders
    .filter((o) => o.status === 'approved')
    .reduce((sum, o) => sum + (o.type === 'positive' ? o.amount : -o.amount), 0)
  const totalBudget = project
    ? project.baselineBudget + project.overheadAmount + approvedChangeTotal
    : 0
  const remainingBudget = totalBudget - costToDate
  const latestForecast = forecasts[0] ?? null

  const createCost = useCallback(
    async (data: Omit<Cost, 'id' | 'projectId' | 'createdAt' | 'updatedAt' | 'createdBy'>) => {
      if (!user || !projectId) throw new Error('Not authenticated')
      const id = await addCost(projectId, user.uid, data)
      await addAuditLog(projectId, user.uid, 'cost_added', { costId: id, amount: data.amount })
      await fetch()
      return id
    },
    [user, projectId, fetch]
  )

  const editCost = useCallback(
    async (costId: string, data: Partial<Cost>) => {
      await updateCost(costId, data)
      await addAuditLog(projectId!, user!.uid, 'cost_edited', { costId, ...data })
      await fetch()
    },
    [projectId, user, fetch]
  )

  const removeCost = useCallback(
    async (costId: string) => {
      await deleteCost(costId)
      await addAuditLog(projectId!, user!.uid, 'cost_deleted', { costId })
      await fetch()
    },
    [projectId, user, fetch]
  )

  const createChangeOrder = useCallback(
    async (
      data: Omit<ChangeOrder, 'id' | 'projectId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'approvedBy' | 'approvedAt'>
    ) => {
      if (!user || !projectId) throw new Error('Not authenticated')
      const id = await addChangeOrder(projectId, user.uid, data)
      await addAuditLog(projectId, user.uid, 'change_order_added', { changeOrderId: id, ...data })
      await fetch()
      return id
    },
    [user, projectId, fetch]
  )

  const approveCO = useCallback(
    async (changeOrderId: string) => {
      if (!user || !projectId) return
      await approveChangeOrder(changeOrderId, user.uid)
      await addAuditLog(projectId, user.uid, 'change_order_approved', { changeOrderId })
      await fetch()
    },
    [user, projectId, fetch]
  )

  const rejectCO = useCallback(
    async (changeOrderId: string) => {
      if (!user || !projectId) return
      await rejectChangeOrder(changeOrderId)
      await addAuditLog(projectId, user.uid, 'change_order_rejected', { changeOrderId })
      await fetch()
    },
    [user, projectId, fetch]
  )

  const saveForecast = useCallback(
    async (data: Omit<ForecastSnapshot, 'id' | 'projectId' | 'createdAt' | 'createdBy'>) => {
      if (!user || !projectId) throw new Error('Not authenticated')
      await addForecastSnapshot(projectId, user.uid, data)
      await addAuditLog(projectId, user.uid, 'forecast_updated', {})
      await fetch()
    },
    [user, projectId, fetch]
  )

  return {
    project,
    costs,
    changeOrders,
    forecasts,
    logs,
    loading,
    error,
    costToDate,
    totalBudget,
    remainingBudget,
    approvedChangeTotal,
    latestForecast,
    createCost,
    editCost,
    removeCost,
    createChangeOrder,
    approveChangeOrder: approveCO,
    rejectChangeOrder: rejectCO,
    saveForecast,
    refresh: fetch,
  }
}
