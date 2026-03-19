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
      return successResponse(null, 'No active room allocation found')
    }

    return successResponse(allocation, 'Room information retrieved successfully')
  } catch (err) {
    return errorResponse(err, 'Failed to get room information', 500)
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders(),
  })
}