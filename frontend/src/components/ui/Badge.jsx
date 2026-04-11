// path: src/components/ui/Badge.jsx
import { cn } from '../../lib/utils'

export const Badge = ({ children, variant = 'default', className, ...props }) => {
  const variants = {
    default: 'inline-flex items-center px-3 py-1 bg-cyan-50 dark:bg-dark-800 text-cyan-700 dark:text-cyan-400 border border-cyan-300 dark:border-cyan-500/30 text-xs font-medium rounded-full',
    primary: 'inline-flex items-center px-3 py-1 bg-cyan-50 dark:bg-dark-800 text-cyan-700 dark:text-cyan-400 border border-cyan-300 dark:border-cyan-500/30 text-xs font-medium rounded-full',
    success: 'inline-flex items-center px-3 py-1 bg-green-50 dark:bg-dark-800 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-500/30 text-xs font-medium rounded-full',
    warning: 'inline-flex items-center px-3 py-1 bg-yellow-50 dark:bg-dark-800 text-yellow-700 dark:text-yellow-400 border border-yellow-300 dark:border-yellow-500/30 text-xs font-medium rounded-full',
    danger: 'inline-flex items-center px-3 py-1 bg-red-50 dark:bg-dark-800 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-500/30 text-xs font-medium rounded-full',
    magenta: 'inline-flex items-center px-3 py-1 bg-magenta-50 dark:bg-dark-800 text-magenta-700 dark:text-magenta-400 border border-magenta-300 dark:border-magenta-500/30 text-xs font-medium rounded-full',
  }

  return (
    <span
      className={cn(
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
}
