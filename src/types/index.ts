// ─── User & Auth ─────────────────────────────────────────────────────────────

export interface UserProfile {
  uid: string
  email: string
  displayName: string
  photoURL: string | null
  createdAt: string
  updatedAt: string
  onboardingCompleted: boolean
}

// ─── Project ─────────────────────────────────────────────────────────────────

export type ProjectStatus = 'active' | 'archived'

export interface Project {
  id: string
  ownerId: string
  name: string
  description: string
  status: ProjectStatus
  baselineBudget: number
  overheadPercent: number
  overheadAmount: number
  currency: string
  startDate: string
  endDate: string | null
  createdAt: string
  updatedAt: string
  baselineLockedAt: string | null
}

// ─── Cost ────────────────────────────────────────────────────────────────────

export interface Cost {
  id: string
  projectId: string
  amount: number
  category: string
  vendor: string
  description: string
  date: string
  createdAt: string
  updatedAt: string
  createdBy: string
  deductionType: 'manual' | 'automatic'
}

// ─── Change Order ────────────────────────────────────────────────────────────

export type ChangeOrderType = 'positive' | 'negative'
export type ChangeOrderStatus = 'pending' | 'approved' | 'rejected'

export interface ChangeOrder {
  id: string
  projectId: string
  type: ChangeOrderType
  amount: number
  description: string
  status: ChangeOrderStatus
  approvedBy: string | null
  approvedAt: string | null
  createdAt: string
  updatedAt: string
  createdBy: string
}

// ─── Forecast ────────────────────────────────────────────────────────────────

export interface ForecastSnapshot {
  id: string
  projectId: string
  version: number
  costToDate: number
  burnRate: number
  remainingBudget: number
  projectedTotal: number
  manualOverride: number | null
  aiSummary: string | null
  createdAt: string
  createdBy: string
}

// ─── Audit Log ───────────────────────────────────────────────────────────────

export type AuditAction =
  | 'cost_added'
  | 'cost_edited'
  | 'cost_deleted'
  | 'change_order_added'
  | 'change_order_approved'
  | 'change_order_rejected'
  | 'forecast_updated'
  | 'project_created'
  | 'project_updated'
  | 'project_archived'

export interface AuditLogEntry {
  id: string
  projectId: string
  action: AuditAction
  userId: string
  metadata: Record<string, unknown>
  createdAt: string
}

// ─── AI ──────────────────────────────────────────────────────────────────────

export interface AIInsightRequest {
  projectId: string
  prompt: 'health' | 'forecast_risk' | 'monthly_summary' | 'custom'
  customPrompt?: string
  context?: Record<string, unknown>
}

export interface AIInsightResponse {
  summary: string
  explainable: string
  suggestedActions?: string[]
}
