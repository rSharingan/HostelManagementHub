import { prisma } from '@/lib/db/prisma'
import { successResponse, errorResponse, corsHeaders } from '@/lib/utils/response'

export async function GET(req) {
  try {
    const payments = await prisma.payment.findMany({
      include: {
        student: true,
        invoice: true,
      },
    })

    return successResponse(payments, 'Payments retrieved successfully')
  } catch (err) {
    return errorResponse(err, 'Failed to retrieve payments', 500)
  }
}

export async function POST(req) {
  try {
    const body = await req.json()
    const { invoiceId, studentId, amount, paymentDate, method, reference } = body

    if (!invoiceId || !studentId || !amount) {
      return errorResponse(null, 'Invoice ID, Student ID, and amount required', 400)
    }

    // Create payment
    const payment = await prisma.payment.create({
      data: {
        invoiceId,
        studentId,
        amount: parseFloat(amount),
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        method,
        reference,
      },
      include: {
        student: true,
        invoice: true,
      },
    })

    // Update invoice status to PAID
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: 'PAID' },
    })

    return successResponse(payment, 'Payment recorded successfully', 201)
  } catch (err) {
    return errorResponse(err, 'Failed to record payment', 500)
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders(),
  })
}
