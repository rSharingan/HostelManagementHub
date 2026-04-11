// path: src/features/fees/InvoicesPage.jsx
import { useState } from 'react'
import { PageHeader } from '../../components/common/PageHeader'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { DataTable } from '../../components/common/DataTable'
import Input from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { useCreateInvoice, useInvoices, useUpdateInvoice } from './hooks'
import { Badge } from '../../components/ui/Badge'
import { formatCurrency } from '../../lib/utils'
import { toast } from 'sonner'

export const InvoicesPage = () => {
  const { data = [], isLoading } = useInvoices()
  const createInvoice = useCreateInvoice()
  const updateInvoice = useUpdateInvoice()
  const [form, setForm] = useState({
    studentId: '',
    amount: '',
    dueDate: '',
    description: '',
  })

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      await createInvoice.mutateAsync({
        studentId: Number(form.studentId),
        amount: Number(form.amount),
        dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : undefined,
        description: form.description,
        status: 'PENDING',
      })
      toast.success('Invoice created')
      setForm({ studentId: '', amount: '', dueDate: '', description: '' })
    } catch {
      toast.error('Failed to create invoice')
    }
  }

  const handleMarkPaid = async (row) => {
    try {
      await updateInvoice.mutateAsync({
        id: row.id,
        data: {
          ...row,
          status: 'PAID',
        },
      })
      toast.success('Invoice marked as paid')
    } catch {
      toast.error('Failed to update invoice')
    }
  }

  const columns = [
    { header: 'ID', accessorKey: 'id' },
    { header: 'Student ID', accessorKey: 'studentId' },
    {
      header: 'Amount',
      accessorKey: 'amount',
      cell: ({ row }) => formatCurrency(row.original.amount),
    },
    {
      header: 'Due Date',
      accessorKey: 'dueDate',
      cell: ({ row }) => new Date(row.original.dueDate).toLocaleDateString(),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: ({ row }) => (
        <Badge variant={row.original.status === 'PAID' ? 'success' : 'warning'}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      cell: ({ row }) => (
        <Button
          size="sm"
          variant="secondary"
          onClick={() => handleMarkPaid(row.original)}
          disabled={row.original.status === 'PAID'}
        >
          Mark Paid
        </Button>
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
      />

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Create Invoice</h3>
        </CardHeader>
        <CardContent>
          <form className="grid grid-cols-1 md:grid-cols-5 gap-3" onSubmit={handleCreate}>
            <Input
              name="studentId"
              type="number"
              placeholder="Student ID"
              value={form.studentId}
              onChange={(e) => setForm((prev) => ({ ...prev, studentId: e.target.value }))}
              required
            />
            <Input
              name="amount"
              type="number"
              placeholder="Amount"
              value={form.amount}
              onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
              required
            />
            <Input
              name="dueDate"
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm((prev) => ({ ...prev, dueDate: e.target.value }))}
            />
            <Input
              name="description"
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            />
            <Button type="submit" disabled={createInvoice.isPending}>
              Add Invoice
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardContent className="p-8 text-center">
          {isLoading ? (
            <p className="text-gray-600 dark:text-dark-400">Loading...</p>
          ) : (
            <DataTable
              columns={columns}
              data={data}
              searchKey="studentId"
              searchPlaceholder="Search invoices..."
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
