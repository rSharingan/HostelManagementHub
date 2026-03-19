import { prisma } from '@/lib/db/prisma'
import { successResponse, errorResponse, corsHeaders } from '@/lib/utils/response'

export async function GET(req, { params }) {
  try {
    const { id } = params
    const payment = await prisma.payment.findUnique({
      where: { id: parseInt(id) },
      include: {
        student: true,
        invoice: true,
      },
    })

    if (!payment) {
      return errorResponse(null, 'Payment not found', 404)
    }

    return successResponse(payment, 'Payment retrieved successfully')
  } catch (err) {
    return errorResponse(err, 'Failed to retrieve payment', 500)
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = params

    // Get payment to revert invoice status
    const payment = await prisma.payment.findUnique({
      where: { id: parseInt(id) },
    })

    if (payment) {
      // Update invoice status back to PENDING
      await prisma.invoice.update({
        where: { id: payment.invoiceId },
        data: { status: 'PENDING' },
      })
    }

    await prisma.payment.delete({
      where: { id: parseInt(id) },
    })

    return successResponse(null, 'Payment deleted successfully')
  } catch (err) {
    return errorResponse(err, 'Failed to delete payment', 500)
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders(),
  })
}
