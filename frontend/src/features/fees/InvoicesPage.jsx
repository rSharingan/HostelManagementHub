// path: src/features/fees/InvoicesPage.jsx
import { useState } from 'react'
import { PageHeader } from '../../components/common/PageHeader'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { DataTable } from '../../components/common/DataTable'
import Input from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { useCreateInvoice, useInvoices, useUpdateInvoice, useInitiatePayment } from './hooks'
import { Badge } from '../../components/ui/Badge'
import { formatCurrency } from '../../lib/utils'
import { toast } from 'sonner'

export const InvoicesPage = () => {
  const { data = [], isLoading } = useInvoices()
  const createInvoice = useCreateInvoice()
  const updateInvoice = useUpdateInvoice()
  const initiatePayment = useInitiatePayment()
  const [form, setForm] = useState({
    studentId: '',
    amount: '',
    dueDate: '',
    description: '',
  })
  const [payMethod, setPayMethod] = useState('BKASH')

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

  const handlePayNow = async (row) => {
    try {
      console.log('🔵 Pay Now clicked for invoice:', row)
      console.log('📤 Sending payment initiation request with:', {
        invoiceId: row.id,
        studentId: row.studentId,
        amount: row.amount,
        method: payMethod,
      })

      const result = await initiatePayment.mutateAsync({
        invoiceId: row.id,
        studentId: row.studentId,
        amount: row.amount,
        method: payMethod,
      })

      console.log('✅ Payment initiated successfully. Response:', result)

      if (!result || !result.redirectUrl) {
        console.error('❌ Invalid response: No redirectUrl provided', result)
        toast.error('Payment initialization failed: No redirect URL provided')
        return
      }

      console.log('🔗 Redirecting to payment URL:', result.redirectUrl)
      // Redirect to payment URL
      window.location.href = result.redirectUrl
    } catch (error) {
      console.error('❌ Payment initiation error:', error)
      console.error('Error response:', error?.response?.data)
      console.error('Error message:', error?.message)
      
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to initiate payment'
      toast.error(errorMessage)
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
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => handleMarkPaid(row.original)}
            disabled={row.original.status === 'PAID'}
          >
            Mark Paid
          </Button>
          {row.original.status === 'PENDING' && (
            <Button
              size="sm"
              variant="primary"
              onClick={() => handlePayNow(row.original)}
              disabled={initiatePayment.isPending}
            >
              Pay Now
            </Button>
          )}
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
      />

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Create Invoice</h3>
        </CardHeader>
        <CardContent>
          <div className="mb-3 max-w-xs">
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-300 mb-1">Pay Via</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-800 text-gray-900 dark:text-dark-50"
              value={payMethod}
              onChange={(e) => setPayMethod(e.target.value)}
            >
              <option value="BKASH">bKash</option>
              <option value="NAGAD">Nagad</option>
            </select>
          </div>
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
