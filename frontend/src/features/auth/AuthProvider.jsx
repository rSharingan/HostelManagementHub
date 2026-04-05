// path: src/features/auth/AuthProvider.jsx
import { createContext, useState, useCallback, useEffect } from 'react'
import { loginAPI, logoutAPI, getMeAPI, signupAPI } from './api'
import { STORAGE_KEYS } from '../../lib/constants'
import { toast } from 'sonner'

export const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Check auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
        const storedUser = localStorage.getItem(STORAGE_KEYS.USER)
        if (token) {
          if (storedUser) {
            setUser(JSON.parse(storedUser))
          } else {
            const currentUser = await getMeAPI()
            setUser(currentUser)
          }
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

  const signup = useCallback(async (userData) => {
    try {
      setIsLoading(true)
      const { token, user: userDataResponse } = await signupAPI(userData)
      localStorage.setItem(STORAGE_KEYS.TOKEN, token)
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userDataResponse))
      setUser(userDataResponse)
      setIsAuthenticated(true)
      toast.success('Signup successful')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Signup failed')
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [])

  const login = useCallback(async (email, password) => {
    try {
      setIsLoading(true)
      const { token, user: userData } = await loginAPI(email, password)
      localStorage.setItem(STORAGE_KEYS.TOKEN, token)
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData))
      setUser(userData)
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
    signup,
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
