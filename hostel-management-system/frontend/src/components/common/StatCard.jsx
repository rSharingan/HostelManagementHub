// path: src/components/common/StatCard.jsx
import { Card, CardContent } from '../ui/Card'
import { cn } from '../../lib/utils'

export const StatCard = ({
  icon: Icon,
  label,
  value,
  trend,
  trendUp,
  className,
}) => {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
              {label}
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">
              {value}
            </p>
            {trend && (
              <p
                className={cn(
                  'text-xs mt-2 font-medium',
                  trendUp
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400',
                )}
              >
                {trend}
              </p>
            )}
          </div>
          {Icon && (
            <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Icon size={24} className="text-blue-600 dark:text-blue-400" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
