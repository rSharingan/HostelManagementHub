import { prisma } from '@/lib/db/prisma'
import { successResponse, errorResponse, corsHeaders } from '@/lib/utils/response'

export async function GET(req) {
  try {
    const invoices = await prisma.invoice.findMany({
      include: {
        student: true,
      },
    })

    return successResponse(invoices, 'Invoices retrieved successfully')
  } catch (err) {
    return errorResponse(err, 'Failed to retrieve invoices', 500)
  }
}

export async function POST(req) {
  try {
    const body = await req.json()
    const { studentId, amount, dueDate, status = 'PENDING', month, year } = body

    if (!studentId || !amount) {
      return errorResponse(null, 'Student ID and amount required', 400)
    }

    const invoice = await prisma.invoice.create({
      data: {
        studentId,
        amount: parseFloat(amount),
        dueDate: dueDate ? new Date(dueDate) : null,
        status,
        month,
        year,
      },
      include: {
        student: true,
      },
    })

    return successResponse(invoice, 'Invoice created successfully', 201)
  } catch (err) {
    return errorResponse(err, 'Failed to create invoice', 500)
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders(),
  })
}
