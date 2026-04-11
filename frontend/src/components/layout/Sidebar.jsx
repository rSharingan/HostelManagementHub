// path: src/components/layout/Sidebar.jsx
import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, LogOut, Settings, BarChart3, Users, Home, DollarSign, Wrench, ClipboardList, ClipboardCheck } from 'lucide-react'
import { useAuth } from '../../features/auth/hooks'
import { ROLES } from '../../lib/constants'
import { cn } from '../../lib/utils'

const navigationItems = [
  { label: 'Dashboard', icon: Home, href: '/dashboard', roles: [ROLES.ADMIN, ROLES.WARDEN, ROLES.CARETAKER, ROLES.STUDENT] },
  { label: 'Students', icon: Users, href: '/students', roles: [ROLES.ADMIN, ROLES.WARDEN] },
  { label: 'Rooms', icon: ClipboardList, href: '/rooms', roles: [ROLES.ADMIN, ROLES.WARDEN, ROLES.STUDENT] },
  { label: 'Allocations', icon: DollarSign, href: '/allocations', roles: [ROLES.ADMIN, ROLES.WARDEN] },
  { label: 'Invoices', icon: DollarSign, href: '/fees/invoices', roles: [ROLES.ADMIN] },
  { label: 'Payments', icon: DollarSign, href: '/fees/payments', roles: [ROLES.ADMIN, ROLES.STUDENT] },
  { label: 'Room Requests', icon: ClipboardCheck, href: '/room-requests', roles: [ROLES.ADMIN] },
  { label: 'Staff', icon: Users, href: '/staff', roles: [ROLES.ADMIN] },
  { label: 'Maintenance', icon: Wrench, href: '/maintenance', roles: [ROLES.ADMIN, ROLES.WARDEN, ROLES.CARETAKER, ROLES.STUDENT] },
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
          'fixed left-0 top-0 h-screen w-64 border-r border-gray-200 dark:border-cyan-500/10',
          'transform transition-all duration-300 z-40 lg:relative lg:translate-x-0',
          'bg-white dark:bg-dark-800/80 dark:backdrop-blur-xl',
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-cyan-500/10 flex items-center justify-between bg-gradient-to-r from-gray-50 dark:from-cyan-500/5 to-transparent">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-cyan-400">HMS</h1>
          <button onClick={onClose} className="lg:hidden text-gray-600 dark:text-dark-300 hover:text-gray-900 dark:hover:text-cyan-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="px-4 py-6 space-y-2 overflow-y-auto">
          {visibleItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300',
                  active
                    ? 'bg-cyan-100 dark:bg-gradient-to-r dark:from-cyan-500/20 dark:to-transparent text-cyan-700 dark:text-cyan-400 border-l-2 border-cyan-600 dark:border-cyan-500'
                    : 'text-gray-700 dark:text-dark-300 hover:text-gray-900 dark:hover:text-cyan-400 hover:bg-gray-100 dark:hover:bg-dark-700/50',
                )}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-cyan-500/10 space-y-3 bg-gradient-to-t from-gray-50 dark:from-dark-900 to-transparent">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10 dark:hover:border dark:hover:border-red-500/20 transition-all duration-300"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  )
}
