import { prisma } from '@/lib/db/prisma'
import { successResponse, errorResponse, corsHeaders } from '@/lib/utils/response'
import { authMiddleware } from '@/lib/utils/auth'

export async function POST(req) {
  try {
    const authResult = await authMiddleware(req)
    if (!authResult.success) {
      return errorResponse(null, authResult.message, 401)
    }

    const { user, userType } = authResult

    if (userType !== 'student') {
      return errorResponse(null, 'Access denied. Student access required.', 403)
    }

    const { invoiceId, amount, method = 'ONLINE', reference } = await req.json()

    if (!invoiceId || !amount) {
      return errorResponse(null, 'Invoice ID and amount are required', 400)
    }

    // Verify the invoice belongs to the student
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: parseInt(invoiceId),
        studentId: user.id,
        status: 'PENDING',
      },
    })

    if (!invoice) {
      return errorResponse(null, 'Invoice not found or already paid', 404)
    }

    if (parseFloat(amount) !== parseFloat(invoice.amount)) {
      return errorResponse(null, 'Payment amount must match invoice amount', 400)
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        invoiceId: parseInt(invoiceId),
        studentId: user.id,
        amount: parseFloat(amount),
        paymentDate: new Date(),
        method,
        reference,
      },
    })

    // Update invoice status to PAID
    await prisma.invoice.update({
      where: { id: parseInt(invoiceId) },
      data: { status: 'PAID' },
    })

    return successResponse(payment, 'Payment processed successfully')
  } catch (err) {
    return errorResponse(err, 'Failed to process payment', 500)
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders(),
  })
}