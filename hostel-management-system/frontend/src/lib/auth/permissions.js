// path: src/lib/auth/permissions.js
import { ROLES } from '../constants.js'

/**
 * Define role-based permissions
 */
export const PERMISSIONS = {
  // Students
  STUDENTS_VIEW: 'students:view',
  STUDENTS_CREATE: 'students:create',
  STUDENTS_EDIT: 'students:edit',
  STUDENTS_DELETE: 'students:delete',

  // Rooms
  ROOMS_VIEW: 'rooms:view',
  ROOMS_CREATE: 'rooms:create',
  ROOMS_EDIT: 'rooms:edit',
  ROOMS_DELETE: 'rooms:delete',

  // Fees
  FEES_VIEW: 'fees:view',
  FEES_CREATE: 'fees:create',
  FEES_EDIT: 'fees:edit',
  FEES_DELETE: 'fees:delete',

  // Reports
  REPORTS_VIEW: 'reports:view',

  // Settings
  SETTINGS_EDIT: 'settings:edit',
}

/**
 * Define role-based access control
 */
export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: Object.values(PERMISSIONS),
  [ROLES.WARDEN]: [
    PERMISSIONS.STUDENTS_VIEW,
    PERMISSIONS.STUDENTS_CREATE,
    PERMISSIONS.STUDENTS_EDIT,
    PERMISSIONS.ROOMS_VIEW,
    PERMISSIONS.ROOMS_CREATE,
    PERMISSIONS.ROOMS_EDIT,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.SETTINGS_EDIT,
  ],
  [ROLES.ACCOUNTANT]: [
    PERMISSIONS.STUDENTS_VIEW,
    PERMISSIONS.FEES_VIEW,
    PERMISSIONS.FEES_CREATE,
    PERMISSIONS.FEES_EDIT,
    PERMISSIONS.REPORTS_VIEW,
  ],
  [ROLES.CARETAKER]: [
    PERMISSIONS.STUDENTS_VIEW,
    PERMISSIONS.ROOMS_VIEW,
    PERMISSIONS.MAINTENANCE_VIEW,
  ],
}

/**
 * Check if a role has a specific permission
 */
export const hasPermission = (role, permission) => {
  const rolePerms = ROLE_PERMISSIONS[role] || []
  return rolePerms.includes(permission)
}
