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
        'flex gap-2 border-b border-gray-200 dark:border-cyan-500/10',
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
        'px-4 py-3 text-sm font-medium border-b-2 transition-all duration-300',
        active
          ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
          : 'border-transparent text-gray-600 dark:text-dark-400 hover:text-gray-900 dark:hover:text-cyan-400 hover:border-gray-300 dark:hover:border-cyan-500/50',
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export const TabsContent = ({ value, active, children, ...props }) => {
  if (!active) return null
  return <div className="animate-fade-in-up" {...props}>{children}</div>
}
