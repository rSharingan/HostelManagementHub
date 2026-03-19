// path: src/app/RoleBasedRedirect.jsx
import { Navigate } from 'react-router-dom'
import { useAuth } from '../features/auth/hooks'

export const RoleBasedRedirect = () => {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (user?.userType === 'student' || user?.role === 'STUDENT') {
    return <Navigate to="/student-portal" replace />
  }

  if (user?.role === 'WARDEN') {
    return <Navigate to="/warden-dashboard" replace />
  }

  if (user?.role === 'CARETAKER') {
    return <Navigate to="/caretaker-dashboard" replace />
  }

  return <Navigate to="/dashboard" replace />
}