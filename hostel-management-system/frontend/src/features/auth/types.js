// path: src/features/auth/types.js
/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} name
 * @property {string} email
 * @property {string} role - 'ADMIN' | 'WARDEN' | 'ACCOUNTANT' | 'CARETAKER'
 */

/**
 * @typedef {Object} AuthResponse
 * @property {string} token
 * @property {User} user
 */

/**
 * @typedef {Object} AuthContextType
 * @property {User|null} user
 * @property {boolean} isAuthenticated
 * @property {boolean} isLoading
 * @property {(email: string, password: string) => Promise<void>} login
 * @property {() => Promise<void>} logout
 * @property {() => Promise<void>} checkAuth
 */
