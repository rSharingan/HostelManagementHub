// path: src/features/auth/hooks.js
import { useContext } from 'react'
import { AuthContext } from './AuthProvider'
import { useQuery } from '@tanstack/react-query'
import axios from '../../lib/api/axios'
import { API_ENDPOINTS } from '../../lib/api/endpoints'

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

export const usePremiumStatus = () => {
  return useQuery({
    queryKey: ['user-status'],
    queryFn: async () => {
      const response = await axios.get(API_ENDPOINTS.USER.STATUS)
      return response.data
    },
    enabled: !!useAuth().isAuthenticated,
  })
}
