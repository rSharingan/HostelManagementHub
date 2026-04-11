// path: src/features/fees/PaymentsPage.jsx
import { useMemo, useState } from 'react'
import { PageHeader } from '../../components/common/PageHeader'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { DataTable } from '../../components/common/DataTable'
import { CountdownTimer } from '../../components/common/CountdownTimer'
import { useCreatePayment, usePayments, usePayRent, useRentStatus } from './hooks'
import Input from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { formatCurrency } from '../../lib/utils'
import { toast } from 'sonner'
import { useAuth } from '../auth/hooks'

export const PaymentsPage = () => {
  const { user } = useAuth()
  const { data = [], isLoading } = usePayments()
  const { data: rentStatus } = useRentStatus({ studentEmail: user?.email }, user?.role === 'STUDENT')
  const createPayment = useCreatePayment()
  const payRent = usePayRent()
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

  const handleStudentRentPayment = async () => {
    try {
      await payRent.mutateAsync({
        studentEmail: user?.email,
        method: 'CARD',
      })
      toast.success('Rent payment completed')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to complete rent payment')
    }
  }

  const displayedPayments = useMemo(() => {
    if (user?.role !== 'STUDENT') {
      return data
    }

    if (!rentStatus?.studentId) {
      return []
    }

    return data.filter((row) => String(row.studentId) === String(rentStatus.studentId))
  }, [data, rentStatus?.studentId, user?.role])

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
        description={user?.role === 'STUDENT' ? 'Track and pay your hostel rent' : 'View and manage fee payments'}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Fees' },
          { label: 'Payments' },
        ]}
      />

      {user?.role !== 'STUDENT' ? (
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
                className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-800 text-gray-900 dark:text-dark-50"
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
      ) : (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Current Rent Window</h3>
          </CardHeader>
          <CardContent>
            {!rentStatus ? (
              <p className="text-gray-600 dark:text-dark-400">Loading rent status...</p>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-700 dark:text-dark-300">Days used: {rentStatus.daysUsed}</p>
                    <p className="text-gray-700 dark:text-dark-300">Pending cycles: {rentStatus.pendingCycles}</p>
                  </div>
                  <div>
                    <p className="text-gray-700 dark:text-dark-300">Monthly rent: {formatCurrency(rentStatus.monthlyRent || 0)}</p>
                    <p className="text-gray-700 dark:text-dark-300">Months paid: {rentStatus.monthsPaid || 0}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-dark-700">
                  <CountdownTimer daysUntil={rentStatus.daysUntilPaymentDue} />
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-dark-700 space-y-2">
                  <p className="text-sm text-green-600 dark:text-green-400">Consecutive payment months: {rentStatus.consecutiveMonths || 0}</p>
                  <p className="text-sm text-cyan-600 dark:text-cyan-300">Next cycle: {rentStatus.nextCycleToPay}</p>
                  <Button
                    onClick={handleStudentRentPayment}
                    disabled={!rentStatus.canPayNow || payRent.isPending}
                    className="w-full"
                  >
                    {payRent.isPending ? 'Processing...' : rentStatus.canPayNow ? 'Pay Current Rent' : 'Payment Locked'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="mt-6">
        <CardContent className="p-8 text-center">
          {isLoading ? (
            <p className="text-gray-600 dark:text-dark-400">Loading...</p>
          ) : (
            <DataTable
              columns={columns}
              data={displayedPayments}
              searchKey="studentId"
              searchPlaceholder="Search payments..."
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
