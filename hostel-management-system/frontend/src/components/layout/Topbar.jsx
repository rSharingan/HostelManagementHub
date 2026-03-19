// path: src/components/layout/Topbar.jsx
import { Menu, Moon, Sun, Search } from 'lucide-react'
import { useAuth } from '../../features/auth/hooks'
import { getInitials } from '../../lib/utils'
import { Dropdown, DropdownItem } from '../ui/Dropdown'

export const Topbar = ({ onMenuClick, dark, onThemeToggle }) => {
  const { user, logout } = useAuth()

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 sticky top-0 z-20">
      {/* Left: Menu & Search */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400"
        >
          <Menu size={20} />
        </button>
        <div className="hidden md:flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-lg px-3 py-2">
          <Search size={16} className="text-slate-400" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent border-0 outline-none text-sm placeholder-slate-400 dark:text-slate-50 w-48"
          />
        </div>
      </div>

      {/* Right: Theme & User */}
      <div className="flex items-center gap-4">
        <button
          onClick={onThemeToggle}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 transition-all"
        >
          {dark ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <Dropdown
          trigger={
            <div className="flex items-center gap-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 px-3 py-2 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-semibold">
                {getInitials(user?.name)}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-50">{user?.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{user?.role}</p>
              </div>
            </div>
          }
          align="right"
        >
          <DropdownItem onClick={logout} className="text-red-600">
            Logout
          </DropdownItem>
        </Dropdown>
      </div>
    </header>
  )
}
