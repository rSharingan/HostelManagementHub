// path: src/components/ui/Card.jsx
import { cn } from '../../lib/utils'

export const Card = ({ children, className, variant = 'default', ...props }) => {
  const variants = {
    default: 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-lg shadow-slate-900/10 dark:shadow-slate-900/20',
    glass: 'glass shadow-2xl',
    gradient: 'bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 border border-slate-200/30 dark:border-slate-700/30 shadow-xl',
    elevated: 'bg-white dark:bg-slate-900 shadow-2xl border-0 hover:shadow-3xl transition-all duration-300',
  }

  return (
    <div
      className={cn(
        'rounded-2xl overflow-hidden card-hover',
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
    <div className={cn('px-6 py-5 border-b border-slate-200/50 dark:border-slate-700/50 bg-gradient-to-r from-slate-50/50 to-transparent dark:from-slate-800/50 dark:to-transparent', className)} {...props}>
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
    <h3 className={cn('text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent', className)} {...props}>
      {children}
    </h3>
  )
}

export const CardFooter = ({ children, className, ...props }) => {
  return (
    <div
      className={cn('px-6 py-5 border-t border-slate-200/50 dark:border-slate-700/50 bg-gradient-to-r from-slate-50/50 to-transparent dark:from-slate-800/50 dark:to-transparent flex gap-3 justify-end', className)}
      {...props}
    >
      {children}
    </div>
  )
}
