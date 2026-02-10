import { forwardRef, useId } from 'react'
import { cn } from '@/utils/cn'
import { scrollInputIntoView } from '@/utils/scrollIntoView'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  onScrollIntoView?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      label,
      error,
      onScrollIntoView = true,
      id: rawId,
      onFocus,
      ...props
    },
    ref
  ) => {
    const generatedId = useId()
    const id = rawId ?? `textarea-${generatedId.replace(/:/g, '')}`

    const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
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
        <textarea
          ref={ref}
          id={id}
          aria-invalid={!!error}
          className={cn(
            'w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-base text-slate-800 placeholder:text-slate-400 focus-ring min-h-[88px] resize-y',
            error && 'border-red-500',
            className
          )}
          onFocus={handleFocus}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'
