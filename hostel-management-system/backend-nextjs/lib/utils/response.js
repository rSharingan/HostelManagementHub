export function successResponse(data, message = 'Success', statusCode = 200) {
  return new Response(JSON.stringify({ success: true, message, data }), {
    status: statusCode,
    headers: corsHeaders(),
  })
}

export function errorResponse(error, message = 'Error', statusCode = 500) {
  return new Response(
    JSON.stringify({
      success: false,
      message,
      error: error?.message || error,
    }),
    {
      status: statusCode,
      headers: corsHeaders(),
    }
  )
}

export function methodNotAllowed() {
  return new Response(JSON.stringify({ success: false, message: 'Method not allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json' },
  })
}

export function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  }
}
