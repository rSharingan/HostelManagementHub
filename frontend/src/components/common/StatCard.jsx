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
  color = 'blue',
}) => {
  const colorVariants = {
    blue: {
      bg: 'bg-gradient-to-br from-blue-500 to-indigo-600',
      iconBg: 'bg-blue-100 dark:bg-blue-900/30',
      iconColor: 'text-blue-600 dark:text-blue-400',
      trendColor: 'text-blue-600 dark:text-blue-400',
    },
    green: {
      bg: 'bg-gradient-to-br from-green-500 to-emerald-600',
      iconBg: 'bg-green-100 dark:bg-green-900/30',
      iconColor: 'text-green-600 dark:text-green-400',
      trendColor: 'text-green-600 dark:text-green-400',
    },
    purple: {
      bg: 'bg-gradient-to-br from-purple-500 to-violet-600',
      iconBg: 'bg-purple-100 dark:bg-purple-900/30',
      iconColor: 'text-purple-600 dark:text-purple-400',
      trendColor: 'text-purple-600 dark:text-purple-400',
    },
    orange: {
      bg: 'bg-gradient-to-br from-orange-500 to-amber-600',
      iconBg: 'bg-orange-100 dark:bg-orange-900/30',
      iconColor: 'text-orange-600 dark:text-orange-400',
      trendColor: 'text-orange-600 dark:text-orange-400',
    },
    red: {
      bg: 'bg-gradient-to-br from-red-500 to-rose-600',
      iconBg: 'bg-red-100 dark:bg-red-900/30',
      iconColor: 'text-red-600 dark:text-red-400',
      trendColor: 'text-red-600 dark:text-red-400',
    },
  }

  const colors = colorVariants[color] || colorVariants.blue

  return (
    <Card className={cn('overflow-hidden hover-lift animate-fade-in-up', className)} variant="gradient">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wide">
              {label}
            </p>
            <p className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent mb-1">
              {value}
            </p>
            {trend && (
              <div className={cn('flex items-center gap-1 text-sm font-semibold', colors.trendColor)}>
                {trendUp ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 01-1.414-1.414L9 14.586V3a1 1 0 012 0v11.586l3.293-3.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
                <span>{trend}</span>
              </div>
            )}
          </div>
          {Icon && (
            <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg animate-pulse-glow', colors.iconBg)}>
              <Icon size={28} className={colors.iconColor} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
