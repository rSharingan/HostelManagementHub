import { prisma } from '@/lib/db/prisma'
import { successResponse, errorResponse, corsHeaders } from '@/lib/utils/response'

export async function GET(req) {
  try {
    const allocations = await prisma.allocation.findMany({
      include: {
        student: true,
        room: true,
      },
    })

    return successResponse(allocations, 'Allocations retrieved successfully')
  } catch (err) {
    return errorResponse(err, 'Failed to retrieve allocations', 500)
  }
}

export async function POST(req) {
  try {
    const body = await req.json()
    const { studentId, roomId, checkInDate, status = 'ACTIVE' } = body

    if (!studentId || !roomId) {
      return errorResponse(null, 'Student ID and Room ID required', 400)
    }

    // Update room status to occupied
    await prisma.room.update({
      where: { id: roomId },
      data: { status: 'OCCUPIED' },
    })

    const allocation = await prisma.allocation.create({
      data: {
        studentId,
        roomId,
        checkInDate: checkInDate ? new Date(checkInDate) : null,
        status,
      },
      include: {
        student: true,
        room: true,
      },
    })

    return successResponse(allocation, 'Allocation created successfully', 201)
  } catch (err) {
    return errorResponse(err, 'Failed to create allocation', 500)
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders(),
  })
}
