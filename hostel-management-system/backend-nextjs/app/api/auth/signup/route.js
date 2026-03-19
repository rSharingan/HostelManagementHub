import { prisma } from '@/lib/db/prisma'
import { successResponse, errorResponse, corsHeaders } from '@/lib/utils/response'

export async function POST(req) {
  try {
    const { name, email, password, role = 'ADMIN' } = await req.json()

    // Validation
    if (!name || !email || !password) {
      return errorResponse(null, 'Name, email and password required', 400)
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return errorResponse(null, 'Invalid email format', 400)
    }

    if (password.length < 6) {
      return errorResponse(null, 'Password must be at least 6 characters long', 400)
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return errorResponse(null, 'Email already registered', 409)
    }

    // Create new user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password, // Note: In production, hash the password
        role: role.toUpperCase(),
      },
    })

    const { password: _, ...userWithoutPassword } = user

    return successResponse(
      {
        token: `mock-token-${user.id}-${role.toLowerCase()}`,
        user: userWithoutPassword,
        userType: role.toLowerCase(),
      },
      'Signup successful'
    )
  } catch (err) {
    console.error('Signup error:', err)
    return errorResponse(err, 'Signup failed', 500)
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders(),
  })
}
