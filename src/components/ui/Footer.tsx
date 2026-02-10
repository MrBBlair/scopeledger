import { Link } from 'react-router-dom'

export function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white py-6">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <nav className="flex items-center gap-6" aria-label="Footer">
          <Link
            to="/terms"
            className="text-sm text-slate-600 hover:text-brand-600 focus-ring rounded"
          >
            Terms & Conditions
          </Link>
          <Link
            to="/privacy"
            className="text-sm text-slate-600 hover:text-brand-600 focus-ring rounded"
          >
            Privacy Policy
          </Link>
        </nav>
        <p className="text-sm text-slate-500 text-center sm:text-right">
          Powered by{' '}
          <a
            href="https://techephi.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-600 hover:underline focus-ring rounded"
          >
            Techephi
          </a>
        </p>
      </div>
    </footer>
  )
}
