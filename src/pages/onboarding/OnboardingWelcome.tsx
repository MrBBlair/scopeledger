import { Link } from 'react-router-dom'
import { useOnboarding } from '@/context/OnboardingContext'
import { Button } from '@/components/ui/Button'

export function OnboardingWelcome() {
  const { next, skip, progress, totalSteps } = useOnboarding()

  return (
    <div className="w-full max-w-lg text-center">
      <div className="mb-6">
        <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
          <div
            className="h-full bg-brand-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Step 1 of {totalSteps}
        </p>
      </div>

      <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 mb-4">
        Welcome to ScopeLedger
      </h1>
      <p className="text-slate-600 mb-8">
        Track project budgets, costs, and change orders. Get AI-powered insights and forecasts—all in one place.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button size="lg" onClick={next}>
          Get Started
        </Button>
        <Button variant="ghost" size="lg" onClick={skip}>
          Skip
        </Button>
      </div>

      <p className="mt-6 text-sm text-slate-500">
        Already have an account? <Link to="/login" className="text-brand-600 hover:underline focus-ring rounded">Sign in</Link>
      </p>
    </div>
  )
}
