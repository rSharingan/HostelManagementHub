import { prisma } from '@/lib/db/prisma'
import { successResponse, errorResponse, corsHeaders } from '@/lib/utils/response'

export async function GET(req) {
  try {
    const rooms = await prisma.room.findMany()

    const totalRooms = rooms.length
    const occupiedRooms = rooms.filter((r) => r.status === 'OCCUPIED').length
    const availableRooms = totalRooms - occupiedRooms
    const occupancyRate = totalRooms > 0 ? ((occupiedRooms / totalRooms) * 100).toFixed(2) : '0.00'

    const byBlock = {}
    rooms.forEach((room) => {
      if (!byBlock[room.block]) {
        byBlock[room.block] = { total: 0, occupied: 0 }
      }
      byBlock[room.block].total++
      if (room.status === 'OCCUPIED') {
        byBlock[room.block].occupied++
      }
    })

    return successResponse(
      {
        totalRooms,
        occupiedRooms,
        availableRooms,
        occupancyRate,
        byBlock,
      },
      'Occupancy report retrieved successfully'
    )
  } catch (err) {
    return errorResponse(err, 'Failed to retrieve occupancy report', 500)
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders(),
  })
}
