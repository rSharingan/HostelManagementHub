// path: src/components/layout/Breadcrumbs.jsx
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { cn } from '../../lib/utils'

export const Breadcrumbs = ({ items = [], className }) => {
  return (
    <nav className={cn('flex items-center gap-1 text-sm', className)}>
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-1">
          {index > 0 && <ChevronRight size={16} className="text-slate-400" />}
          {item.href ? (
            <Link
              to={item.href}
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-slate-600 dark:text-slate-400">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  )
}
