import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { getProjects, createProject, updateProject, lockBaseline } from '@/services/firestore'
import type { Project } from '@/types'

export function useProjects() {
  const { user } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProjects = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      const list = await getProjects(user.uid)
      setProjects(list)
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
    async (data: Omit<Project, 'id' | 'ownerId' | 'createdAt' | 'updatedAt' | 'baselineLockedAt'>) => {
      if (!user) throw new Error('Not authenticated')
      const id = await createProject(user.uid, data)
      await fetchProjects()
      return id
    },
    [user, fetchProjects]
  )

  const update = useCallback(
    async (projectId: string, data: Partial<Project>) => {
      await updateProject(projectId, data)
      await fetchProjects()
    },
    [fetchProjects]
  )

  const lock = useCallback(
    async (projectId: string) => {
      await lockBaseline(projectId)
      await fetchProjects()
    },
    [fetchProjects]
  )

  return { projects, loading, error, create, update, lock, refresh: fetchProjects }
}
