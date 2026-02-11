import { Outlet } from 'react-router-dom'
import { Footer } from '@/components/ui/Footer'

export function OnboardingLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-app relative">
      <img src="/logo.png" alt="ScopeLedger" className="absolute top-4 left-1/2 -translate-x-1/2 h-[40rem] w-auto z-10" />
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
