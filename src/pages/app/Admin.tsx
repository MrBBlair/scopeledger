import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import {
  getAdminConfig,
  setAdminUids,
  setProfile,
  deleteProfile,
  listAllUsers,
  listAllProjects,
  deleteProject,
  type AdminConfig,
} from '@/services/firestore'
import type { UserProfile } from '@/types'
import type { Project } from '@/types'
import { formatCurrency, formatDate } from '@/utils/format'
import { projectPath, projectEditPath } from '@/utils/projectPath'

export function Admin() {
  const { user, isAdmin, refreshProfile } = useAuth()
  const [guideOpen, setGuideOpen] = useState(false)
  const [config, setConfig] = useState<AdminConfig | null>(null)
  const [users, setUsers] = useState<UserProfile[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [initLoading, setInitLoading] = useState(false)
  const [editUser, setEditUser] = useState<UserProfile | null>(null)
  const [editUserForm, setEditUserForm] = useState({ displayName: '', businessName: '', email: '' })
  const [editUserSaving, setEditUserSaving] = useState(false)
  const [deleteUserTarget, setDeleteUserTarget] = useState<UserProfile | null>(null)
  const [deleteUserLoading, setDeleteUserLoading] = useState(false)
  const [deleteProjectTarget, setDeleteProjectTarget] = useState<Project | null>(null)
  const [deleteProjectLoading, setDeleteProjectLoading] = useState(false)

  const refetch = useCallback(async () => {
    if (!user) return
    setError(null)
    const [c, u, p] = await Promise.all([
      getAdminConfig(),
      listAllUsers().catch((e) => (setError(e instanceof Error ? e.message : 'Failed to load users'), [] as UserProfile[])),
      listAllProjects().catch((e) => (setError(e instanceof Error ? e.message : 'Failed to load projects'), [] as Project[])),
    ])
    setConfig(c ?? null)
    setUsers(u)
    setProjects(p)
  }, [user])

  useEffect(() => {
    if (!isAdmin || !user) return
    let cancelled = false
    setLoading(true)
    setError(null)
    Promise.all([
      getAdminConfig(),
      listAllUsers().catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load users')
        return [] as UserProfile[]
      }),
      listAllProjects().catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load projects')
        return [] as Project[]
      }),
    ])
      .then(([c, u, p]) => {
        if (!cancelled) {
          setConfig(c ?? null)
          setUsers(u)
          setProjects(p)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [isAdmin, user])

  const handleInitializeRoles = async () => {
    if (!user) return
    setInitLoading(true)
    setError(null)
    try {
      await setAdminUids([user.uid])
      await refetch()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create config/roles')
    } finally {
      setInitLoading(false)
    }
  }

  const openEditUser = (u: UserProfile) => {
    setEditUser(u)
    setEditUserForm({
      displayName: u.displayName ?? '',
      businessName: u.businessName ?? '',
      email: u.email ?? '',
    })
  }

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editUser) return
    setEditUserSaving(true)
    setError(null)
    try {
      await setProfile(editUser.uid, {
        displayName: editUserForm.displayName.trim() || 'User',
        businessName: editUserForm.businessName.trim(),
        email: editUserForm.email.trim(),
      })
      if (editUser.uid === user?.uid) await refreshProfile()
      await refetch()
      setEditUser(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save user')
    } finally {
      setEditUserSaving(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!deleteUserTarget) return
    setDeleteUserLoading(true)
    setError(null)
    try {
      await deleteProfile(deleteUserTarget.uid)
      await refetch()
      setDeleteUserTarget(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete user')
    } finally {
      setDeleteUserLoading(false)
    }
  }

  const handleDeleteProject = async () => {
    if (!deleteProjectTarget) return
    setDeleteProjectLoading(true)
    setError(null)
    try {
      await deleteProject(deleteProjectTarget.id)
      await refetch()
      setDeleteProjectTarget(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete project')
    } finally {
      setDeleteProjectLoading(false)
    }
  }

  if (!isAdmin) {
    return (
      <div className="rounded-xl bg-red-50 text-red-700 p-4" role="alert">
        Admin access only. You do not have permission to view this page.
      </div>
    )
  }

  const activeProjects = projects.filter((p) => p.status === 'active')
  const totalBaseline = activeProjects.reduce(
    (sum, p) => sum + p.baselineBudget + p.overheadAmount,
    0
  )

  const projectsByOwner = useMemo(() => {
    const map = new Map<
      string,
      {
        count: number
        totalBaseline: number
      }
    >()
    for (const p of projects) {
      const existing = map.get(p.ownerId) ?? { count: 0, totalBaseline: 0 }
      existing.count += 1
      existing.totalBaseline += p.baselineBudget + p.overheadAmount
      map.set(p.ownerId, existing)
    }
    return map
  }, [projects])

  type UserSortKey = 'email' | 'displayName' | 'businessName' | 'projects' | 'totalBaseline' | 'uid' | 'joined'
  const [userSortKey, setUserSortKey] = useState<UserSortKey>('joined')
  const [userSortDir, setUserSortDir] = useState<'asc' | 'desc'>('desc')

  const sortedUsers = useMemo(() => {
    const withStats = users.map((u) => ({
      ...u,
      projectCount: projectsByOwner.get(u.uid)?.count ?? 0,
      totalBaseline: projectsByOwner.get(u.uid)?.totalBaseline ?? 0,
    }))
    const dir = userSortDir === 'asc' ? 1 : -1
    return [...withStats].sort((a, b) => {
      let aVal: string | number = ''
      let bVal: string | number = ''
      switch (userSortKey) {
        case 'email':
          aVal = (a.email ?? '').toLowerCase()
          bVal = (b.email ?? '').toLowerCase()
          break
        case 'displayName':
          aVal = (a.displayName ?? '').toLowerCase()
          bVal = (b.displayName ?? '').toLowerCase()
          break
        case 'businessName':
          aVal = (a.businessName ?? '').toLowerCase()
          bVal = (b.businessName ?? '').toLowerCase()
          break
        case 'projects':
          aVal = a.projectCount
          bVal = b.projectCount
          break
        case 'totalBaseline':
          aVal = a.totalBaseline
          bVal = b.totalBaseline
          break
        case 'uid':
          aVal = a.uid
          bVal = b.uid
          break
        case 'joined':
          aVal = new Date(a.createdAt).getTime()
          bVal = new Date(b.createdAt).getTime()
          break
        default:
          return 0
      }
      if (aVal < bVal) return -1 * dir
      if (aVal > bVal) return 1 * dir
      return 0
    })
  }, [users, projectsByOwner, userSortKey, userSortDir])

  const cycleSort = (key: UserSortKey) => {
    if (userSortKey === key) {
      setUserSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setUserSortKey(key)
      setUserSortDir(key === 'joined' || key === 'projects' || key === 'totalBaseline' ? 'desc' : 'asc')
    }
  }

  const SortHeader = ({ label, sortKey }: { label: string; sortKey: UserSortKey }) => (
    <th className="py-2 pr-4 font-medium">
      <button
        type="button"
        onClick={() => cycleSort(sortKey)}
        className="text-left text-slate-600 hover:text-slate-900 flex items-center gap-1 focus-ring rounded"
      >
        {label}
        {userSortKey === sortKey && (
          <span className="text-brand-600" aria-hidden>{userSortDir === 'asc' ? '↑' : '↓'}</span>
        )}
      </button>
    </th>
  )

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-brand-50 px-4 py-6 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-900">Super Admin</h1>
            <p className="mt-1 text-slate-600">
              Manage the app: users, projects, and configuration.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setGuideOpen(true)}>
              Admin Guide
            </Button>
            <a
              href="https://console.firebase.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center font-medium rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-700 hover:bg-slate-50 transition-colors min-h-touch"
            >
              Firebase Console
            </a>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-amber-50 text-amber-800 px-4 py-3 text-sm" role="alert">
          {error}
          {config === null && (
            <span className="block mt-1">
              Create Firestore document <code className="bg-amber-100 px-1 rounded">config/roles</code> with field{' '}
              <code className="bg-amber-100 px-1 rounded">adminUids: [&quot;your-uid&quot;]</code> to enable listing users and projects.
            </span>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-brand-500 border-t-transparent" aria-hidden />
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="py-5">
                <p className="text-sm text-slate-600">Total users</p>
                <p className="text-2xl font-semibold text-slate-900">{users.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-5">
                <p className="text-sm text-slate-600">Total projects</p>
                <p className="text-2xl font-semibold text-slate-900">{projects.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-5">
                <p className="text-sm text-slate-600">Active projects</p>
                <p className="text-2xl font-semibold text-slate-900">{activeProjects.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-5">
                <p className="text-sm text-slate-600">Total baseline + overhead</p>
                <p className="text-2xl font-semibold text-slate-900">{formatCurrency(totalBaseline)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Users */}
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-slate-900">Users & business overview</h2>
            </CardHeader>
            <CardContent>
              {users.length === 0 ? (
                <p className="text-slate-600 py-2">No users in Firestore.</p>
              ) : (
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-left text-slate-600">
                        <SortHeader label="Email" sortKey="email" />
                        <SortHeader label="Display name" sortKey="displayName" />
                        <SortHeader label="Business" sortKey="businessName" />
                        <SortHeader label="Projects" sortKey="projects" />
                        <SortHeader label="Total baseline + overhead" sortKey="totalBaseline" />
                        <SortHeader label="UID" sortKey="uid" />
                        <SortHeader label="Joined" sortKey="joined" />
                        <th className="py-2 pr-4 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedUsers.map((u) => (
                        <tr key={u.uid} className="border-b border-slate-100">
                          <td className="py-3 pr-4 text-slate-900">{u.email || '—'}</td>
                          <td className="py-3 pr-4 text-slate-700">{u.displayName || '—'}</td>
                          <td className="py-3 pr-4 text-slate-700">{u.businessName || '—'}</td>
                          <td className="py-3 pr-4 text-slate-700">{u.projectCount}</td>
                          <td className="py-3 pr-4 text-slate-700">
                            {u.projectCount === 0 ? '—' : formatCurrency(u.totalBaseline)}
                          </td>
                          <td className="py-3 pr-4 font-mono text-xs text-slate-500">{u.uid}</td>
                          <td className="py-3 pr-4 text-slate-600">{formatDate(u.createdAt)}</td>
                          <td className="py-3 pr-4 text-right">
                            <div className="flex gap-2 justify-end">
                              <Button size="sm" variant="secondary" onClick={() => openEditUser(u)}>
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => setDeleteUserTarget(u)}
                              >
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Projects */}
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-slate-900">Projects</h2>
            </CardHeader>
            <CardContent>
              {projects.length === 0 ? (
                <p className="text-slate-600 py-2">No projects.</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {projects.map((p) => (
                    <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-3 -mx-4 px-4 rounded-lg hover:bg-slate-50 group">
                      <Link
                        to={projectPath(p)}
                        className="flex-1 min-w-0 flex items-center justify-between gap-2 text-left"
                      >
                        <span className="font-medium text-slate-900">{p.name}</span>
                        <span className="text-sm text-slate-600 shrink-0">
                          {formatCurrency(p.baselineBudget + p.overheadAmount)} · {p.status} · {formatDate(p.updatedAt)}
                        </span>
                      </Link>
                      <div className="flex gap-2 shrink-0">
                        <Link to={projectEditPath(p)}>
                          <Button size="sm" variant="secondary">
                            Edit
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => setDeleteProjectTarget(p)}
                        >
                          Delete
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Admin UIDs (Firestore) */}
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-slate-900">Firestore admin UIDs</h2>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 text-sm mb-4">
                Users in <code className="bg-slate-100 px-1 rounded">config/roles</code> adminUids can read all users and projects.
                Create the document in Firebase Console if it doesn’t exist; then only listed admins can update it.
              </p>
              {config ? (
                <div className="flex flex-wrap items-center gap-2">
                  {config.adminUids.length === 0 ? (
                    <span className="text-slate-500">Empty list</span>
                  ) : (
                    config.adminUids.map((uid) => (
                      <span
                        key={uid}
                        className="inline-flex items-center gap-1 font-mono text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded"
                      >
                        {uid}
                        {user?.uid === uid && <span className="text-brand-600">(you)</span>}
                      </span>
                    ))
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-amber-700 text-sm">
                    No <code className="bg-amber-100 px-1 rounded">config/roles</code> document. Initialize it with your UID so this board can list all users and projects.
                  </p>
                  <Button
                    onClick={handleInitializeRoles}
                    loading={initLoading}
                    disabled={initLoading}
                  >
                    Initialize Firestore admin list (add my UID)
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Edit user modal */}
      <Modal
        open={!!editUser}
        onClose={() => setEditUser(null)}
        title={editUser ? `Edit ${editUser.displayName || editUser.email || 'User'}` : 'Edit user'}
      >
        {editUser && (
          <form onSubmit={handleSaveUser} className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={editUserForm.email}
              onChange={(e) => setEditUserForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="user@example.com"
            />
            <Input
              label="Display name"
              value={editUserForm.displayName}
              onChange={(e) => setEditUserForm((f) => ({ ...f, displayName: e.target.value }))}
              placeholder="Display name"
            />
            <Input
              label="Business name"
              value={editUserForm.businessName}
              onChange={(e) => setEditUserForm((f) => ({ ...f, businessName: e.target.value }))}
              placeholder="Company or organization"
            />
            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" variant="ghost" onClick={() => setEditUser(null)}>
                Cancel
              </Button>
              <Button type="submit" loading={editUserSaving}>
                Save
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete user confirm */}
      <Modal
        open={!!deleteUserTarget}
        onClose={() => setDeleteUserTarget(null)}
        title="Delete user"
      >
        {deleteUserTarget && (
          <div className="space-y-4">
            <p className="text-slate-600">
              Permanently delete this user&apos;s profile? Their Firebase Auth account will remain;
              they can sign in again and get a new profile.
            </p>
            <p className="text-sm font-medium text-slate-900">
              {deleteUserTarget.displayName || deleteUserTarget.email || 'Unknown'} ({deleteUserTarget.email})
            </p>
            {deleteUserTarget.uid === user?.uid && (
              <p className="text-amber-700 text-sm font-medium">
                You are about to delete your own profile. You will need to sign in again.
              </p>
            )}
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="ghost" onClick={() => setDeleteUserTarget(null)}>
                Cancel
              </Button>
              <Button
                variant="ghost"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={handleDeleteUser}
                loading={deleteUserLoading}
              >
                Delete
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete project confirm */}
      <Modal
        open={!!deleteProjectTarget}
        onClose={() => setDeleteProjectTarget(null)}
        title="Delete project"
      >
        {deleteProjectTarget && (
          <div className="space-y-4">
            <p className="text-slate-600">
              Permanently delete this project and all its costs, change orders, forecasts, and audit logs?
            </p>
            <p className="text-sm font-medium text-slate-900">{deleteProjectTarget.name}</p>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="ghost" onClick={() => setDeleteProjectTarget(null)}>
                Cancel
              </Button>
              <Button
                variant="ghost"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={handleDeleteProject}
                loading={deleteProjectLoading}
              >
                Delete
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={guideOpen} onClose={() => setGuideOpen(false)} title="Admin Guide">
        <div className="prose prose-slate max-w-none text-sm space-y-4">
          <section>
            <h3 className="font-semibold text-slate-900">Admin access</h3>
            <p>
              App-level admin is determined by <code className="bg-slate-100 px-1 rounded">VITE_ADMIN_UIDS</code> (comma-separated UIDs in env).
              Only those users see this board and the Admin Guide. Firestore list-all access uses the <code className="bg-slate-100 px-1 rounded">config/roles</code> document (create it in Firebase Console with <code className="bg-slate-100 px-1 rounded">adminUids: [&quot;uid&quot;]</code>).
            </p>
          </section>
          <section>
            <h3 className="font-semibold text-slate-900">Users & projects</h3>
            <p>
              This board lists all users and projects when <code className="bg-slate-100 px-1 rounded">config/roles</code> exists and your UID is in <code className="bg-slate-100 px-1 rounded">adminUids</code>. You can edit and delete any user profile or project. Deleting a user removes their Firestore profile (Auth account remains). Deleting a project cascades to costs, change orders, forecasts, and audit logs.
            </p>
          </section>
          <section>
            <h3 className="font-semibold text-slate-900">Security rules</h3>
            <p>
              Firebase rules allow admins (from config/roles) to read, update, and delete all users and all projects. Cost, change order, forecast, and audit log access follow project access; admins can also delete these when managing projects.
            </p>
          </section>
          <section>
            <h3 className="font-semibold text-slate-900">Email & deployment</h3>
            <p>
              Postmark: <code className="bg-slate-100 px-1 rounded">POSTMARK_API_KEY</code>, <code className="bg-slate-100 px-1 rounded">EMAIL_FROM</code>. Deploy with <code className="bg-slate-100 px-1 rounded">npm run deploy</code>; set env vars in Vercel for production.
            </p>
          </section>
        </div>
      </Modal>
    </div>
  )
}
