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
  arrayUnion,
  arrayRemove,
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
    businessName: d.businessName ?? '',
    photoURL: d.photoURL ?? null,
    createdAt: ts(d.createdAt) ?? '',
    updatedAt: ts(d.updatedAt) ?? '',
    onboardingCompleted: d.onboardingCompleted ?? false,
    welcomeSuppressed: d.welcomeSuppressed ?? false,
    emailOptOut: d.emailOptOut ?? false,
  }
}

export async function setProfile(
  uid: string,
  data: Partial<Pick<UserProfile, 'displayName' | 'businessName' | 'photoURL' | 'onboardingCompleted' | 'email' | 'welcomeSuppressed' | 'emailOptOut'>>
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
    welcomeSuppressed: false,
    emailOptOut: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }, { merge: true })
}

// ─── Admin (config/roles + list all) ──────────────────────────────────────────

export interface AdminConfig {
  adminUids: string[]
}

const CONFIG_ROLES = 'config/roles'

export async function getAdminConfig(): Promise<AdminConfig | null> {
  const snap = await getDoc(doc(db, CONFIG_ROLES))
  if (!snap.exists()) return null
  const d = snap.data()
  const list = d.adminUids
  return { adminUids: Array.isArray(list) ? list : [] }
}

export async function setAdminUids(adminUids: string[]): Promise<void> {
  await setDoc(doc(db, CONFIG_ROLES), { adminUids }, { merge: true })
}

/** Admin only: delete a user profile from Firestore. User can still exist in Firebase Auth. */
export async function deleteProfile(uid: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid))
}

export async function listAllUsers(): Promise<UserProfile[]> {
  const snap = await getDocs(col('users'))
  return snap.docs.map((d) => {
    const x = d.data()
    return {
      uid: d.id,
      email: (x.email as string) ?? '',
      displayName: (x.displayName as string) ?? '',
      businessName: (x.businessName as string) ?? '',
      photoURL: (x.photoURL as string | null) ?? null,
      createdAt: ts(x.createdAt as Timestamp) ?? '',
      updatedAt: ts(x.updatedAt as Timestamp) ?? '',
      onboardingCompleted: (x.onboardingCompleted as boolean) ?? false,
      welcomeSuppressed: (x.welcomeSuppressed as boolean) ?? false,
      emailOptOut: (x.emailOptOut as boolean) ?? false,
    } as UserProfile
  })
}

// ─── Projects ─────────────────────────────────────────────────────────────────

