// path: src/components/ui/Dropdown.jsx
import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '../../lib/utils'

export const Dropdown = ({ trigger, children, align = 'left' }) => {
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const alignClass = align === 'right' ? 'right-0' : 'left-0'

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <div onClick={() => setOpen(!open)}>{trigger}</div>
      {open && (
        <div
          className={cn(
            'absolute top-full mt-1 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-50',
            alignClass,
          )}
        >
          {children}
        </div>
      )}
    </div>
  )
}

export const DropdownItem = ({ children, onClick, className, ...props }) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        'px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
