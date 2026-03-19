// path: src/components/common/PageHeader.jsx
import { Breadcrumbs } from '../layout/Breadcrumbs'
import { cn } from '../../lib/utils'

export const PageHeader = ({
  title,
  description,
  breadcrumbs = [],
  action,
  className,
}) => {
  return (
    <div className={cn('mb-8', className)}>
      {breadcrumbs.length > 0 && (
        <Breadcrumbs items={breadcrumbs} className="mb-4" />
      )}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
            {title}
          </h1>
          {description && (
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              {description}
            </p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>
    </div>
  )
}
