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
        'flex flex-col items-center justify-center py-12 px-4 text-center',
        className,
      )}
    >
      <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
        <Icon size={24} className="text-slate-600 dark:text-slate-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-slate-600 dark:text-slate-400 mb-4 max-w-sm">
          {description}
        </p>
      )}
      {action && <div>{action}</div>}
    </div>
  )
}
