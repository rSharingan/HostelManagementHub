// path: src/features/fees/types.js
/**
 * @typedef {Object} Invoice
 * @property {string} id
 * @property {string} studentId
 * @property {number} amount
 * @property {Date} dueDate
 * @property {string} status - 'PAID' | 'PENDING' | 'OVERDUE'
 */

/**
 * @typedef {Object} Payment
 * @property {string} id
 * @property {string} invoiceId
 * @property {number} amount
 * @property {Date} paymentDate
 * @property {string} method - 'CASH' | 'CHEQUE' | 'ONLINE'
 */
