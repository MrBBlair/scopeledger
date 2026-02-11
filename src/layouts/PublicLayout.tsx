import { Outlet } from 'react-router-dom'
import { Footer } from '@/components/ui/Footer'

export function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-app">
      <main className="flex-1 mx-auto w-full max-w-3xl px-4 sm:px-6 py-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
