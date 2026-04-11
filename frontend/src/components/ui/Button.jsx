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
    'font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 transform hover:scale-105 active:scale-95'

  const variants = {
    primary: 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white dark:text-dark-900 hover:shadow-lg dark:hover:shadow-glow-cyan',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-300 dark:bg-dark-700 dark:hover:bg-dark-600 dark:text-dark-50 dark:border-dark-600 dark:hover:border-cyan-500/50',
    success: 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white hover:shadow-green-500/25 shadow-lg',
    warning: 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white hover:shadow-amber-500/25 shadow-lg',
    danger: 'bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white hover:shadow-red-500/25 shadow-lg',
    outline: 'border-2 border-cyan-500 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-500/10 hover:shadow-glow-cyan',
    ghost: 'text-gray-700 hover:bg-gray-100 dark:text-dark-100 dark:hover:bg-dark-800 dark:hover:text-cyan-400',
    magenta: 'bg-gradient-to-r from-magenta-500 to-pink-600 hover:from-magenta-600 hover:to-pink-500 text-white dark:text-dark-900 hover:shadow-lg dark:hover:shadow-glow-magenta',
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
