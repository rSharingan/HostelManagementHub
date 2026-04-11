// path: src/components/ui/Skeleton.jsx
import { cn } from '../../lib/utils'

export const Skeleton = ({ className, ...props }) => {
  return (
    <div
      className={cn('bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-dark-700 dark:via-dark-600 dark:to-dark-700 rounded animate-shimmer', className)}
      {...props}
    />
  )
}

export const SkeletonText = ({ lines = 1, className, ...props }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            'h-4 w-full rounded',
            i === lines - 1 && 'w-3/4',
            className,
          )}
          {...props}
        />
      ))}
    </div>
  )
}
