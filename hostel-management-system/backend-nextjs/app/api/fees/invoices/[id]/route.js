import { prisma } from '@/lib/db/prisma'
import { successResponse, errorResponse, corsHeaders } from '@/lib/utils/response'

export async function GET(req, { params }) {
  try {
    const { id } = params
    const invoice = await prisma.invoice.findUnique({
      where: { id: parseInt(id) },
      include: {
        student: true,
      },
    })

    if (!invoice) {
      return errorResponse(null, 'Invoice not found', 404)
    }

    return successResponse(invoice, 'Invoice retrieved successfully')
  } catch (err) {
    return errorResponse(err, 'Failed to retrieve invoice', 500)
  }
}

export async function PUT(req, { params }) {
  try {
    const { id } = params
    const body = await req.json()

    const invoice = await prisma.invoice.update({
      where: { id: parseInt(id) },
      data: {
        amount: body.amount ? parseFloat(body.amount) : undefined,
        status: body.status,
        dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
      },
      include: {
        student: true,
      },
    })

    return successResponse(invoice, 'Invoice updated successfully')
  } catch (err) {
    return errorResponse(err, 'Failed to update invoice', 500)
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = params

    await prisma.invoice.delete({
      where: { id: parseInt(id) },
    })

    return successResponse(null, 'Invoice deleted successfully')
  } catch (err) {
    return errorResponse(err, 'Failed to delete invoice', 500)
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders(),
  })
}
