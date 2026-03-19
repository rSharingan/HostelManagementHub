import { prisma } from '@/lib/db/prisma'
import { successResponse, errorResponse, corsHeaders } from '@/lib/utils/response'
import { authMiddleware } from '@/lib/utils/auth'

export async function GET(req) {
  try {
    const authResult = await authMiddleware(req)
    if (!authResult.success) {
      return errorResponse(null, authResult.message, 401)
    }

    const { user, userType } = authResult

    if (userType !== 'student') {
      return errorResponse(null, 'Access denied. Student access required.', 403)
    }

    // Get student details
    const student = await prisma.student.findUnique({
      where: { id: user.id },
      include: {
        allocations: {
          include: {
            room: true,
          },
          where: {
            status: 'ACTIVE',
          },
        },
        invoices: {
          where: {
            status: 'PENDING',
          },
        },
      },
    })

    if (!student) {
      return errorResponse(null, 'Student not found', 404)
    }

    // Calculate pending fees
    const pendingFees = student.invoices.reduce((sum, invoice) => sum + parseFloat(invoice.amount), 0)

    // Get maintenance requests count
    const maintenanceRequests = await prisma.maintenance.count({
      where: {
        room: student.allocations[0]?.room.roomNumber || '',
      },
    })

    // Get available rooms count
    const availableRooms = await prisma.room.count({
      where: {
        status: 'AVAILABLE',
      },
    })

    const dashboardData = {
      student: {
        name: student.name,
        email: student.email,
        registrationNumber: student.registrationNumber,
        department: student.department,
        yearOfStudy: student.yearOfStudy,
      },
      roomNumber: student.allocations[0]?.room.roomNumber || null,
      roomStatus: student.allocations[0] ? 'Allocated' : 'Not allocated',
      pendingFees,
      pendingInvoices: student.invoices.length,
      pendingRequests: maintenanceRequests,
      availableRooms,
    }

    return successResponse(dashboardData, 'Dashboard data retrieved successfully')
  } catch (err) {
    return errorResponse(err, 'Failed to get dashboard data', 500)
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders(),
  })
}