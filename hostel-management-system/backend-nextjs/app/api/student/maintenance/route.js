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

    // Get student's room
    const allocation = await prisma.allocation.findFirst({
      where: {
        studentId: user.id,
        status: 'ACTIVE',
      },
      include: {
        room: true,
      },
    })

    if (!allocation) {
      return successResponse([], 'No maintenance requests found')
    }

    const requests = await prisma.maintenance.findMany({
      where: {
        room: allocation.room.roomNumber,
      },
      orderBy: { createdAt: 'desc' },
    })

    return successResponse(requests, 'Maintenance requests retrieved successfully')
  } catch (err) {
    return errorResponse(err, 'Failed to get maintenance requests', 500)
  }
}

export async function POST(req) {
  try {
    const authResult = await authMiddleware(req)
    if (!authResult.success) {
      return errorResponse(null, authResult.message, 401)
    }

    const { user, userType } = authResult

    if (userType !== 'student') {
      return errorResponse(null, 'Access denied. Student access required.', 403)
    }

    const { description, priority = 'LOW' } = await req.json()

    if (!description) {
      return errorResponse(null, 'Description is required', 400)
    }

    // Get student's room
    const allocation = await prisma.allocation.findFirst({
      where: {
        studentId: user.id,
        status: 'ACTIVE',
      },
      include: {
        room: true,
      },
    })

    if (!allocation) {
      return errorResponse(null, 'No active room allocation found', 400)
    }

    const maintenanceRequest = await prisma.maintenance.create({
      data: {
        description,
        room: allocation.room.roomNumber,
        priority,
        status: 'PENDING',
        reportedDate: new Date(),
      },
    })

    return successResponse(maintenanceRequest, 'Maintenance request submitted successfully')
  } catch (err) {
    return errorResponse(err, 'Failed to submit maintenance request', 500)
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders(),
  })
}