import { prisma } from '@/lib/db/prisma'
import { successResponse, errorResponse, corsHeaders } from '@/lib/utils/response'

export async function GET(req) {
  try {
    const pendingInvoices = await prisma.invoice.findMany({
      where: { status: 'PENDING' },
      include: {
        student: true,
      },
    })

    let totalDues = 0
    const byStudent = []

    pendingInvoices.forEach((invoice) => {
      totalDues += invoice.amount
      byStudent.push({
        studentName: invoice.student.name,
        studentEmail: invoice.student.email,
        amount: invoice.amount,
        dueDate: invoice.dueDate,
      })
    })

    return successResponse(
      {
        totalDues,
        pendingCount: pendingInvoices.length,
        byStudent,
      },
      'Dues report retrieved successfully'
    )
  } catch (err) {
    return errorResponse(err, 'Failed to retrieve dues report', 500)
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders(),
  })
}
