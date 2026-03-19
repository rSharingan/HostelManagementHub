// path: src/features/fees/InvoicesPage.jsx
import { useState } from 'react'
import { Plus, Trash2, Edit2 } from 'lucide-react'
import { useInvoices, useDeleteInvoice } from './hooks'
import { PageHeader } from '../../components/common/PageHeader'
import { DataTable } from '../../components/common/DataTable'
import { Button } from '../../components/ui/Button'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { TableSkeletons } from '../../components/common/Skeletons'
import { Badge } from '../../components/ui/Badge'
import { formatCurrency } from '../../lib/utils'
import { toast } from 'sonner'

export const InvoicesPage = () => {
  const { data: invoices = [], isLoading } = useInvoices()
  const deleteInvoice = useDeleteInvoice()
  const [deleteId, setDeleteId] = useState(null)

  const handleDelete = async () => {
    try {
      await deleteInvoice.mutateAsync(deleteId)
      toast.success('Invoice deleted successfully')
      setDeleteId(null)
    } catch (error) {
      toast.error('Failed to delete invoice')
    }
  }

  const columns = [
    {
      header: 'Student Name',
      accessorKey: 'studentName',
    },
    {
      header: 'Month',
      cell: ({ row }) => `${row.original.month}/${row.original.year}`,
    },
    {
      header: 'Amount',
      accessorKey: 'amount',
      cell: ({ row }) => formatCurrency(row.original.amount),
    },
    {
      header: 'Due Date',
      accessorKey: 'dueDate',
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: ({ row }) => (
        <Badge
          variant={row.original.status === 'PAID' ? 'success' : 'warning'}
        >
          {row.original.status}
        </Badge>
      ),
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
        title="Invoices"
        description="View and manage fee invoices"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Fees' },
          { label: 'Invoices' },
        ]}
        action={
          <Button className="gap-2">
            <Plus size={18} />
            New Invoice
          </Button>
        }
      />

      {isLoading ? (
        <TableSkeletons />
      ) : (
        <DataTable columns={columns} data={invoices} />
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Invoice"
        description="Are you sure you want to remove this invoice?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        isLoading={deleteInvoice.isPending}
      />
    </div>
  )
}
