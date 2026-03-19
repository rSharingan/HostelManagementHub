// path: lib/utils/auth.js
import { prisma } from '@/lib/db/prisma'

export async function authMiddleware(req) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { success: false, message: 'Authorization header missing or invalid' }
    }

    const token = authHeader.substring(7) // Remove 'Bearer '

    // For now, we'll decode the mock token
    // In production, you'd verify JWT
    const tokenParts = token.split('-')
    if (tokenParts.length < 3 || tokenParts[0] !== 'mock' || tokenParts[1] !== 'token') {
      return { success: false, message: 'Invalid token format' }
    }

    const userId = parseInt(tokenParts[2])
    const userType = tokenParts[3] || 'staff'

    let user
    if (userType === 'student') {
      user = await prisma.student.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          registrationNumber: true,
          department: true,
          yearOfStudy: true,
        },
      })
    } else {
      user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      })
    }

    if (!user) {
      return { success: false, message: 'User not found' }
    }

    return { success: true, user: { ...user, role: userType === 'student' ? 'STUDENT' : user.role }, userType }
  } catch (error) {
    return { success: false, message: 'Authentication failed' }
  }
}