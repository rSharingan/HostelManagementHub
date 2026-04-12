// path: src/lib/api/endpoints.js
export const API_ENDPOINTS = {
  AUTH: {
    SIGNUP: '/auth/signup',
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    ME: '/me',
    CHANGE_PASSWORD: '/auth/change-password',
  },
  STUDENTS: {
    LIST: '/students',
    DETAIL: (id) => `/students/${id}`,
    CREATE: '/students',
    UPDATE: (id) => `/students/${id}`,
    DELETE: (id) => `/students/${id}`,
  },
  ROOMS: {
    LIST: '/rooms',
    DETAIL: (id) => `/rooms/${id}`,
    CREATE: '/rooms',
    UPDATE: (id) => `/rooms/${id}`,
    DELETE: (id) => `/rooms/${id}`,
    APPLY: (id) => `/rooms/${id}/apply`,
  },
  ROOM_REQUESTS: {
    LIST: '/room-requests',
    CREATE: '/room-requests',
    APPROVE: (id) => `/room-requests/${id}/approve`,
  },
  ALLOCATIONS: {
    LIST: '/allocations',
    DETAIL: (id) => `/allocations/${id}`,
    CREATE: '/allocations',
    UPDATE: (id) => `/allocations/${id}`,
    DELETE: (id) => `/allocations/${id}`,
  },
  FEES: {
    INVOICES_LIST: '/fees/invoices',
    INVOICES_DETAIL: (id) => `/fees/invoices/${id}`,
    INVOICES_CREATE: '/fees/invoices',
    INVOICES_UPDATE: (id) => `/fees/invoices/${id}`,
    PAYMENTS_LIST: '/fees/payments',
    PAYMENTS_DETAIL: (id) => `/fees/payments/${id}`,
    PAYMENTS_CREATE: '/fees/payments',
    PAYMENTS_UPDATE: (id) => `/fees/payments/${id}`,
    RENT_STATUS: '/fees/rent-status',
    RENT_PAY: '/fees/rent-pay',
  },
  STAFF: {
    LIST: '/staff',
    DETAIL: (id) => `/staff/${id}`,
    CREATE: '/staff',
    UPDATE: (id) => `/staff/${id}`,
    DELETE: (id) => `/staff/${id}`,
  },
  MAINTENANCE: {
    LIST: '/maintenance',
    DETAIL: (id) => `/maintenance/${id}`,
    CREATE: '/maintenance',
    UPDATE: (id) => `/maintenance/${id}`,
    DELETE: (id) => `/maintenance/${id}`,
  },
  COMPLAINTS: {
    LIST: '/complaints',
    CREATE: '/complaints',
    UPDATE: (id) => `/complaints/${id}`,
  },
  PAYMENTS: {
    LIST: '/payments',
    CREATE: '/payments',
  },
  USERS: {
    LIST: '/users',
  },
  USER: {
    STATUS: '/user/status',
  },
  STRIPE: {
    CHECKOUT: '/stripe/checkout',
  },
  CONSULTANCY: {
    LIST: '/consultancy',
    CREATE: '/consultancy',
    UPDATE: (id) => `/consultancy/${id}`,
    DELETE: (id) => `/consultancy/${id}`,
  },
  REPORTS: {
    OCCUPANCY: '/reports/occupancy',
    DUES: '/reports/dues',
    MAINTENANCE: '/reports/maintenance',
  },
  ANALYTICS: {
    OCCUPANCY: '/analytics/occupancy',
    FINANCIAL: '/analytics/financial',
    STUDENTS: '/analytics/students',
    MAINTENANCE: '/analytics/maintenance',
  },
}
