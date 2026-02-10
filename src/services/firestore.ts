import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  writeBatch,
  type Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'
import type {
  UserProfile,
  Project,
  Cost,
  ChangeOrder,
  ForecastSnapshot,
  AuditLogEntry,
  AuditAction,
} from '@/types'

const col = (name: string) => collection(db, name)

function ts(t: Timestamp | null): string | null {
  return t ? (t as { toDate: () => Date }).toDate().toISOString() : null
}

// ─── User Profiles ────────────────────────────────────────────────────────────

export async function getProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid))
  if (!snap.exists()) return null
  const d = snap.data()
  return {
    uid: snap.id,
    email: d.email ?? '',
    displayName: d.displayName ?? '',
    photoURL: d.photoURL ?? null,
    createdAt: ts(d.createdAt) ?? '',
    updatedAt: ts(d.updatedAt) ?? '',
    onboardingCompleted: d.onboardingCompleted ?? false,
  }
}

export async function setProfile(
  uid: string,
  data: Partial<Pick<UserProfile, 'displayName' | 'photoURL' | 'onboardingCompleted' | 'email'>>
): Promise<void> {
  const ref = doc(db, 'users', uid)
  const existing = await getDoc(ref)
  const payload: Record<string, unknown> = {
    ...data,
    updatedAt: serverTimestamp(),
  }
  if (!existing.exists()) {
    await setDoc(ref, {
      ...payload,
      email: data.email ?? '',
      createdAt: serverTimestamp(),
    })
  } else {
    await updateDoc(ref, payload)
  }
}

export async function createProfile(uid: string, email: string, displayName: string, photoURL: string | null): Promise<void> {
  const ref = doc(db, 'users', uid)
  await setDoc(ref, {
    email,
    displayName,
    photoURL,
    onboardingCompleted: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }, { merge: true })
}

// ─── Projects ─────────────────────────────────────────────────────────────────

