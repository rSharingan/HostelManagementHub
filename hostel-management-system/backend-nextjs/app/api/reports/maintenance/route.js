import { prisma } from '@/lib/db/prisma'
import { successResponse, errorResponse, corsHeaders } from '@/lib/utils/response'

export async function GET(req) {
  try {
    const allMaintenance = await prisma.maintenance.findMany()

    let pending = 0,
      inProgress = 0,
      completed = 0

    allMaintenance.forEach((m) => {
      if (m.status === 'PENDING') pending++
      else if (m.status === 'IN_PROGRESS') inProgress++
      else if (m.status === 'COMPLETED') completed++
    })

    return successResponse(
      {
        total: allMaintenance.length,
        pending,
        inProgress,
        completed,
        requests: allMaintenance,
      },
      'Maintenance report retrieved successfully'
    )
  } catch (err) {
    return errorResponse(err, 'Failed to retrieve maintenance report', 500)
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders(),
  })
}
