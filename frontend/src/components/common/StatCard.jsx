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
  color = 'cyan',
}) => {
  const colorVariants = {
    cyan: {
      bg: 'bg-gradient-to-br from-cyan-500 to-blue-600',
      iconBg: 'bg-cyan-500/10 border border-cyan-500/30',
      iconColor: 'text-cyan-400',
      trendColor: 'text-cyan-400',
      glow: 'animate-glow-cyan',
    },
    magenta: {
      bg: 'bg-gradient-to-br from-magenta-500 to-pink-600',
      iconBg: 'bg-magenta-500/10 border border-magenta-500/30',
      iconColor: 'text-magenta-400',
      trendColor: 'text-magenta-400',
      glow: 'animate-glow-magenta',
    },
    green: {
      bg: 'bg-gradient-to-br from-green-500 to-emerald-600',
      iconBg: 'bg-green-500/10 border border-green-500/30',
      iconColor: 'text-green-400',
      trendColor: 'text-green-400',
      glow: 'animate-glow',
    },
    purple: {
      bg: 'bg-gradient-to-br from-violet-500 to-purple-600',
      iconBg: 'bg-violet-500/10 border border-violet-500/30',
      iconColor: 'text-violet-400',
      trendColor: 'text-violet-400',
      glow: 'animate-pulse-scale',
    },
    orange: {
      bg: 'bg-gradient-to-br from-orange-500 to-amber-600',
      iconBg: 'bg-orange-500/10 border border-orange-500/30',
      iconColor: 'text-orange-400',
      trendColor: 'text-orange-400',
      glow: 'animate-float',
    },
    red: {
      bg: 'bg-gradient-to-br from-red-500 to-rose-600',
      iconBg: 'bg-red-500/10 border border-red-500/30',
      iconColor: 'text-red-400',
      trendColor: 'text-red-400',
      glow: 'animate-glow',
    },
  }

  const colors = colorVariants[color] || colorVariants.cyan

  return (
    <Card className={cn('overflow-hidden animate-fade-in-up', className)} variant="stat">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 dark:text-dark-400 mb-2 uppercase tracking-wide">
              {label}
            </p>
            <p className="text-3xl font-bold text-gray-900 dark:text-cyan-400 mb-2">
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
            <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center', colors.iconBg, colors.glow)}>
              <Icon size={28} className={colors.iconColor} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
