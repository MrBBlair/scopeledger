import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Footer } from '@/components/ui/Footer'
import { cn } from '@/utils/cn'

const btn =
  'inline-flex items-center justify-center font-medium rounded-xl transition-colors focus-ring min-h-touch px-6 py-3 text-lg'

export function Home() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-brand-500 border-t-transparent" aria-hidden />
      </div>
    )
  }

  if (user) {
    return <Navigate to="/app" replace />
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-brand-50">
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 text-center">
        <img src="/logo.jpeg" alt="ScopeLedger" className="h-20 sm:h-24 w-auto mb-6" />
        <h1 className="sr-only">ScopeLedger</h1>
        <p className="text-lg text-slate-600 max-w-xl mb-8">
          Manage project budgets, costs, change orders, and forecasts—with AI-powered insights.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link
            to="/onboarding"
            className={cn(btn, 'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800')}
          >
            Get Started
          </Link>
          <Link
            to="/login"
            className={cn(btn, 'bg-slate-200 text-slate-800 hover:bg-slate-300 active:bg-slate-400')}
          >
            Sign in
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  )
}
