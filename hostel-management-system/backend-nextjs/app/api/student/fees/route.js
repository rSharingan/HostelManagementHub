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

    const invoices = await prisma.invoice.findMany({
      where: { studentId: user.id },
      include: {
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return successResponse(invoices, 'Fees retrieved successfully')
  } catch (err) {
    return errorResponse(err, 'Failed to get fees', 500)
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders(),
  })
}