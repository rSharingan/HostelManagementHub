import { successResponse, corsHeaders } from '@/lib/utils/response'

export async function POST() {
  return successResponse(null, 'Logout successful')
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders(),
  })
}
