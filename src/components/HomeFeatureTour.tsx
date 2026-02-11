import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Footer } from '@/components/ui/Footer'

const STEPS = [
  {
    title: 'Welcome to ScopeLedger',
    body: 'Manage project budgets, costs, change orders, and forecasts—with clear insights in one place.',
  },
  {
    title: 'Projects & budgets',
    body: 'Create projects, set baseline budgets, and track overhead. See all your work from the dashboard.',
  },
  {
    title: 'Costs & change orders',
    body: 'Log costs by category and vendor. Add positive or negative change orders with a simple approval flow.',
  },
  {
    title: 'Forecasting & insights',
    body: 'Cost-to-date, burn rate, and remaining budget update automatically. Get project insight and save snapshots.',
  },
  {
    title: "You're ready",
    body: 'Sign in to create your first project and start tracking. Find step-by-step help in Settings.',
  },
] as const

const TOTAL = STEPS.length

interface HomeFeatureTourProps {
  onClose: () => void
}

export function HomeFeatureTour({ onClose }: HomeFeatureTourProps) {
  const [step, setStep] = useState(1)
  const current = STEPS[step - 1]
  const progress = (step / TOTAL) * 100

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-app">
      <img src="/logo.png" alt="ScopeLedger" className="absolute top-4 left-1/2 -translate-x-1/2 h-[40rem] w-auto z-10" />
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg">
          <div className="mb-6">
            <div
              className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden"
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full bg-brand-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Step {step} of {TOTAL}
            </p>
          </div>

          <div className="text-center">
            <h2 className="font-display text-xl sm:text-2xl font-semibold text-slate-900 mb-4">
              {current.title}
            </h2>
            <p className="text-slate-600 mb-8 leading-relaxed">
              {current.body}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {step < TOTAL ? (
                <>
                  <Button size="lg" onClick={() => setStep(step + 1)}>
                    Next
                  </Button>
                  {step > 1 && (
                    <Button variant="ghost" size="lg" onClick={() => setStep(step - 1)}>
                      Back
                    </Button>
                  )}
                </>
              ) : (
                <Button size="lg" onClick={onClose}>
                  Close
                </Button>
              )}
            </div>
            <p className="mt-6">
              <button
                type="button"
                onClick={onClose}
                className="text-sm text-slate-500 hover:text-slate-700 underline focus-ring rounded"
              >
                Skip tour
              </button>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
