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

    const availableRooms = await prisma.room.findMany({
      where: {
        status: 'AVAILABLE',
      },
      orderBy: {
        roomNumber: 'asc',
      },
    })

    return successResponse(availableRooms, 'Available rooms retrieved successfully')
  } catch (err) {
    return errorResponse(err, 'Failed to get available rooms', 500)
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders(),
  })
}