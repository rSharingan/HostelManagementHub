// path: src/components/ui/Card.jsx
import { cn } from '../../lib/utils'

export const Card = ({ children, className, ...props }) => {
  return (
    <div
      className={cn(
        'bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800',
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
    <div className={cn('px-6 py-4 border-b border-slate-200 dark:border-slate-800', className)} {...props}>
      {children}
    </div>
  )
}

export const CardContent = ({ children, className, ...props }) => {
  return (
    <div className={cn('px-6 py-4', className)} {...props}>
      {children}
    </div>
  )
}

export const CardFooter = ({ children, className, ...props }) => {
  return (
    <div
      className={cn('px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex gap-3 justify-end', className)}
      {...props}
    >
      {children}
    </div>
  )
}
