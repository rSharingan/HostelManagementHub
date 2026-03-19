import { prisma } from '@/lib/db/prisma'
import { successResponse, errorResponse, corsHeaders } from '@/lib/utils/response'

export async function GET(req) {
  try {
    const maintenance = await prisma.maintenance.findMany()

    return successResponse(maintenance, 'Maintenance requests retrieved successfully')
  } catch (err) {
    return errorResponse(err, 'Failed to retrieve maintenance requests', 500)
  }
}

export async function POST(req) {
  try {
    const body = await req.json()
    const { description, room, priority = 'LOW', status = 'PENDING', reportedDate } = body

    if (!description || !room) {
      return errorResponse(null, 'Description and room required', 400)
    }

    const maintenance = await prisma.maintenance.create({
      data: {
        description,
        room,
        priority,
        status,
        reportedDate: reportedDate ? new Date(reportedDate) : new Date(),
      },
    })

    return successResponse(maintenance, 'Maintenance request created successfully', 201)
  } catch (err) {
    return errorResponse(err, 'Failed to create maintenance request', 500)
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders(),
  })
}
