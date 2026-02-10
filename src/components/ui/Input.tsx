import { forwardRef, useId, useState } from 'react'
import { cn } from '@/utils/cn'
import { scrollInputIntoView } from '@/utils/scrollIntoView'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  onScrollIntoView?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      hint,
      type: rawType = 'text',
      onScrollIntoView = true,
      id: rawId,
      ...props
    },
    ref
  ) => {
    const [type, setType] = useState(rawType)
    const isPassword = rawType === 'password'
    const generatedId = useId()
    const id = rawId ?? `input-${generatedId.replace(/:/g, '')}`

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      if (onScrollIntoView) scrollInputIntoView(e.currentTarget)
      props.onFocus?.(e)
    }

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={id}
            type={type}
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
            className={cn(
              'w-full rounded-xl border bg-white px-4 py-2.5 text-base text-slate-800 placeholder:text-slate-400 focus-ring min-h-touch',
              error ? 'border-red-500' : 'border-slate-300',
              isPassword && 'pr-12',
              className
            )}
            onFocus={handleFocus}
            autoComplete={props.autoComplete ?? (isPassword ? 'current-password' : 'on')}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              aria-label={type === 'password' ? 'Show password' : 'Hide password'}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 focus-ring rounded px-2 py-1 text-sm min-h-0"
              onClick={() => setType((t) => (t === 'password' ? 'text' : 'password'))}
            >
              {type === 'password' ? 'Show' : 'Hide'}
            </button>
          )}
        </div>
        {error && (
          <p id={`${id}-error`} className="mt-1 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${id}-hint`} className="mt-1 text-sm text-slate-500">
            {hint}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'
