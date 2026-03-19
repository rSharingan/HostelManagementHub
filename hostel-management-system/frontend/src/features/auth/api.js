// path: src/features/auth/api.js
import axios from '../../lib/api/axios'
import { API_ENDPOINTS } from '../../lib/api/endpoints'

/**
 * Login with email and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{token: string, user: User}>}
 */
export const loginAPI = async (email, password) => {
  const { data } = await axios.post(API_ENDPOINTS.AUTH.LOGIN, { email, password })
  return data.data
}

/**
 * Sign up with user details
 * @param {string} name
 * @param {string} email
 * @param {string} password
 * @param {string} role
 * @returns {Promise<{token: string, user: User}>}
 */
export const signupAPI = async (name, email, password, role) => {
  const { data } = await axios.post(API_ENDPOINTS.AUTH.SIGNUP, {
    name,
    email,
    password,
    role,
  })
  return data.data
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
  return data.data
}
