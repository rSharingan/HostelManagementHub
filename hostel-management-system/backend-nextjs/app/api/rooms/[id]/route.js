import { prisma } from '@/lib/db/prisma'
import { successResponse, errorResponse, corsHeaders } from '@/lib/utils/response'

export async function GET(req, { params }) {
  try {
    const { id } = params
    const room = await prisma.room.findUnique({
      where: { id: parseInt(id) },
    })

    if (!room) {
      return errorResponse(null, 'Room not found', 404)
    }

    return successResponse(room, 'Room retrieved successfully')
  } catch (err) {
    return errorResponse(err, 'Failed to retrieve room', 500)
  }
}

export async function PUT(req, { params }) {
  try {
    const { id } = params
    const body = await req.json()

    const room = await prisma.room.update({
      where: { id: parseInt(id) },
      data: body,
    })

    return successResponse(room, 'Room updated successfully')
  } catch (err) {
    return errorResponse(err, 'Failed to update room', 500)
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = params

    await prisma.room.delete({
      where: { id: parseInt(id) },
    })

    return successResponse(null, 'Room deleted successfully')
  } catch (err) {
    return errorResponse(err, 'Failed to delete room', 500)
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders(),
  })
}
