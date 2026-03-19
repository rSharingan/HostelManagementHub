// path: src/features/fees/PaymentsPage.jsx
import { useState } from 'react'
import { Plus, Trash2, Edit2 } from 'lucide-react'
import { usePayments, useDeletePayment } from './hooks'
import { PageHeader } from '../../components/common/PageHeader'
import { DataTable } from '../../components/common/DataTable'
import { Button } from '../../components/ui/Button'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { TableSkeletons } from '../../components/common/Skeletons'
import { Badge } from '../../components/ui/Badge'
import { formatCurrency } from '../../lib/utils'
import { toast } from 'sonner'

export const PaymentsPage = () => {
  const { data: payments = [], isLoading } = usePayments()
  const deletePayment = useDeletePayment()
  const [deleteId, setDeleteId] = useState(null)

  const handleDelete = async () => {
    try {
      await deletePayment.mutateAsync(deleteId)
      toast.success('Payment deleted successfully')
      setDeleteId(null)
    } catch (error) {
      toast.error('Failed to delete payment')
    }
  }

  const columns = [
    {
      header: 'Student Name',
      accessorKey: 'studentName',
    },
    {
      header: 'Amount',
      accessorKey: 'amount',
      cell: ({ row }) => formatCurrency(row.original.amount),
    },
    {
      header: 'Payment Date',
      accessorKey: 'paymentDate',
    },
    {
      header: 'Method',
      accessorKey: 'method',
      cell: ({ row }) => (
        <Badge variant="primary">{row.original.method}</Badge>
      ),
    },
    {
      header: 'Reference',
      accessorKey: 'reference',
    },
    {
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm">
            <Edit2 size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeleteId(row.original.id)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 size={16} />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Payments"
        description="View and manage fee payments"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Fees' },
          { label: 'Payments' },
        ]}
        action={
          <Button className="gap-2">
            <Plus size={18} />
            Record Payment
          </Button>
        }
      />

      {isLoading ? (
        <TableSkeletons />
      ) : (
        <DataTable columns={columns} data={payments} />
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Payment"
        description="Are you sure you want to remove this payment record?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        isLoading={deletePayment.isPending}
      />
    </div>
  )
}
