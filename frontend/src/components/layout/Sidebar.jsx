// path: src/components/layout/Sidebar.jsx
import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, LogOut, Settings, BarChart3, Users, Home, DollarSign, Wrench, ClipboardList } from 'lucide-react'
import { useAuth } from '../../features/auth/hooks'
import { ROLES } from '../../lib/constants'
import { cn } from '../../lib/utils'

const navigationItems = [
  { label: 'Dashboard', icon: Home, href: '/dashboard', roles: [ROLES.ADMIN, ROLES.WARDEN, ROLES.CARETAKER, ROLES.STUDENT] },
  { label: 'Students', icon: Users, href: '/students', roles: [ROLES.ADMIN, ROLES.WARDEN] },
  { label: 'Rooms', icon: ClipboardList, href: '/rooms', roles: [ROLES.ADMIN, ROLES.WARDEN, ROLES.STUDENT] },
  { label: 'Allocations', icon: DollarSign, href: '/allocations', roles: [ROLES.ADMIN, ROLES.WARDEN] },
  { label: 'Fees', icon: DollarSign, href: '/fees/invoices', roles: [ROLES.ADMIN] },
  { label: 'Staff', icon: Users, href: '/staff', roles: [ROLES.ADMIN] },
  { label: 'Maintenance', icon: Wrench, href: '/maintenance', roles: [ROLES.ADMIN, ROLES.WARDEN, ROLES.CARETAKER] },
  { label: 'Reports', icon: BarChart3, href: '/reports/occupancy', roles: [ROLES.ADMIN, ROLES.WARDEN] },
  { label: 'Settings', icon: Settings, href: '/settings/profile', roles: [ROLES.ADMIN, ROLES.WARDEN, ROLES.CARETAKER, ROLES.STUDENT] },
]

export const Sidebar = ({ open, onClose, dark, onThemeToggle }) => {
  const location = useLocation()
  const { user, logout } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const visibleItems = navigationItems.filter((item) => item.roles.includes(user?.role))

  const isActive = (href) => location.pathname.startsWith(href)

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={cn(
          'fixed left-0 top-0 h-screen w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800',
          'transform transition-transform duration-300 z-40 lg:relative lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">HMS</h1>
          <button onClick={onClose} className="lg:hidden text-slate-600 hover:text-slate-900 dark:hover:text-slate-50">
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="px-4 py-6 space-y-1 overflow-y-auto">
          {visibleItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all',
                  active
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    : 'text-slate-700 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800',
                )}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  )
}
