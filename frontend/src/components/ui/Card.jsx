// path: src/components/ui/Card.jsx
import { cn } from '../../lib/utils'

export const Card = ({ children, className, variant = 'default', ...props }) => {
  const variants = {
    default: 'bg-white dark:bg-dark-800/80 border border-gray-200 dark:border-cyan-500/10 shadow-sm dark:shadow-glow-cyan backdrop-blur-sm dark:backdrop-blur-xl rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-md dark:hover:shadow-glow-cyan',
    glass: 'bg-white dark:bg-dark-800/80 border border-gray-200 dark:border-cyan-500/10 shadow-sm dark:shadow-glow-cyan backdrop-blur-sm dark:backdrop-blur-xl rounded-2xl overflow-hidden animate-fade-in-up',
    gradient: 'bg-white dark:bg-dark-800/80 border border-gray-200 dark:border-magenta-500/10 shadow-sm dark:shadow-glow-magenta backdrop-blur-sm dark:backdrop-blur-xl rounded-2xl overflow-hidden',
    elevated: 'bg-white dark:bg-dark-800 shadow-lg dark:shadow-glow-cyan hover:shadow-xl dark:hover:shadow-glow-cyan transition-all duration-300 border border-gray-200 dark:border-cyan-500/20 rounded-2xl overflow-hidden',
    stat: 'bg-white dark:bg-dark-800/80 border border-gray-200 dark:border-cyan-500/10 shadow-sm dark:shadow-glow-cyan backdrop-blur-sm dark:backdrop-blur-xl rounded-2xl overflow-hidden p-6 hover:shadow-md dark:hover:shadow-glow-cyan hover:border-cyan-500/50 dark:hover:border-cyan-500/50 transition-all duration-300',
  }

  return (
    <div
      className={cn(
        'rounded-2xl overflow-hidden transition-all duration-300',
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export const CardHeader = ({ children, className, ...props }) => {
  return (
    <div className={cn('px-6 py-5 border-b border-gray-200 dark:border-cyan-500/10 bg-gradient-to-r from-gray-50 to-transparent dark:from-cyan-500/5 dark:to-transparent', className)} {...props}>
      {children}
    </div>
  )
}

export const CardContent = ({ children, className, ...props }) => {
  return (
    <div className={cn('px-6 py-5', className)} {...props}>
      {children}
    </div>
  )
}

export const CardTitle = ({ children, className, ...props }) => {
  return (
    <h3 className={cn('text-xl font-bold text-gray-900 dark:text-cyan-400', className)} {...props}>
      {children}
    </h3>
  )
}

export const CardFooter = ({ children, className, ...props }) => {
  return (
    <div
      className={cn('px-6 py-5 border-t border-gray-200/50 dark:border-dark-700/50 bg-gradient-to-r from-gray-50/50 to-transparent dark:from-dark-800/50 dark:to-transparent flex gap-3 justify-end', className)}
      {...props}
    >
      {children}
    </div>
  )
}
