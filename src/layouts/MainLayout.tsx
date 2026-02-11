import { useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/Button'
import { Footer } from '@/components/ui/Footer'
import { PostLoginWelcome } from '@/components/PostLoginWelcome'
import { cn } from '@/utils/cn'

const nav = [
  { to: '/app', label: 'Dashboard' },
  { to: '/app/projects', label: 'Projects' },
  { to: '/app/settings', label: 'Settings' },
]

export function MainLayout() {
  const { user, profile, signOut, isAdmin } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [welcomeDismissedThisSession, setWelcomeDismissedThisSession] = useState(false)

  const showWelcome =
    user && profile && profile.welcomeSuppressed !== true && !welcomeDismissedThisSession

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  if (showWelcome) {
    return (
      <PostLoginWelcome onComplete={() => setWelcomeDismissedThisSession(true)} />
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-app">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex h-14 sm:h-16 items-center justify-between gap-4">
            <Link to="/app" className="flex items-center gap-2 shrink-0" aria-label="ScopeLedger home">
              <img src="/logo.png" alt="ScopeLedger" className="h-[9.6rem] w-auto mt-2" />
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1" aria-label="Main">
              {nav.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className={cn(
                    'px-3 py-2 rounded-lg text-sm font-medium transition-colors min-h-0',
                    location.pathname === to || (to !== '/app' && location.pathname.startsWith(to))
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  )}
                >
                  {label}
                </Link>
              ))}
              {isAdmin && (
                <Link
                  to="/app/admin"
                  className={cn(
                    'px-3 py-2 rounded-lg text-sm font-medium transition-colors min-h-0',
                    location.pathname.startsWith('/app/admin')
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  )}
                >
                  Admin
                </Link>
              )}
            </nav>

            <div className="flex items-center gap-2">
              <span className="hidden sm:inline text-sm text-slate-600 truncate max-w-[120px]">
                {profile?.displayName || user?.email}
              </span>
              <Button variant="ghost" size="sm" onClick={handleSignOut} className="!min-h-0">
                Sign out
              </Button>
              <button
                type="button"
                className="md:hidden p-2 rounded-lg hover:bg-slate-100 focus-ring min-h-0"
                aria-expanded={menuOpen}
                aria-label="Toggle menu"
                onClick={() => setMenuOpen((o) => !o)}
              >
                <span className="sr-only">Menu</span>
                <span aria-hidden>☰</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile nav */}
        {menuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3">
            <nav className="flex flex-col gap-1" aria-label="Main mobile">
              {nav.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className={cn(
                    'px-3 py-2.5 rounded-lg text-sm font-medium',
                    location.pathname === to || (to !== '/app' && location.pathname.startsWith(to))
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-slate-600'
                  )}
                  onClick={() => setMenuOpen(false)}
                >
                  {label}
                </Link>
              ))}
              {isAdmin && (
                <Link
                  to="/app/admin"
                  className="px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600"
                  onClick={() => setMenuOpen(false)}
                >
                  Admin
                </Link>
              )}
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1 mx-auto w-full max-w-6xl px-4 sm:px-6 py-6">
        <Outlet />
      </main>

      <Footer />
    </div>
  )
}
