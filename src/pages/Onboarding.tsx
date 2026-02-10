import { useOnboarding } from '@/context/OnboardingContext'
import { OnboardingWelcome } from './onboarding/OnboardingWelcome'
import { OnboardingLogin } from './onboarding/OnboardingLogin'
import { OnboardingProfile } from './onboarding/OnboardingProfile'
import { OnboardingTour } from './onboarding/OnboardingTour'

export function Onboarding() {
  const { step } = useOnboarding()

  switch (step) {
    case 1:
      return <OnboardingWelcome />
    case 2:
      return <OnboardingLogin />
    case 3:
      return <OnboardingProfile />
    case 4:
      return <OnboardingTour />
    default:
      return <OnboardingWelcome />
  }
}