export async function getProjects(ownerId: string): Promise<Project[]> {
  const q = query(
    col('projects'),
    where('ownerId', '==', ownerId),
    orderBy('updatedAt', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => projectFromData(d.id, d.data()))
}

function projectFromData(id: string, x: Record<string, unknown>): Project {
  return {
    id,
    ownerId: x.ownerId as string,
    name: x.name as string,
    description: (x.description as string) ?? '',
    status: (x.status as Project['status']) ?? 'active',
    baselineBudget: (x.baselineBudget as number) ?? 0,
    overheadPercent: (x.overheadPercent as number) ?? 0,
    overheadAmount: (x.overheadAmount as number) ?? 0,
    currency: (x.currency as string) ?? 'USD',
    startDate: (x.startDate as string) ?? '',
    endDate: (x.endDate as string) ?? null,
    createdAt: ts(x.createdAt as Timestamp) ?? '',
    updatedAt: ts(x.updatedAt as Timestamp) ?? '',
    baselineLockedAt: ts(x.baselineLockedAt as Timestamp) ?? null,
    collaboratorIds: (x.collaboratorIds as string[]) ?? [],
    pendingInvites: (x.pendingInvites as string[]) ?? [],
  } as Project
}

export async function getProjectsSharedWith(uid: string): Promise<Project[]> {
  const q = query(
    col('projects'),
    where('collaboratorIds', 'array-contains', uid),
    orderBy('updatedAt', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => projectFromData(d.id, d.data()))
}

export async function getProjectsWithPendingInvite(email: string): Promise<Project[]> {
  const q = query(
    col('projects'),
    where('pendingInvites', 'array-contains', email),
    orderBy('updatedAt', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => projectFromData(d.id, d.data()))
}

export async function getProject(projectId: string): Promise<Project | null> {
  const snap = await getDoc(doc(db, 'projects', projectId))
  if (!snap.exists()) return null
  return projectFromData(snap.id, snap.data())
}

/** Admin only: list all projects (requires Firestore config/roles with your UID in adminUids). */
export async function listAllProjects(): Promise<Project[]> {
  const q = query(col('projects'), orderBy('updatedAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => projectFromData(d.id, d.data()))
}

export async function createProject(ownerId: string, data: Omit<Project, 'id' | 'ownerId' | 'createdAt' | 'updatedAt' | 'baselineLockedAt' | 'collaboratorIds' | 'pendingInvites'>): Promise<string> {
  const ref = await addDoc(col('projects'), {
    ownerId,
    ...data,
    baselineLockedAt: null,
    collaboratorIds: [],
    pendingInvites: [],
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

/** Emails to store for one invite (lowercase + original if different) so Firestore rules match regardless of auth token case. */
function inviteEmailVariants(email: string): string[] {
  const trimmed = email.trim()
  const lower = trimmed.toLowerCase()
  return lower === trimmed ? [lower] : [lower, trimmed]
}

export async function addCollaborator(projectId: string, email: string): Promise<void> {
  const ref = doc(db, 'projects', projectId)
  const variants = inviteEmailVariants(email)
  await updateDoc(ref, {
    pendingInvites: arrayUnion(...variants),
    updatedAt: serverTimestamp(),
  })
}

export async function removeCollaborator(projectId: string, uid: string): Promise<void> {
  const ref = doc(db, 'projects', projectId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return
  const collab = (snap.data().collaboratorIds as string[]) ?? []
  const next = collab.filter((id) => id !== uid)
  await updateDoc(ref, { collaboratorIds: next, updatedAt: serverTimestamp() })
}

export async function removePendingInvite(projectId: string, email: string): Promise<void> {
  const ref = doc(db, 'projects', projectId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return
  const pending = (snap.data().pendingInvites as string[]) ?? []
  const normalized = email.toLowerCase().trim()
  const toRemove = pending.filter((e) => e.toLowerCase().trim() === normalized)
  if (toRemove.length === 0) return
  await updateDoc(ref, {
    pendingInvites: arrayRemove(...toRemove),
    updatedAt: serverTimestamp(),
  })
}

export async function acceptInvite(projectId: string, uid: string, email: string): Promise<void> {
  const ref = doc(db, 'projects', projectId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return
  const pending = (snap.data().pendingInvites as string[]) ?? []
  const normalized = email.toLowerCase().trim()
  const toRemove = pending.filter((e) => e.toLowerCase().trim() === normalized)
  await updateDoc(ref, {
    collaboratorIds: arrayUnion(uid),
    ...(toRemove.length > 0 && { pendingInvites: arrayRemove(...toRemove) }),
    updatedAt: serverTimestamp(),
  })
}

export async function declineInvite(projectId: string, email: string): Promise<void> {
  await removePendingInvite(projectId, email)
}

/** Delete all documents in a collection where projectId matches (batches of 500). */
async function deleteCollectionByProjectId(
  collectionName: 'costs' | 'changeOrders' | 'forecasts' | 'auditLogs',
  projectId: string
): Promise<void> {
  const batchSize = 500
  let snap = await getDocs(query(col(collectionName), where('projectId', '==', projectId)))
  while (!snap.empty) {
    const batch = writeBatch(db)
    snap.docs.slice(0, batchSize).forEach((d) => batch.delete(d.ref))
    await batch.commit()
    if (snap.docs.length <= batchSize) break
    snap = await getDocs(query(col(collectionName), where('projectId', '==', projectId)))
  }
}

export async function deleteProject(projectId: string): Promise<void> {
  await deleteCollectionByProjectId('auditLogs', projectId)
  await deleteCollectionByProjectId('costs', projectId)
  await deleteCollectionByProjectId('changeOrders', projectId)
  await deleteCollectionByProjectId('forecasts', projectId)
  await deleteDoc(doc(db, 'projects', projectId))
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
