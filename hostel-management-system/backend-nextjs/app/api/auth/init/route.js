import { prisma } from '@/lib/db/prisma'
import { successResponse, errorResponse, corsHeaders } from '@/lib/utils/response'

export async function GET(req) {
  try {
    // Run Prisma migrations and seed
    const seedFile = require('@/prisma/seed.js')
    
    return successResponse(null, 'Database initialized successfully')
  } catch (err) {
    return errorResponse(err, 'Initialization failed', 500)
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders(),
  })
}
