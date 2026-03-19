// path: src/components/ui/Dialog.jsx
import { useState } from 'react'
import { cn } from '../../lib/utils'
import { X } from 'lucide-react'

export const Dialog = ({ open, onOpenChange, children }) => {
  if (!open) return null

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={() => onOpenChange(false)}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg max-w-md w-full">
          {children}
        </div>
      </div>
    </>
  )
}

export const DialogHeader = ({ children, className, ...props }) => {
  return (
    <div className={cn('px-6 py-4 border-b border-slate-200 dark:border-slate-800', className)} {...props}>
      {children}
    </div>
  )
}

export const DialogTitle = ({ children, className, ...props }) => {
  return (
    <h2 className={cn('text-lg font-semibold text-slate-900 dark:text-slate-50', className)} {...props}>
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
      className={cn('px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex gap-3 justify-end', className)}
      {...props}
    >
      {children}
    </div>
  )
}
