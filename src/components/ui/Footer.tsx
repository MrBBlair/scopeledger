import { Link } from 'react-router-dom'
import { PoweredByTechephiEmblem } from '@/components/brand/PoweredByTechephiEmblem'

export function Footer() {
  return (
    <footer className="mt-auto w-full border-t border-slate-200 bg-white h-[1in] min-h-[1in] flex items-center px-4 sm:px-6">
      <div className="mx-auto flex w-full max-w-6xl flex-nowrap items-center justify-between gap-4">
        <nav className="flex items-center gap-4 text-xs text-slate-600 shrink-0" aria-label="Footer">
          <Link
            to="/terms"
            className="whitespace-nowrap hover:text-brand-600 focus-ring rounded transition-colors"
          >
            Terms and Conditions
          </Link>
          <Link
            to="/privacy"
            className="whitespace-nowrap hover:text-brand-600 focus-ring rounded transition-colors"
          >
            Privacy Policy
          </Link>
        </nav>
        <PoweredByTechephiEmblem />
      </div>
    </footer>
  )
}
