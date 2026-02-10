import { Outlet } from 'react-router-dom'
import { Footer } from '@/components/ui/Footer'

export function OnboardingLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-brand-50">
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
