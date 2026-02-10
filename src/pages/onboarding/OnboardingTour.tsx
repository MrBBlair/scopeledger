import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useOnboarding } from '@/context/OnboardingContext'
import { setProfile } from '@/services/firestore'
import { Button } from '@/components/ui/Button'

export function OnboardingTour() {
  const { user, refreshProfile } = useAuth()
  const { prev, progress, totalSteps } = useOnboarding()
  const navigate = useNavigate()

  const handleFinish = async () => {
    if (!user) return
    await setProfile(user.uid, { onboardingCompleted: true })
    await refreshProfile()
    navigate('/app', { replace: true })
  }

  return (
    <div className="w-full max-w-lg text-center">
      <div className="mb-6">
        <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full bg-brand-500 transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-xs text-slate-500 mt-1">Step {totalSteps} of {totalSteps}</p>
      </div>

      <h2 className="font-display text-xl font-semibold text-slate-900 mb-4">You&apos;re all set</h2>
      <div className="text-left bg-slate-50 rounded-2xl p-6 mb-8 space-y-4">
        <p className="text-slate-700">
          <strong>Projects</strong> — Create projects, set baseline budgets, and track overhead.
        </p>
        <p className="text-slate-700">
          <strong>Costs</strong> — Log costs by category and vendor. Automatic deductions supported.
        </p>
        <p className="text-slate-700">
          <strong>Change orders</strong> — Add positive or negative changes with approval flow.
        </p>
        <p className="text-slate-700">
          <strong>Forecasting</strong> — Cost-to-date, burn rate, remaining budget. AI-assisted insights available.
        </p>
        <p className="text-slate-700">
          <strong>User Guide</strong> — Find step-by-step help in Settings.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button size="lg" onClick={handleFinish}>
          Go to app
        </Button>
        <Button variant="ghost" onClick={prev}>Previous</Button>
      </div>
    </div>
  )
}
