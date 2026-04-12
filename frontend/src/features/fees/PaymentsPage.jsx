// path: src/features/fees/PaymentsPage.jsx
import { useMemo, useState } from 'react'
import { PageHeader } from '../../components/common/PageHeader'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { DataTable } from '../../components/common/DataTable'
import { CountdownTimer } from '../../components/common/CountdownTimer'
import {
  useCreatePayment,
  useCreateStaffSalaryPrompt,
  useInitiateStaffPayment,
  useMyStaffPayments,
  usePayments,
  usePayRent,
  useRentStatus,
  useResolveStaffSalaryPrompt,
  useStaffPayments,
  useStaffSalaryPrompts,
  useUserBalance,
} from './hooks'
import Input from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { formatCurrency } from '../../lib/utils'
import { toast } from 'sonner'
import { useAuth } from '../auth/hooks'
import { useStaff } from '../staff/hooks'

export const PaymentsPage = () => {
  const { user } = useAuth()
  const { data = [], isLoading } = usePayments()
  const { data: rentStatus } = useRentStatus({ studentEmail: user?.email }, user?.role === 'STUDENT')
  const { data: allStaff = [] } = useStaff()
  const myStaffProfile = useMemo(
    () => allStaff.find((member) => String(member.email).toLowerCase() === String(user?.email || '').toLowerCase()),
    [allStaff, user?.email]
  )
  const { data: adminStaffPayments = [] } = useStaffPayments({}, user?.role === 'ADMIN')
  const { data: myStaffPayments = [] } = useMyStaffPayments(user?.email, ['WARDEN', 'CARETAKER'].includes(user?.role))
  const { data: salaryPrompts = [] } = useStaffSalaryPrompts({ email: user?.email }, Boolean(user?.email))
  const { data: balanceInfo } = useUserBalance(user?.email, Boolean(user?.email))
  const createPayment = useCreatePayment()
  const payRent = usePayRent()
  const initiateStaffPayment = useInitiateStaffPayment()
  const createStaffSalaryPrompt = useCreateStaffSalaryPrompt()
  const resolveStaffSalaryPrompt = useResolveStaffSalaryPrompt()
  const [form, setForm] = useState({
    invoiceId: '',
    studentId: '',
    amount: '',
    method: 'BKASH',
    reference: '',
  })
  const [rentMethod, setRentMethod] = useState('BKASH')
  const now = new Date()
  const [staffPayForm, setStaffPayForm] = useState({
    staffUserId: '',
    cycleMonth: String(now.getMonth() + 1),
    cycleYear: String(now.getFullYear()),
    method: 'BKASH',
    notes: '',
  })

  const selectedStaffSalary = useMemo(() => {
    const selected = allStaff.find((member) => String(member.id) === String(staffPayForm.staffUserId || ''))
    return Number(selected?.salary || 0)
  }, [allStaff, staffPayForm.staffUserId])

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
      setForm({ invoiceId: '', studentId: '', amount: '', method: 'BKASH', reference: '' })
    } catch {
      toast.error('Failed to record payment')
    }
  }

  const handleStudentRentPayment = async () => {
    try {
      await payRent.mutateAsync({
        studentEmail: user?.email,
        method: rentMethod,
      })
      toast.success('Rent payment completed')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to complete rent payment')
    }
  }

  const handleInitiateStaffPayment = async (e) => {
    e.preventDefault()
    if (!staffPayForm.staffUserId) {
      toast.error('Select staff')
      return
    }

    try {
      const result = await initiateStaffPayment.mutateAsync({
        staffUserId: Number(staffPayForm.staffUserId),
        cycleMonth: Number(staffPayForm.cycleMonth),
        cycleYear: Number(staffPayForm.cycleYear),
        method: staffPayForm.method,
        initiatedByUserId: user?.id,
        notes: staffPayForm.notes,
      })

      if (!result?.redirectUrl) {
        toast.error('Could not start staff payment')
        return
      }

      window.location.href = result.redirectUrl
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to initiate staff payment')
    }
  }

  const handlePayDueStaff = async (staffMember, method = 'BKASH') => {
    try {
      const cycle = new Date()
      const result = await initiateStaffPayment.mutateAsync({
        staffUserId: Number(staffMember.id),
        cycleMonth: cycle.getMonth() + 1,
        cycleYear: cycle.getFullYear(),
        method,
        initiatedByUserId: user?.id,
        notes: `Auto salary payment for worked days: ${staffMember.workedDays || 0}`,
      })

      if (!result?.redirectUrl) {
        toast.error('Could not start staff payment')
        return
      }

      window.location.href = result.redirectUrl
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to pay staff salary')
    }
  }

  const handleSendPrompt = async () => {
    try {
      await createStaffSalaryPrompt.mutateAsync({
        staffEmail: user?.email,
        message: 'Salary due for this month. Please process payment.',
      })
      toast.success('Prompt sent to admin')
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to send prompt')
    }
  }

  const handleResolvePrompt = async (promptId) => {
    try {
      await resolveStaffSalaryPrompt.mutateAsync({ id: promptId, resolvedByEmail: user?.email })
      toast.success('Prompt resolved')
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to resolve prompt')
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

  const displayedStaffPayments = useMemo(() => {
    if (user?.role === 'ADMIN') {
      return adminStaffPayments
    }
    if (['WARDEN', 'CARETAKER'].includes(user?.role)) {
      return myStaffPayments
    }
    return []
  }, [adminStaffPayments, myStaffPayments, user?.role])

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
      accessorKey: 'created_at',
      cell: ({ row }) => row.original.created_at ? new Date(row.original.created_at).toLocaleDateString() : 'N/A',
    },
    { header: 'Method', accessorKey: 'method' },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: ({ row }) => (
        <Badge variant={
          row.original.status === 'SUCCESS' ? 'success' :
          row.original.status === 'FAILED' ? 'danger' :
          'warning'
        }>
          {row.original.status || 'PENDING'}
        </Badge>
      ),
    },
    { header: 'Transaction ID', accessorKey: 'transaction_id' },
    { header: 'Reference', accessorKey: 'reference' },
  ]

  const staffPaymentColumns = [
    { header: 'ID', accessorKey: 'id' },
    { header: 'Staff', accessorKey: 'staffName' },
    {
      header: 'Cycle',
      cell: ({ row }) => `${row.original.cycleMonth}/${row.original.cycleYear}`,
    },
    {
      header: 'Amount',
      accessorKey: 'amount',
      cell: ({ row }) => formatCurrency(row.original.amount),
    },
    { header: 'Method', accessorKey: 'method' },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: ({ row }) => (
        <Badge variant={
          row.original.status === 'SUCCESS' ? 'success' :
          row.original.status === 'FAILED' ? 'danger' :
          'warning'
        }>
          {row.original.status}
        </Badge>
      ),
    },
    { header: 'Transaction ID', accessorKey: 'transaction_id' },
  ]

  const staffDueColumns = [
    { header: 'Staff', accessorKey: 'name' },
    { header: 'Role', accessorKey: 'role' },
    { header: 'Worked Days', accessorKey: 'workedDays' },
    {
      header: 'Salary',
      accessorKey: 'salary',
      cell: ({ row }) => formatCurrency(row.original.salary),
    },
    {
      header: 'Cycle Status',
      cell: ({ row }) => (
        <Badge variant={row.original.isSalaryDue ? 'warning' : 'success'}>
          {row.original.isSalaryDue ? 'DUE' : 'PAID/LOCKED'}
        </Badge>
      ),
    },
    {
      header: 'Pay Via',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => handlePayDueStaff(row.original, 'BKASH')}
            disabled={!row.original.isSalaryDue || initiateStaffPayment.isPending}
          >
            Pay via bKash
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => handlePayDueStaff(row.original, 'NAGAD')}
            disabled={!row.original.isSalaryDue || initiateStaffPayment.isPending}
          >
            Pay via Nagad
          </Button>
        </div>
      ),
    },
  ]

  const staffPromptColumns = [
    { header: 'Staff', accessorKey: 'staffName' },
    {
      header: 'Cycle',
      cell: ({ row }) => `${row.original.cycleMonth}/${row.original.cycleYear}`,
    },
    { header: 'Message', accessorKey: 'message' },
    {
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.original.status === 'RESOLVED' ? 'success' : 'warning'}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      header: 'Action',
      cell: ({ row }) => (
        <Button
          size="sm"
          onClick={() => handleResolvePrompt(row.original.id)}
          disabled={row.original.status === 'RESOLVED' || resolveStaffSalaryPrompt.isPending}
        >
          Resolve
        </Button>
      ),
    },
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

      <Card className="mb-6">
        <CardContent className="py-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-700 dark:text-dark-300">Current Balance</span>
            <span className="font-semibold text-emerald-700 dark:text-emerald-300">{formatCurrency(balanceInfo?.balance || user?.balance || 0)}</span>
          </div>
        </CardContent>
      </Card>

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
                <option value="BKASH">BKASH</option>
                <option value="NAGAD">NAGAD</option>
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
                {rentStatus.notifyRent && (
                  <div className="p-3 rounded-lg border border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-800 dark:bg-orange-900/20 dark:text-orange-300">
                    {rentStatus.canPayNow
                      ? `Rent notification: payment cycle is open. Pending cycles: ${rentStatus.pendingCycles}.`
                      : `Rent notification: you crossed day 25 (${rentStatus.daysUsed} days). Please pay by month end.`}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-700 dark:text-dark-300">Current room: {rentStatus.roomNumber || 'Not allocated'}</p>
                    <p className="text-gray-700 dark:text-dark-300">Occupied bed: {rentStatus.bedNumber ? `Bed ${rentStatus.bedNumber}` : 'N/A'}</p>
                    <p className="text-gray-700 dark:text-dark-300">Days used: {rentStatus.daysUsed}</p>
                    <p className="text-gray-700 dark:text-dark-300">Pending cycles: {rentStatus.pendingCycles}</p>
                  </div>
                  <div>
                    <p className="text-gray-700 dark:text-dark-300">Monthly rent: {formatCurrency(rentStatus.monthlyRent || 0)}</p>
                    <p className="text-gray-700 dark:text-dark-300">Months paid: {rentStatus.monthsPaid || 0}</p>
                    <p className="text-gray-700 dark:text-dark-300">Balance: {formatCurrency(rentStatus.currentBalance || balanceInfo?.balance || 0)}</p>
                    <p className="text-gray-700 dark:text-dark-300">Room change: {rentStatus.canRequestRoomChange ? 'Allowed' : `Allowed in ${rentStatus.daysUntilRoomChangeAllowed || 0} day(s)`}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-dark-700">
                  <CountdownTimer
                    targetAt={rentStatus.nextPaymentDueAt}
                    daysUntil={rentStatus.daysUntilPaymentDue}
                  />
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-dark-700 space-y-2">
                  <p className="text-sm text-green-600 dark:text-green-400">Consecutive payment months: {rentStatus.consecutiveMonths || 0}</p>
                  <p className="text-sm text-cyan-600 dark:text-cyan-300">Next cycle: {rentStatus.nextCycleToPay}</p>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-dark-300 mb-1">Pay Via</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-800 text-gray-900 dark:text-dark-50"
                      value={rentMethod}
                      onChange={(e) => setRentMethod(e.target.value)}
                    >
                      <option value="BKASH">bKash</option>
                      <option value="NAGAD">Nagad</option>
                    </select>
                  </div>
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

      {user?.role === 'ADMIN' && (
        <Card className="mt-6">
          <CardHeader>
            <h3 className="text-lg font-semibold">Staff Salary Payment Cycle</h3>
          </CardHeader>
          <CardContent>
            <form className="grid grid-cols-1 md:grid-cols-7 gap-3" onSubmit={handleInitiateStaffPayment}>
              <select
                className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-800 text-gray-900 dark:text-dark-50"
                value={staffPayForm.staffUserId}
                onChange={(e) => setStaffPayForm((prev) => ({ ...prev, staffUserId: e.target.value }))}
                required
              >
                <option value="">Select Staff</option>
                {allStaff.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name} ({member.role})
                  </option>
                ))}
              </select>
              <Input
                name="calculatedSalary"
                type="number"
                placeholder="Salary"
                value={selectedStaffSalary}
                readOnly
                helperText="Automatically taken from staff salary policy"
              />
              <Input
                name="cycleMonth"
                type="number"
                min="1"
                max="12"
                placeholder="Month"
                value={staffPayForm.cycleMonth}
                onChange={(e) => setStaffPayForm((prev) => ({ ...prev, cycleMonth: e.target.value }))}
                required
              />
              <Input
                name="cycleYear"
                type="number"
                min="2000"
                placeholder="Year"
                value={staffPayForm.cycleYear}
                onChange={(e) => setStaffPayForm((prev) => ({ ...prev, cycleYear: e.target.value }))}
                required
              />
              <select
                className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-800 text-gray-900 dark:text-dark-50"
                value={staffPayForm.method}
                onChange={(e) => setStaffPayForm((prev) => ({ ...prev, method: e.target.value }))}
              >
                <option value="BKASH">BKASH</option>
                <option value="NAGAD">NAGAD</option>
              </select>
              <Input
                name="notes"
                placeholder="Notes"
                value={staffPayForm.notes}
                onChange={(e) => setStaffPayForm((prev) => ({ ...prev, notes: e.target.value }))}
              />
              <Button type="submit" disabled={initiateStaffPayment.isPending}>
                {initiateStaffPayment.isPending ? 'Initiating...' : 'Pay Staff'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {user?.role === 'ADMIN' && (
        <Card className="mt-6">
          <CardHeader>
            <h3 className="text-lg font-semibold">Staff Worked Duration and Salary Due</h3>
          </CardHeader>
          <CardContent className="p-8 text-center">
            <DataTable
              columns={staffDueColumns}
              data={allStaff}
              searchKey="name"
              searchPlaceholder="Search staff due list..."
            />
          </CardContent>
        </Card>
      )}

      {['WARDEN', 'CARETAKER'].includes(user?.role) && myStaffProfile?.isSalaryDue && (
        <Card className="mt-6 border-amber-300 dark:border-amber-700">
          <CardHeader>
            <h3 className="text-lg font-semibold">Salary Pending</h3>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-amber-700 dark:text-amber-300">
              You have worked {myStaffProfile.workedDays} days and your salary is pending for this cycle.
            </p>
            <Button onClick={handleSendPrompt} disabled={createStaffSalaryPrompt.isPending}>
              {createStaffSalaryPrompt.isPending ? 'Sending...' : 'Prompt Admin for Salary'}
            </Button>
          </CardContent>
        </Card>
      )}

      {user?.role === 'ADMIN' && (
        <Card className="mt-6">
          <CardHeader>
            <h3 className="text-lg font-semibold">Salary Prompts from Staff</h3>
          </CardHeader>
          <CardContent className="p-8 text-center">
            <DataTable
              columns={staffPromptColumns}
              data={salaryPrompts}
              searchKey="staffName"
              searchPlaceholder="Search salary prompts..."
            />
          </CardContent>
        </Card>
      )}

      {(user?.role === 'ADMIN' || user?.role === 'WARDEN' || user?.role === 'CARETAKER') && (
        <Card className="mt-6">
          <CardHeader>
            <h3 className="text-lg font-semibold">Staff Salary Payments</h3>
          </CardHeader>
          <CardContent className="p-8 text-center">
            <DataTable
              columns={staffPaymentColumns}
              data={displayedStaffPayments}
              searchKey="staffName"
              searchPlaceholder="Search salary payments..."
            />
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
