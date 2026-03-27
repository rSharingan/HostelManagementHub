// path: src/lib/constants.js
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

export const ROLES = {
  ADMIN: 'ADMIN',
  WARDEN: 'WARDEN',
  ACCOUNTANT: 'ACCOUNTANT',
  CARETAKER: 'CARETAKER',
  STUDENT: 'STUDENT',
}

export const ROLE_LABELS = {
  [ROLES.ADMIN]: 'Administrator',
  [ROLES.WARDEN]: 'Warden',
  [ROLES.ACCOUNTANT]: 'Accountant',
  [ROLES.CARETAKER]: 'Caretaker',
  [ROLES.STUDENT]: 'Student',
}

export const PAGINATION_DEFAULTS = {
  pageSize: 10,
  pageSizeOptions: [5, 10, 20, 50],
}

export const STORAGE_KEYS = {
  TOKEN: 'hostel_token',
  USER: 'hostel_user',
  THEME: 'hostel_theme',
}
