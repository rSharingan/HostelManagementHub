// path: src/features/auth/AuthProvider.jsx
import { createContext, useState, useCallback, useEffect } from 'react'
import { loginAPI, logoutAPI, getMeAPI } from './api'
import { STORAGE_KEYS } from '../../lib/constants'
import { toast } from 'sonner'

export const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Check auth on mount
  useEffect(() => {
    const checkAuth = () => {
      try {
        const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
        const userData = localStorage.getItem(STORAGE_KEYS.USER)

        if (token && userData) {
          const parsedUser = JSON.parse(userData)
          setUser(parsedUser)
          setIsAuthenticated(true)
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        localStorage.removeItem(STORAGE_KEYS.TOKEN)
        localStorage.removeItem(STORAGE_KEYS.USER)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = useCallback(async (email, password) => {
    try {
      setIsLoading(true)
      const { token, user: userData, userType } = await loginAPI(email, password)
      localStorage.setItem(STORAGE_KEYS.TOKEN, token)
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify({ ...userData, userType }))
      setUser({ ...userData, userType })
      setIsAuthenticated(true)
      toast.success('Login successful')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed')
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await logoutAPI()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      localStorage.removeItem(STORAGE_KEYS.TOKEN)
      localStorage.removeItem(STORAGE_KEYS.USER)
      setUser(null)
      setIsAuthenticated(false)
      window.location.href = '/login'
      toast.success('Logged out successfully')
    }
  }, [])

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
