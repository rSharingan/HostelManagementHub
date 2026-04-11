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
    <div className={cn('mb-8 animate-fade-in-up', className)}>
      {breadcrumbs.length > 0 && (
        <Breadcrumbs items={breadcrumbs} className="mb-4" />
      )}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-cyan-400">
            {title}
          </h1>
          {description && (
            <p className="text-gray-600 dark:text-dark-400 mt-2 text-lg">
              {description}
            </p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>
    </div>
  )
}
