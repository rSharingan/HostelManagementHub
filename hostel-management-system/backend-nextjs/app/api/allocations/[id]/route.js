import { prisma } from '@/lib/db/prisma'
import { successResponse, errorResponse, corsHeaders } from '@/lib/utils/response'

export async function GET(req, { params }) {
  try {
    const { id } = params
    const allocation = await prisma.allocation.findUnique({
      where: { id: parseInt(id) },
      include: {
        student: true,
        room: true,
      },
    })

    if (!allocation) {
      return errorResponse(null, 'Allocation not found', 404)
    }

    return successResponse(allocation, 'Allocation retrieved successfully')
  } catch (err) {
    return errorResponse(err, 'Failed to retrieve allocation', 500)
  }
}

export async function PUT(req, { params }) {
  try {
    const { id } = params
    const body = await req.json()

    const allocation = await prisma.allocation.update({
      where: { id: parseInt(id) },
      data: {
        status: body.status,
        checkOutDate: body.checkOutDate ? new Date(body.checkOutDate) : null,
      },
      include: {
        student: true,
        room: true,
      },
    })

    return successResponse(allocation, 'Allocation updated successfully')
  } catch (err) {
    return errorResponse(err, 'Failed to update allocation', 500)
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = params

    // Get allocation to update room status
    const allocation = await prisma.allocation.findUnique({
      where: { id: parseInt(id) },
    })

    if (allocation) {
      // Update room status back to available
      await prisma.room.update({
        where: { id: allocation.roomId },
        data: { status: 'AVAILABLE' },
      })
    }

    await prisma.allocation.delete({
      where: { id: parseInt(id) },
    })

    return successResponse(null, 'Allocation deleted successfully')
  } catch (err) {
    return errorResponse(err, 'Failed to delete allocation', 500)
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders(),
  })
}
