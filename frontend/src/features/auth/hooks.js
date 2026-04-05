// path: src/features/auth/hooks.js
import { useContext } from 'react'
import { AuthContext } from './AuthProvider'

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    // Fail-safe for transient provider wiring/HMR issues to avoid app hard-crash.
    return {
      user: null,
      isAuthenticated: false,
      isLoading: false,
      signup: async () => {},
      login: async () => {},
      logout: async () => {},
    }
  }
  return context
}
