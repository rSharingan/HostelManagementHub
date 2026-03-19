// path: src/features/dashboard/api.js
import axios from '../../lib/api/axios'
import { API_ENDPOINTS } from '../../lib/api/endpoints'

export const getDashboardStatsAPI = async () => {
  try {
    const [studentsRes, roomsRes, invoicesRes, maintenanceRes, staffRes, paymentsRes] = await Promise.all([
      axios.get(API_ENDPOINTS.STUDENTS.LIST),
      axios.get(API_ENDPOINTS.ROOMS.LIST),
      axios.get(API_ENDPOINTS.FEES.INVOICES_LIST),
      axios.get(API_ENDPOINTS.MAINTENANCE.LIST),
      axios.get(API_ENDPOINTS.STAFF.LIST),
      axios.get(API_ENDPOINTS.FEES.PAYMENTS_LIST),
    ])

    const students = studentsRes.data.data || []
    const rooms = roomsRes.data.data || []
    const invoices = invoicesRes.data.data || []
    const maintenance = maintenanceRes.data.data || []
    const staff = staffRes.data.data || []
    const payments = paymentsRes.data.data || []

    const occupiedRooms = rooms.filter(r => r.status === 'OCCUPIED').length
    const availableRooms = rooms.filter(r => r.status === 'AVAILABLE').length
    const pendingInvoices = invoices.filter(i => i.status === 'PENDING')
    const paidInvoices = invoices.filter(i => i.status === 'PAID')
    const pendingFees = pendingInvoices.reduce((sum, i) => sum + parseFloat(i.amount), 0)
    const paidFees = paidInvoices.reduce((sum, i) => sum + parseFloat(i.amount), 0)
    const pendingMaintenance = maintenance.filter(m => m.status === 'PENDING').length
    const totalStaffSalary = staff.reduce((sum, s) => sum + (parseFloat(s.salary) || 0), 0)

    return {
      totalStudents: students.length,
      totalRooms: rooms.length,
      availableRooms,
      occupiedRooms,
      occupancyRate: rooms.length > 0 ? ((occupiedRooms / rooms.length) * 100).toFixed(1) : 0,
      pendingFees,
      paidFees,
      totalFees: pendingFees + paidFees,
      pendingInvoices: pendingInvoices.length,
      paidInvoices: paidInvoices.length,
      pendingMaintenance,
      totalMaintenance: maintenance.length,
      totalStaff: staff.length,
      wardens: staff.filter(s => s.position === 'Warden'),
      caretakers: staff.filter(s => s.position === 'Caretaker'),
      totalStaffSalary,
      recentPayments: payments.slice(0, 5), // Last 5 payments
      recentComplaints: maintenance.filter(m => m.status === 'PENDING').slice(0, 5), // Recent pending complaints
    }
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error)
    return {
      totalStudents: 0,
      totalRooms: 0,
      availableRooms: 0,
      occupiedRooms: 0,
      occupancyRate: 0,
      pendingFees: 0,
      paidFees: 0,
      totalFees: 0,
      pendingInvoices: 0,
      paidInvoices: 0,
      pendingMaintenance: 0,
      totalMaintenance: 0,
      totalStaff: 0,
      wardens: [],
      caretakers: [],
      totalStaffSalary: 0,
      recentPayments: [],
      recentComplaints: [],
    }
  }
}
