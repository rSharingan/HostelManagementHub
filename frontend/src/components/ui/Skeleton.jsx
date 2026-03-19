// path: src/components/ui/Skeleton.jsx
import { cn } from '../../lib/utils'

export const Skeleton = ({ className, ...props }) => {
  return (
    <div
      className={cn('animate-skeleton bg-slate-300 dark:bg-slate-700 rounded', className)}
      {...props}
    />
  )
}

export const SkeletonText = ({ lines = 1, className, ...props }) => {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            'h-4 w-full',
            i === lines - 1 && 'w-3/4',
            className,
          )}
          {...props}
        />
      ))}
    </div>
  )
}
