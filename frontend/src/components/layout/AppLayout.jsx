// path: src/components/layout/AppLayout.jsx
import { useState, useEffect } from 'react'
import { useAuth } from '../../features/auth/hooks'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { STORAGE_KEYS } from '../../lib/constants'

export const AppLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [dark, setDark] = useState(false)
  const { user } = useAuth()

  // Determine if user is admin or staff
  const isAdminStaff = user?.role && ['ADMIN', 'WARDEN', 'ACCOUNTANT', 'CARETAKER'].includes(user.role)
  const isStudent = user?.role === 'STUDENT'

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME)
    const isDark = savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)
    setDark(isDark)
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false)
  }, [])

  const handleThemeToggle = () => {
    const newDark = !dark
    setDark(newDark)
    localStorage.setItem(STORAGE_KEYS.THEME, newDark ? 'dark' : 'light')
    if (newDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  return (
    <div className="flex h-screen bg-white dark:bg-dark-900 overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        dark={dark}
        onThemeToggle={handleThemeToggle}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <Topbar
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          dark={dark}
          onThemeToggle={handleThemeToggle}
        />

        {/* Page Content */}
        <main className={`flex-1 overflow-y-auto relative ${
          isStudent
            ? 'bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 dark:from-slate-900 dark:via-blue-950 dark:to-slate-900'
            : isAdminStaff
            ? 'bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-950'
            : 'bg-white dark:bg-dark-900'
        }`}>
          {/* Student Background Pattern */}
          {isStudent && (
            <div className="absolute inset-0 opacity-5 dark:opacity-10 pointer-events-none">
              <svg className="w-full h-full" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
                <defs>
                  <pattern id="studentBg" x="0" y="0" width="150" height="150" patternUnits="userSpaceOnUse">
                    {/* Student cap */}
                    <path d="M 50 60 L 100 30 L 150 60 L 100 75 Z" fill="currentColor" opacity="0.3"/>
                    <rect x="40" y="75" width="120" height="5" fill="currentColor" opacity="0.2"/>
                    {/* Open book */}
                    <path d="M 30 100 L 60 85 L 60 120 Z" fill="currentColor" opacity="0.25"/>
                    <path d="M 120 100 L 90 85 L 90 120 Z" fill="currentColor" opacity="0.25"/>
                  </pattern>
                </defs>
                <rect width="1200" height="800" fill="url(#studentBg)"/>
              </svg>
            </div>
          )}

          {/* Admin Background Pattern */}
          {isAdminStaff && (
            <div className="absolute inset-0 opacity-5 dark:opacity-10 pointer-events-none">
              <svg className="w-full h-full" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
                <defs>
                  <pattern id="adminBg" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
                    {/* Shield icon */}
                    <path d="M 40 30 L 80 20 L 80 60 Q 80 85 40 100 Q 0 85 0 60 L 0 20 Z" fill="currentColor" opacity="0.3"/>
                    {/* Gear icon */}
                    <circle cx="80" cy="80" r="15" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.25"/>
                    <circle cx="80" cy="80" r="8" fill="currentColor" opacity="0.2"/>
                    <rect x="75" y="60" width="10" height="5" fill="currentColor" opacity="0.25"/>
                    <rect x="75" y="95" width="10" height="5" fill="currentColor" opacity="0.25"/>
                  </pattern>
                </defs>
                <rect width="1200" height="800" fill="url(#adminBg)"/>
              </svg>
            </div>
          )}

          <div className="p-4 md:p-8 relative z-10">{children}</div>
        </main>
      </div>
    </div>
  )
}