export async function getProjects(ownerId: string): Promise<Project[]> {
  const q = query(
    col('projects'),
    where('ownerId', '==', ownerId),
    orderBy('updatedAt', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => {
    const x = d.data()
    return {
      id: d.id,
      ownerId: x.ownerId,
      name: x.name,
      description: x.description ?? '',
      status: x.status ?? 'active',
      baselineBudget: x.baselineBudget ?? 0,
      overheadPercent: x.overheadPercent ?? 0,
      overheadAmount: x.overheadAmount ?? 0,
      currency: x.currency ?? 'USD',
      startDate: x.startDate ?? '',
      endDate: x.endDate ?? null,
      createdAt: ts(x.createdAt) ?? '',
      updatedAt: ts(x.updatedAt) ?? '',
      baselineLockedAt: ts(x.baselineLockedAt) ?? null,
    } as Project
  })
}

export async function getProject(projectId: string): Promise<Project | null> {
  const snap = await getDoc(doc(db, 'projects', projectId))
  if (!snap.exists()) return null
  const x = snap.data()
  return {
    id: snap.id,
    ownerId: x.ownerId,
    name: x.name,
    description: x.description ?? '',
    status: x.status ?? 'active',
    baselineBudget: x.baselineBudget ?? 0,
    overheadPercent: x.overheadPercent ?? 0,
    overheadAmount: x.overheadAmount ?? 0,
    currency: x.currency ?? 'USD',
    startDate: x.startDate ?? '',
    endDate: x.endDate ?? null,
    createdAt: ts(x.createdAt) ?? '',
    updatedAt: ts(x.updatedAt) ?? '',
    baselineLockedAt: ts(x.baselineLockedAt) ?? null,
  } as Project
}

export async function createProject(ownerId: string, data: Omit<Project, 'id' | 'ownerId' | 'createdAt' | 'updatedAt' | 'baselineLockedAt'>): Promise<string> {
  const ref = await addDoc(col('projects'), {
    ownerId,
    ...data,
    baselineLockedAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateProject(projectId: string, data: Partial<Project>): Promise<void> {
  const { id, ownerId, createdAt, ...rest } = data as Project
  void id
  void ownerId
  void createdAt
  await updateDoc(doc(db, 'projects', projectId), {
    ...rest,
    updatedAt: serverTimestamp(),
  })
}

export async function lockBaseline(projectId: string): Promise<void> {
  await updateDoc(doc(db, 'projects', projectId), {
    baselineLockedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

// ─── Costs ────────────────────────────────────────────────────────────────────

export async function getCosts(projectId: string): Promise<Cost[]> {
  const q = query(
    col('costs'),
    where('projectId', '==', projectId),
    orderBy('date', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => {
    const x = d.data()
    return {
      id: d.id,
      projectId: x.projectId,
      amount: x.amount ?? 0,
      category: x.category ?? '',
      vendor: x.vendor ?? '',
      description: x.description ?? '',
      date: x.date ?? '',
      createdAt: ts(x.createdAt) ?? '',
      updatedAt: ts(x.updatedAt) ?? '',
      createdBy: x.createdBy ?? '',
      deductionType: x.deductionType ?? 'manual',
    } as Cost
  })
}

export async function addCost(projectId: string, createdBy: string, data: Omit<Cost, 'id' | 'projectId' | 'createdAt' | 'updatedAt' | 'createdBy'>): Promise<string> {
  const ref = await addDoc(col('costs'), {
    projectId,
    createdBy,
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateCost(costId: string, data: Partial<Cost>): Promise<void> {
  const { id, projectId, createdBy, createdAt, ...rest } = data as Cost
  void id
  void projectId
  void createdBy
  void createdAt
  await updateDoc(doc(db, 'costs', costId), {
    ...rest,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteCost(costId: string): Promise<void> {
  await deleteDoc(doc(db, 'costs', costId))
}

// ─── Change Orders ────────────────────────────────────────────────────────────

export async function getChangeOrders(projectId: string): Promise<ChangeOrder[]> {
  const q = query(
    col('changeOrders'),
    where('projectId', '==', projectId),
    orderBy('createdAt', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => {
    const x = d.data()
    return {
      id: d.id,
      projectId: x.projectId,
      type: x.type ?? 'positive',
      amount: x.amount ?? 0,
      description: x.description ?? '',
      status: x.status ?? 'pending',
      approvedBy: x.approvedBy ?? null,
      approvedAt: ts(x.approvedAt) ?? null,
      createdAt: ts(x.createdAt) ?? '',
      updatedAt: ts(x.updatedAt) ?? '',
      createdBy: x.createdBy ?? '',
    } as ChangeOrder
  })
}

export async function addChangeOrder(
  projectId: string,
  createdBy: string,
  data: Omit<ChangeOrder, 'id' | 'projectId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'approvedBy' | 'approvedAt'>
): Promise<string> {
  const ref = await addDoc(col('changeOrders'), {
    projectId,
    createdBy,
    approvedBy: null,
    approvedAt: null,
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function approveChangeOrder(changeOrderId: string, approvedBy: string): Promise<void> {
  await updateDoc(doc(db, 'changeOrders', changeOrderId), {
    status: 'approved',
    approvedBy,
    approvedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export async function rejectChangeOrder(changeOrderId: string): Promise<void> {
  await updateDoc(doc(db, 'changeOrders', changeOrderId), {
    status: 'rejected',
    updatedAt: serverTimestamp(),
  })
}

// ─── Forecasts ────────────────────────────────────────────────────────────────

export async function getForecastSnapshots(projectId: string, max = 10): Promise<ForecastSnapshot[]> {
  const q = query(
    col('forecasts'),
    where('projectId', '==', projectId),
    orderBy('createdAt', 'desc'),
    limit(max)
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => {
    const x = d.data()
    return {
      id: d.id,
      projectId: x.projectId,
      version: x.version ?? 0,
      costToDate: x.costToDate ?? 0,
      burnRate: x.burnRate ?? 0,
      remainingBudget: x.remainingBudget ?? 0,
      projectedTotal: x.projectedTotal ?? 0,
      manualOverride: x.manualOverride ?? null,
      aiSummary: x.aiSummary ?? null,
      createdAt: ts(x.createdAt) ?? '',
      createdBy: x.createdBy ?? '',
    } as ForecastSnapshot
  })
}

export async function addForecastSnapshot(
  projectId: string,
  createdBy: string,
  data: Omit<ForecastSnapshot, 'id' | 'projectId' | 'createdAt' | 'createdBy'>
): Promise<string> {
  const ref = await addDoc(col('forecasts'), {
    projectId,
    createdBy,
    ...data,
    createdAt: serverTimestamp(),
  })
  return ref.id
}

// ─── Audit Log ────────────────────────────────────────────────────────────────

export async function getAuditLogs(projectId: string, max = 50): Promise<AuditLogEntry[]> {
  const q = query(
    col('auditLogs'),
    where('projectId', '==', projectId),
    orderBy('createdAt', 'desc'),
    limit(max)
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => {
    const x = d.data()
    return {
      id: d.id,
      projectId: x.projectId,
      action: x.action as AuditAction,
      userId: x.userId ?? '',
      metadata: (x.metadata as Record<string, unknown>) ?? {},
      createdAt: ts(x.createdAt) ?? '',
    } as AuditLogEntry
  })
}

export async function addAuditLog(
  projectId: string,
  userId: string,
  action: AuditAction,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  await addDoc(col('auditLogs'), {
    projectId,
    userId,
    action,
    metadata,
    createdAt: serverTimestamp(),
  })
}

export async function appendAuditBatch(
  entries: { projectId: string; userId: string; action: AuditAction; metadata?: Record<string, unknown> }[]
): Promise<void> {
  const batch = writeBatch(db)
  for (const e of entries) {
    const ref = doc(col('auditLogs'))
    batch.set(ref, {
      projectId: e.projectId,
      userId: e.userId,
      action: e.action,
      metadata: e.metadata ?? {},
      createdAt: serverTimestamp(),
    })
  }
  await batch.commit()
}
