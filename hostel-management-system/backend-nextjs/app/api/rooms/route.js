import { prisma } from '@/lib/db/prisma'
import { successResponse, errorResponse, corsHeaders } from '@/lib/utils/response'

export async function GET(req) {
  try {
    const rooms = await prisma.room.findMany()

    return successResponse(rooms, 'Rooms retrieved successfully')
  } catch (err) {
    return errorResponse(err, 'Failed to retrieve rooms', 500)
  }
}

export async function POST(req) {
  try {
    const body = await req.json()
    const { roomNumber, block, floor, capacity, type, rentalCost, status = 'AVAILABLE' } = body

    if (!roomNumber) {
      return errorResponse(null, 'Room number required', 400)
    }

    const room = await prisma.room.create({
      data: {
        roomNumber,
        block: block || null,
        floor: floor || null,
        capacity: capacity || null,
        type: type || null,
        rentalCost: parseFloat(rentalCost) || 0,
        status,
      },
    })

    return successResponse(room, 'Room created successfully', 201)
  } catch (err) {
    return errorResponse(err, 'Failed to create room', 500)
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders(),
  })
}
