import { prisma } from '@/lib/db/prisma'
import { successResponse, errorResponse, corsHeaders } from '@/lib/utils/response'

export async function GET(req, { params }) {
  try {
    const { id } = params
    const staff = await prisma.staffMember.findUnique({
      where: { id: parseInt(id) },
    })

    if (!staff) {
      return errorResponse(null, 'Staff not found', 404)
    }

    return successResponse(staff, 'Staff retrieved successfully')
  } catch (err) {
    return errorResponse(err, 'Failed to retrieve staff', 500)
  }
}

export async function PUT(req, { params }) {
  try {
    const { id } = params
    const body = await req.json()

    const staff = await prisma.staffMember.update({
      where: { id: parseInt(id) },
      data: body,
    })

    return successResponse(staff, 'Staff updated successfully')
  } catch (err) {
    return errorResponse(err, 'Failed to update staff', 500)
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = params

    await prisma.staffMember.delete({
      where: { id: parseInt(id) },
    })

    return successResponse(null, 'Staff deleted successfully')
  } catch (err) {
    return errorResponse(err, 'Failed to delete staff', 500)
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders(),
  })
}
