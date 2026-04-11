// path: src/features/auth/RequireAuth.jsx
import { Navigate } from 'react-router-dom'
import { useAuth } from './hooks'

export const RequireAuth = ({ children, requiredRoles }) => {
  const { isAuthenticated, isLoading, user } = useAuth()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-dark-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (requiredRoles && !requiredRoles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}
