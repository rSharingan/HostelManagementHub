import { prisma } from '@/lib/db/prisma'
import { successResponse, errorResponse, corsHeaders } from '@/lib/utils/response'

export async function GET(req, { params }) {
  try {
    const { id } = params
    const maintenance = await prisma.maintenance.findUnique({
      where: { id: parseInt(id) },
    })

    if (!maintenance) {
      return errorResponse(null, 'Maintenance request not found', 404)
    }

    return successResponse(maintenance, 'Maintenance request retrieved successfully')
  } catch (err) {
    return errorResponse(err, 'Failed to retrieve maintenance request', 500)
  }
}

export async function PUT(req, { params }) {
  try {
    const { id } = params
    const body = await req.json()

    const maintenance = await prisma.maintenance.update({
      where: { id: parseInt(id) },
      data: {
        description: body.description,
        priority: body.priority || 'LOW',
        status: body.status || 'PENDING',
        assignedTo: body.assignedTo || null,
      },
    })

    return successResponse(maintenance, 'Maintenance request updated successfully')
  } catch (err) {
    return errorResponse(err, 'Failed to update maintenance request', 500)
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = params

    await prisma.maintenance.delete({
      where: { id: parseInt(id) },
    })

    return successResponse(null, 'Maintenance request deleted successfully')
  } catch (err) {
    return errorResponse(err, 'Failed to delete maintenance request', 500)
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders(),
  })
}
