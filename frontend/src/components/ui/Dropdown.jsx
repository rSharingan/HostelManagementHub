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
            'absolute top-full mt-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-cyan-500/20 rounded-lg shadow-lg dark:shadow-glow-cyan py-1 z-50 min-w-48',
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
        'px-4 py-2 text-sm text-gray-700 dark:text-dark-300 hover:bg-gray-100 dark:hover:bg-cyan-500/10 hover:text-gray-900 dark:hover:text-cyan-400 cursor-pointer transition-colors duration-200',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
