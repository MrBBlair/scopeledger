import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Footer } from '@/components/ui/Footer'
import { HomeFeatureTour } from '@/components/HomeFeatureTour'
import { cn } from '@/utils/cn'

const btn =
  'inline-flex items-center justify-center font-medium rounded-xl transition-colors focus-ring min-h-touch px-6 py-3 text-lg'

export function Home() {
  const { user, loading } = useAuth()
  const [showTour, setShowTour] = useState(false)

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

  if (showTour) {
    return <HomeFeatureTour onClose={() => setShowTour(false)} />
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-app">
      <img
        src="/LogoICON.png"
        alt=""
        aria-hidden
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(48rem,85vw)] h-auto opacity-[0.15] pointer-events-none"
      />
      <main className="relative flex-1 flex flex-col items-center justify-center px-4 py-12 text-center">
        <img src="/logo.png" alt="ScopeLedger" className="h-[21.375rem] sm:h-[23.5rem] w-auto mt-6 mb-6" />
        <h1 className="sr-only">ScopeLedger</h1>
        <p className="font-display text-xl sm:text-2xl text-slate-700 max-w-xl mb-2 tracking-tight">
          Manage project budgets, costs, change orders, and forecasts
        </p>
        <p className="font-sans text-base sm:text-lg text-slate-500 max-w-lg mb-10 tracking-wide">
          Clear insights in one place.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <button
            type="button"
            onClick={() => setShowTour(true)}
            className={cn(btn, 'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800')}
          >
            Get Started
          </button>
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
