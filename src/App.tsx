import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { ProtectedRoute } from '@/auth/ProtectedRoute'
import { MainLayout } from '@/layouts/MainLayout'
import { PublicLayout } from '@/layouts/PublicLayout'
import { Home } from '@/pages/Home'
import { Login } from '@/pages/Login'
import { Terms } from '@/pages/Terms'
import { Privacy } from '@/pages/Privacy'
import { Unsubscribe } from '@/pages/Unsubscribe'
import { Dashboard } from '@/pages/app/Dashboard'
import { ProjectsList } from '@/pages/app/ProjectsList'
import { ProjectForm } from '@/pages/app/ProjectForm'
import { ProjectDetail } from '@/pages/app/ProjectDetail'
import { Settings } from '@/pages/app/Settings'
import { Admin } from '@/pages/app/Admin'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route element={<PublicLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/unsubscribe" element={<Unsubscribe />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          </Route>
          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
            path="/app"
          >
            <Route index element={<Dashboard />} />
            <Route path="projects" element={<ProjectsList />} />
            <Route path="projects/new" element={<ProjectForm />} />
            <Route path="projects/:slug" element={<ProjectDetail />} />
            <Route path="projects/:slug/edit" element={<ProjectForm />} />
            <Route path="settings" element={<Settings />} />
            <Route
              path="admin"
              element={
                <ProtectedRoute adminOnly>
                  <Admin />
                </ProtectedRoute>
              }
            />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
