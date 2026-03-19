// path: src/components/ui/Tabs.jsx
import { useState } from 'react'
import { cn } from '../../lib/utils'

export const Tabs = ({ defaultValue, children }) => {
  const [activeTab, setActiveTab] = useState(defaultValue)

  return (
    <div>
      {children({ activeTab, setActiveTab })}
    </div>
  )
}

export const TabsList = ({ children, className, ...props }) => {
  return (
    <div
      className={cn(
        'flex gap-1 border-b border-slate-200 dark:border-slate-800',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export const TabsTrigger = ({ value, active, onClick, children, ...props }) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-4 py-2 text-sm font-medium border-b-2 transition-all',
        active
          ? 'border-blue-600 text-blue-600 dark:text-blue-400'
          : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200',
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export const TabsContent = ({ value, active, children, ...props }) => {
  if (!active) return null
  return <div {...props}>{children}</div>
}
