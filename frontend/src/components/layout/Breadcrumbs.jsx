// path: src/components/layout/Breadcrumbs.jsx
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { cn } from '../../lib/utils'

export const Breadcrumbs = ({ items = [], className }) => {
  return (
    <nav className={cn('flex items-center gap-2 text-sm animate-fade-in-up', className)}>
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          {index > 0 && <ChevronRight size={16} className="text-gray-400 dark:text-dark-500" />}
          {item.href ? (
            <Link
              to={item.href}
              className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-gray-600 dark:text-dark-400">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  )
}
