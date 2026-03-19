// path: src/components/layout/AppLayout.jsx
import { useState, useEffect } from 'react'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { STORAGE_KEYS } from '../../lib/constants'

export const AppLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [dark, setDark] = useState(false)

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
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
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
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
