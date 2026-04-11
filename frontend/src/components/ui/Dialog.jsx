// path: src/components/ui/Dialog.jsx
import { useState } from 'react'
import { cn } from '../../lib/utils'
import { X } from 'lucide-react'

export const Dialog = ({ open, onOpenChange, children }) => {
  if (!open) return null

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-dark-800/80 border border-gray-200 dark:border-cyan-500/20 max-w-md w-full shadow-lg dark:shadow-glow-cyan rounded-2xl overflow-hidden backdrop-blur-sm dark:backdrop-blur-xl">
          {children}
        </div>
      </div>
    </>
  )
}

export const DialogHeader = ({ children, className, ...props }) => {
  return (
    <div className={cn('px-6 py-4 border-b border-gray-200 dark:border-cyan-500/10 bg-gradient-to-r from-gray-50 dark:from-cyan-500/5 to-transparent', className)} {...props}>
      {children}
    </div>
  )
}

export const DialogTitle = ({ children, className, ...props }) => {
  return (
    <h2 className={cn('text-lg font-semibold text-gray-900 dark:text-cyan-400', className)} {...props}>
      {children}
    </h2>
  )
}

export const DialogContent = ({ children, className, ...props }) => {
  return (
    <div className={cn('px-6 py-4', className)} {...props}>
      {children}
    </div>
  )
}

export const DialogFooter = ({ children, className, ...props }) => {
  return (
    <div
      className={cn('px-6 py-4 border-t border-gray-200 dark:border-dark-800 flex gap-3 justify-end', className)}
      {...props}
    >
      {children}
    </div>
  )
}
