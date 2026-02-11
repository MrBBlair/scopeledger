import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import {
  getProjects,
  getProjectsSharedWith,
  getProjectsWithPendingInvite,
  createProject,
  updateProject,
  lockBaseline,
  deleteProject,
  addAuditLog,
  acceptInvite,
  removePendingInvite,
} from '@/services/firestore'
import type { Project } from '@/types'

export function useProjects() {
  const { user } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [pendingInviteProjects, setPendingInviteProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProjects = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      await user.getIdToken()
      const [ownedResult, sharedResult, pendingResult] = await Promise.allSettled([
        getProjects(user.uid),
        getProjectsSharedWith(user.uid),
        user.email ? getProjectsWithPendingInvite(user.email) : Promise.resolve([]),
      ])
      if (ownedResult.status === 'rejected') throw ownedResult.reason
      const owned = ownedResult.value
      const shared = sharedResult.status === 'fulfilled' ? sharedResult.value : []
      const pending = pendingResult.status === 'fulfilled' ? pendingResult.value : []
      const byId = new Map<string, Project>()
      for (const p of [...owned, ...shared]) byId.set(p.id, p)
      const merged = [...byId.values()].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )
      setProjects(merged)
      setPendingInviteProjects(pending)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load projects')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const create = useCallback(
    async (data: Omit<Project, 'id' | 'ownerId' | 'createdAt' | 'updatedAt' | 'baselineLockedAt' | 'collaboratorIds' | 'pendingInvites'>) => {
      if (!user) throw new Error('Not authenticated')
      const id = await createProject(user.uid, data)
      await addAuditLog(id, user.uid, 'project_created', { projectName: data.name })
      await fetchProjects()
      return id
    },
    [user, fetchProjects]
  )

  const update = useCallback(
    async (projectId: string, data: Partial<Project>) => {
      await updateProject(projectId, data)
      const action = data.status === 'archived' ? 'project_archived' : 'project_updated'
      await addAuditLog(projectId, user!.uid, action, { projectName: data.name })
      await fetchProjects()
    },
    [user, fetchProjects]
  )

  const lock = useCallback(
    async (projectId: string) => {
      await lockBaseline(projectId)
      await fetchProjects()
    },
    [fetchProjects]
  )

  const remove = useCallback(
    async (projectId: string) => {
      await deleteProject(projectId)
      await fetchProjects()
    },
    [fetchProjects]
  )

  const acceptProjectInvite = useCallback(
    async (projectId: string) => {
      if (!user?.email) return
      await acceptInvite(projectId, user.uid, user.email)
      await fetchProjects()
    },
    [user, fetchProjects]
  )

  const declineProjectInvite = useCallback(
    async (projectId: string) => {
      if (!user?.email) return
      await removePendingInvite(projectId, user.email)
      await fetchProjects()
    },
    [user, fetchProjects]
  )

  return {
    projects,
    pendingInviteProjects,
    loading,
    error,
    create,
    update,
    lock,
    remove,
    acceptProjectInvite,
    declineProjectInvite,
    refresh: fetchProjects,
  }
}
