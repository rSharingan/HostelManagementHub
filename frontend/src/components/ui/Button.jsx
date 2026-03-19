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
    'font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl'

  const variants = {
    primary: 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white hover:shadow-blue-500/25',
    secondary: 'bg-gradient-to-r from-slate-100 to-slate-200 hover:from-slate-200 hover:to-slate-300 dark:from-slate-700 dark:to-slate-600 dark:hover:from-slate-600 dark:hover:to-slate-500 text-slate-900 dark:text-slate-100 hover:shadow-slate-500/25',
    success: 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white hover:shadow-green-500/25',
    warning: 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white hover:shadow-amber-500/25',
    danger: 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white hover:shadow-red-500/25',
    outline: 'border-2 border-blue-500 text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-900/20 hover:shadow-blue-500/25',
    ghost: 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 hover:shadow-slate-500/25',
    glass: 'glass text-slate-800 dark:text-slate-200 hover:bg-white/20 dark:hover:bg-black/20 backdrop-blur-md border border-white/20 dark:border-white/10',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
    xl: 'px-8 py-4 text-lg',
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
