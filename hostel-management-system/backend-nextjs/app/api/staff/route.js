import { prisma } from '@/lib/db/prisma'
import { successResponse, errorResponse, corsHeaders } from '@/lib/utils/response'

export async function GET(req) {
  try {
    // Get staff from both StaffMember and User tables
    const staffMembers = await prisma.staffMember.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        position: true,
        department: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    const staffUsers = await prisma.user.findMany({
      where: {
        role: {
          in: ['ADMIN', 'WARDEN', 'CARETAKER'],
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // Combine and map to consistent format
    const combinedStaff = [
      ...staffMembers.map((s) => ({
        ...s,
        type: 'legacy',
      })),
      ...staffUsers.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        position: u.role,
        department: null,
        status: 'ACTIVE',
        type: 'user',
        role: u.role,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      })),
    ]

    return successResponse(combinedStaff, 'Staff retrieved successfully')
  } catch (err) {
    return errorResponse(err, 'Failed to retrieve staff', 500)
  }
}

export async function POST(req) {
  try {
    const body = await req.json()
    const { name, email, position, department, status = 'ACTIVE' } = body

    if (!name) {
      return errorResponse(null, 'Name required', 400)
    }

    const staff = await prisma.staffMember.create({
      data: {
        name,
        email: email || null,
        position: position || null,
        department: department || null,
        status,
      },
    })

    return successResponse(staff, 'Staff created successfully', 201)
  } catch (err) {
    return errorResponse(err, 'Failed to create staff', 500)
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders(),
  })
}
