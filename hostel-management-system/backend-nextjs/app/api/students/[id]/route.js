import { prisma } from '@/lib/db/prisma'
import { successResponse, errorResponse, corsHeaders } from '@/lib/utils/response'

export async function GET(req, { params }) {
  try {
    const { id } = params
    const student = await prisma.student.findUnique({
      where: { id: parseInt(id) },
    })

    if (!student) {
      return errorResponse(null, 'Student not found', 404)
    }

    return successResponse(student, 'Student retrieved successfully')
  } catch (err) {
    return errorResponse(err, 'Failed to retrieve student', 500)
  }
}

export async function PUT(req, { params }) {
  try {
    const { id } = params
    const body = await req.json()

    const student = await prisma.student.update({
      where: { id: parseInt(id) },
      data: body,
    })

    return successResponse(student, 'Student updated successfully')
  } catch (err) {
    return errorResponse(err, 'Failed to update student', 500)
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = params

    await prisma.student.delete({
      where: { id: parseInt(id) },
    })

    return successResponse(null, 'Student deleted successfully')
  } catch (err) {
    return errorResponse(err, 'Failed to delete student', 500)
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders(),
  })
}
