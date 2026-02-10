import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

const STEPS = 4

interface OnboardingContextValue {
  step: number
  setStep: (n: number) => void
  next: () => void
  prev: () => void
  totalSteps: number
  progress: number
  skip: () => void
}

const ctx = createContext<OnboardingContextValue | null>(null)

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [step, setStep] = useState(1)

  const next = useCallback(() => {
    setStep((s) => Math.min(s + 1, STEPS))
  }, [])
  const prev = useCallback(() => {
    setStep((s) => Math.max(s - 1, 1))
  }, [])
  const skip = useCallback(() => setStep(STEPS), [])
  const progress = (step / STEPS) * 100

  const value: OnboardingContextValue = {
    step,
    setStep,
    next,
    prev,
    totalSteps: STEPS,
    progress,
    skip,
  }

  return <ctx.Provider value={value}>{children}</ctx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useOnboarding(): OnboardingContextValue {
  const c = useContext(ctx)
  if (!c) throw new Error('useOnboarding must be used within OnboardingProvider')
  return c
}
