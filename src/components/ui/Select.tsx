import { forwardRef, useId } from 'react'
import { cn } from '@/utils/cn'
import { scrollInputIntoView } from '@/utils/scrollIntoView'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
  onScrollIntoView?: boolean
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      label,
      error,
      options,
      onScrollIntoView = true,
      id: rawId,
      onFocus,
      ...props
    },
    ref
  ) => {
    const generatedId = useId()
    const id = rawId ?? `select-${generatedId.replace(/:/g, '')}`

    const handleFocus = (e: React.FocusEvent<HTMLSelectElement>) => {
      if (onScrollIntoView) scrollInputIntoView(e.currentTarget)
      onFocus?.(e)
    }

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={id}
          aria-invalid={!!error}
          className={cn(
            'w-full rounded-xl border bg-white px-4 py-2.5 text-base text-slate-800 focus-ring min-h-touch',
            error ? 'border-red-500' : 'border-slate-300',
            className
          )}
          onFocus={handleFocus}
          {...props}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="mt-1 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>
    )
  }
)
Select.displayName = 'Select'
