// path: src/features/auth/api.js
import axios from '../../lib/api/axios'
import { API_ENDPOINTS } from '../../lib/api/endpoints'

/**
 * Signup with user details
 * @param {Object} userData
 * @returns {Promise<{token: string, user: User}>}
 */
export const signupAPI = async (userData) => {
  const { data } = await axios.post(API_ENDPOINTS.AUTH.SIGNUP, userData)
  return data
}

/**
 * Login with email and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{token: string, user: User}>}
 */
export const loginAPI = async (email, password) => {
  const { data } = await axios.post(API_ENDPOINTS.AUTH.LOGIN, { email, password })
  return data
}

/**
 * Logout
 * @returns {Promise<void>}
 */
export const logoutAPI = async () => {
  await axios.post(API_ENDPOINTS.AUTH.LOGOUT)
}

/**
 * Get current user
 * @returns {Promise<User>}
 */
export const getMeAPI = async () => {
  const { data } = await axios.get(API_ENDPOINTS.AUTH.ME)
  return data
}
