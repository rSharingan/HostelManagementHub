// path: src/lib/auth/roles.js
import { ROLES } from '../constants.js'

/**
 * Check if user has a specific role
 */
export const hasRole = (userRole, requiredRole) => {
  if (Array.isArray(requiredRole)) {
    return requiredRole.includes(userRole)
  }
  return userRole === requiredRole
}

/**
 * Get role hierarchy level for permission checking
 */
export const getRoleLevel = (role) => {
  const levels = {
    [ROLES.ADMIN]: 4,
    [ROLES.WARDEN]: 3,
    [ROLES.ACCOUNTANT]: 2,
    [ROLES.CARETAKER]: 1,
  }
  return levels[role] || 0
}

/**
 * Check if role has higher or equal level
 */
export const isRoleHigherOrEqual = (role, compareRole) => {
  return getRoleLevel(role) >= getRoleLevel(compareRole)
}
