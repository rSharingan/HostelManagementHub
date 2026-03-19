// path: src/components/ui/Button.jsx
import { cn } from '../../lib/utils'

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className,
  ...props
}) => {
  const baseClasses =
    'font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2'

  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-slate-200 text-slate-900 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-50 dark:hover:bg-slate-600',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    outline: 'border border-slate-300 text-slate-900 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-50 dark:hover:bg-slate-800',
    ghost: 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  }

  return (
    <button
      className={cn(baseClasses, variants[variant], sizes[size], className)}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}
