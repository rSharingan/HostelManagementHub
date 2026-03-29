// path: src/features/allocations/types.js
/**
 * @typedef {Object} Allocation
 * @property {string} id
 * @property {string} studentId
 * @property {string} roomId
 * @property {Date} allocationDate
 * @property {Date} releaseDate
 * @property {string} status - 'ACTIVE' | 'RELEASED'
 */

/**
 * @typedef {Object} Room
 * @property {number} id
 * @property {string} roomNumber
 * @property {string} block
 * @property {number} floor
 * @property {number} capacity
 * @property {string} type
 * @property {'AVAILABLE' | 'OCCUPIED'} status
 */

/**
 * @typedef {Object} AllocationSummary
 * @property {Room[]} available
 * @property {Room[]} booked
 */
