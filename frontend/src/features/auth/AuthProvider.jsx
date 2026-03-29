// path: src/features/auth/AuthProvider.jsx
import { createContext, useState, useCallback, useEffect } from 'react'
import { loginAPI, logoutAPI, signupAPI } from './api'
import { STORAGE_KEYS } from '../../lib/constants'
import { toast } from 'sonner'

export const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // ✅ FIXED: restore auth from localStorage (NO /api/me)
  useEffect(() => {
    try {
      const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
      const storedUser = localStorage.getItem(STORAGE_KEYS.USER)

      if (token && storedUser) {
        setUser(JSON.parse(storedUser))
        setIsAuthenticated(true)
      }
    } catch (error) {
      console.error('Auth restore failed:', error)
      localStorage.removeItem(STORAGE_KEYS.TOKEN)
      localStorage.removeItem(STORAGE_KEYS.USER)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // ✅ FIXED: removed setIsLoading(true)
  const login = useCallback(async (email, password) => {
    try {
      const { token, user: userData } = await loginAPI(email, password)

      localStorage.setItem(STORAGE_KEYS.TOKEN, token)
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData))

      setUser(userData)
      setIsAuthenticated(true)

      toast.success('Login successful')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed')
      throw error
    }
  }, [])

  const signup = useCallback(async (userData) => {
    try {
      const { token, user: userResponse } = await signupAPI(userData)

      localStorage.setItem(STORAGE_KEYS.TOKEN, token)
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userResponse))

      setUser(userResponse)
      setIsAuthenticated(true)

      toast.success('Signup successful')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Signup failed')
      throw error
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
    signup,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}