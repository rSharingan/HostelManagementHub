import { prisma } from '@/lib/db/prisma'
import { successResponse, errorResponse, corsHeaders } from '@/lib/utils/response'

export async function GET(req) {
  try {
    const students = await prisma.student.findMany()

    return successResponse(students, 'Students retrieved successfully')
  } catch (err) {
    return errorResponse(err, 'Failed to retrieve students', 500)
  }
}

export async function POST(req) {
  try {
    const body = await req.json()
    const { name, email, phone, registrationNumber, department, yearOfStudy, status = 'ACTIVE' } = body

    if (!name || !registrationNumber) {
      return errorResponse(null, 'Name and registration number required', 400)
    }

    const student = await prisma.student.create({
      data: {
        name,
        email: email || null,
        phone: phone || null,
        registrationNumber,
        department: department || null,
        yearOfStudy: yearOfStudy || null,
        status,
      },
    })

    return successResponse(student, 'Student created successfully', 201)
  } catch (err) {
    return errorResponse(err, 'Failed to create student', 500)
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders(),
  })
}
