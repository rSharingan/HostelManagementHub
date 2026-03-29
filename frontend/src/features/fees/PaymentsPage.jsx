// path: src/features/fees/PaymentsPage.jsx
import { useState } from 'react'
import { PageHeader } from '../../components/common/PageHeader'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { DataTable } from '../../components/common/DataTable'
import { useCreatePayment, usePayments } from './hooks'
import Input from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { formatCurrency } from '../../lib/utils'
import { toast } from 'sonner'

export const PaymentsPage = () => {
  const { data = [], isLoading } = usePayments()
  const createPayment = useCreatePayment()
  const [form, setForm] = useState({
    invoiceId: '',
    studentId: '',
    amount: '',
    method: 'CASH',
    reference: '',
  })

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      await createPayment.mutateAsync({
        invoiceId: form.invoiceId ? Number(form.invoiceId) : null,
        studentId: Number(form.studentId),
        amount: Number(form.amount),
        method: form.method,
        reference: form.reference,
      })
      toast.success('Payment recorded')
      setForm({ invoiceId: '', studentId: '', amount: '', method: 'CASH', reference: '' })
    } catch {
      toast.error('Failed to record payment')
    }
  }

  const columns = [
    { header: 'ID', accessorKey: 'id' },
    { header: 'Invoice ID', accessorKey: 'invoiceId' },
    { header: 'Student ID', accessorKey: 'studentId' },
    {
      header: 'Amount',
      accessorKey: 'amount',
      cell: ({ row }) => formatCurrency(row.original.amount),
    },
    {
      header: 'Date',
      accessorKey: 'paymentDate',
      cell: ({ row }) => new Date(row.original.paymentDate).toLocaleDateString(),
    },
    { header: 'Method', accessorKey: 'method' },
    { header: 'Reference', accessorKey: 'reference' },
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
      />

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Record Payment</h3>
        </CardHeader>
        <CardContent>
          <form className="grid grid-cols-1 md:grid-cols-6 gap-3" onSubmit={handleCreate}>
            <Input
              name="invoiceId"
              type="number"
              placeholder="Invoice ID (optional)"
              value={form.invoiceId}
              onChange={(e) => setForm((prev) => ({ ...prev, invoiceId: e.target.value }))}
            />
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
            <select
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white dark:bg-slate-800"
              value={form.method}
              onChange={(e) => setForm((prev) => ({ ...prev, method: e.target.value }))}
            >
              <option value="CASH">CASH</option>
              <option value="CARD">CARD</option>
              <option value="BANK_TRANSFER">BANK_TRANSFER</option>
            </select>
            <Input
              name="reference"
              placeholder="Reference"
              value={form.reference}
              onChange={(e) => setForm((prev) => ({ ...prev, reference: e.target.value }))}
            />
            <Button type="submit" disabled={createPayment.isPending}>
              Add Payment
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardContent className="p-8 text-center">
          {isLoading ? (
            <p className="text-slate-600 dark:text-slate-400">Loading...</p>
          ) : (
            <DataTable
              columns={columns}
              data={data}
              searchKey="studentId"
              searchPlaceholder="Search payments..."
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
