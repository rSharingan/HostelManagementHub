// path: src/components/common/EmptyState.jsx
import { AlertCircle } from 'lucide-react'
import { cn } from '../../lib/utils'

export const EmptyState = ({
  icon: Icon = AlertCircle,
  title,
  description,
  action,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-4 text-center animate-fade-in-up',
        className,
      )}
    >
      <div className="w-14 h-14 bg-gradient-to-br from-cyan-100 dark:from-cyan-500/20 to-gray-100 dark:to-magenta-500/20 border border-cyan-300 dark:border-cyan-500/30 rounded-full flex items-center justify-center mb-4">
        <Icon size={28} className="text-cyan-600 dark:text-cyan-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-cyan-400 mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-gray-600 dark:text-dark-400 mb-6 max-w-sm">
          {description}
        </p>
      )}
      {action && <div>{action}</div>}
    </div>
  )
}
