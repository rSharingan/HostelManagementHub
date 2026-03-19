import { prisma } from '@/lib/db/prisma'
import { successResponse, errorResponse, corsHeaders } from '@/lib/utils/response'

export async function POST(req) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return errorResponse(null, 'Email and password required', 400)
    }

    // First check Users table
    let user = await prisma.user.findUnique({
      where: { email },
    })

    let userType = 'staff'

    if (!user) {
      // Check Students table
      const student = await prisma.student.findUnique({
        where: { email },
      })

      if (student && student.password === password) {
        user = {
          id: student.id,
          name: student.name,
          email: student.email,
          role: 'STUDENT',
          registrationNumber: student.registrationNumber,
          department: student.department,
          yearOfStudy: student.yearOfStudy,
        }
        userType = 'student'
      }
    }

    if (!user || (userType === 'staff' && user.password !== password)) {
      return errorResponse(null, 'Invalid credentials', 401)
    }

    const { password: _, ...userWithoutPassword } = user

    return successResponse(
      {
        token: `mock-token-${user.id}-${userType}`,
        user: userWithoutPassword,
        userType,
      },
      'Login successful'
    )
  } catch (err) {
    return errorResponse(err, 'Login failed', 500)
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders(),
  })
}
