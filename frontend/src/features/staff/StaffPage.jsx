// path: src/features/staff/StaffPage.jsx
import { useState } from 'react'
import { PageHeader } from '../../components/common/PageHeader'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { DataTable } from '../../components/common/DataTable'
import { useCreateStaff, useDeleteStaff, useStaff } from './hooks'
import { Badge } from '../../components/ui/Badge'
import { toast } from 'sonner'
import { formatCurrency } from '../../lib/utils'
import { useInitiateStaffPayment } from '../fees/hooks'
import { useAuth } from '../auth/hooks'

export const StaffPage = () => {
  const { user } = useAuth()
  const { data = [], isLoading } = useStaff()
  const createStaff = useCreateStaff()
  const deleteStaff = useDeleteStaff()
  const initiateStaffPayment = useInitiateStaffPayment()
  const today = new Date().toISOString().slice(0, 10)
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'WARDEN',
    hostelId: '1',
    phone: '',
    employmentStatus: 'ACTIVE',
    shift: 'DAY',
    specialty: '',
    joinedDate: today,
    salary: '',
  })

  const handleCreate = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirmPassword) {
      toast.error('Password and confirm password do not match')
      return
    }
    if (String(form.password).length < 6) {
      toast.error('Password must be at least 6 characters long')
      return
    }

    const payload = {
      name: form.name,
      email: form.email,
      password: form.password,
      role: form.role,
      hostelId: form.hostelId,
      phone: form.phone,
      employmentStatus: form.employmentStatus,
      shift: form.shift,
      specialty: form.specialty,
      joinedDate: form.joinedDate,
      salary: form.role === 'WARDEN' ? Number(form.salary || 0) : undefined,
    }

    try {
      await createStaff.mutateAsync(payload)
      toast.success('Staff member created')
      setForm({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'WARDEN',
        hostelId: '1',
        phone: '',
        employmentStatus: 'ACTIVE',
        shift: 'DAY',
        specialty: '',
        joinedDate: today,
        salary: '',
      })
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to create staff member')
    }
  }

  const handleDelete = async (id) => {
    try {
      await deleteStaff.mutateAsync(id)
      toast.success('Staff member deleted')
    } catch {
      toast.error('Failed to delete staff member')
    }
  }

  const handlePayDueStaff = async (staffMember, method = 'BKASH') => {
    try {
      const cycle = new Date()
      const result = await initiateStaffPayment.mutateAsync({
        staffUserId: Number(staffMember.id),
        amount: Number(staffMember.salary || 0),
        cycleMonth: cycle.getMonth() + 1,
        cycleYear: cycle.getFullYear(),
        method,
        initiatedByUserId: user?.id,
        notes: `Salary from staff list for ${staffMember.workedDays || 0} worked days`,
      })

      if (!result?.redirectUrl) {
        toast.error('Could not start staff payment')
        return
      }

      window.location.href = result.redirectUrl
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to initiate salary payment')
    }
  }

  const columns = [
    { header: 'ID', accessorKey: 'id' },
    { header: 'Name', accessorKey: 'name' },
    { header: 'Email', accessorKey: 'email' },
    { header: 'Phone', accessorKey: 'phone' },
    { header: 'Hostel ID', accessorKey: 'hostelId' },
    { header: 'Shift', accessorKey: 'shift' },
    { header: 'Specialty', accessorKey: 'specialty' },
    { header: 'Joined Date', accessorKey: 'joinedDate' },
    { header: 'Worked Days', accessorKey: 'workedDays' },
    {
      header: 'Salary',
      accessorKey: 'salary',
      cell: ({ row }) => formatCurrency(row.original.salary),
    },
    {
      header: 'Salary Status',
      cell: ({ row }) => <Badge variant={row.original.isSalaryDue ? 'warning' : 'success'}>{row.original.isSalaryDue ? 'DUE' : 'PAID/LOCKED'}</Badge>,
    },
    {
      header: 'Role',
      accessorKey: 'role',
      cell: ({ row }) => <Badge variant="primary">{row.original.role}</Badge>,
    },
    {
      header: 'Employment',
      accessorKey: 'employmentStatus',
      cell: ({ row }) => <Badge variant={row.original.employmentStatus === 'ACTIVE' ? 'success' : 'warning'}>{row.original.employmentStatus}</Badge>,
    },
    {
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => handlePayDueStaff(row.original, 'BKASH')}
            disabled={!row.original.isSalaryDue || initiateStaffPayment.isPending}
          >
            Pay
          </Button>
          <Button size="sm" variant="danger" onClick={() => handleDelete(row.original.id)}>
            Delete
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Staff"
        description="Manage hostel staff"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Staff' },
        ]}
      />

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Add Staff Member</h3>
        </CardHeader>
        <CardContent>
          <form className="grid grid-cols-1 md:grid-cols-12 gap-3" onSubmit={handleCreate}>
            <Input
              name="name"
              label="Full Name"
              placeholder="Full name"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              className="md:col-span-3"
              required
            />
            <Input
              name="email"
              label="Email"
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              className="md:col-span-3"
              required
            />
            <Input
              name="phone"
              label="Phone"
              type="tel"
              placeholder="+8801712345678"
              value={form.phone}
              onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
              className="md:col-span-2"
            />
            <Input
              name="password"
              label="Password"
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              className="md:col-span-2"
              required
            />
            <Input
              name="confirmPassword"
              label="Confirm Password"
              type="password"
              placeholder="Confirm password"
              value={form.confirmPassword}
              onChange={(e) => setForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
              className="md:col-span-2"
              required
            />
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-300 mb-1">Role</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-800 text-gray-900 dark:text-dark-50"
                value={form.role}
                onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}
              >
                <option value="WARDEN">WARDEN</option>
                <option value="CARETAKER">CARETAKER</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-300 mb-1">Employment</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-800 text-gray-900 dark:text-dark-50"
                value={form.employmentStatus}
                onChange={(e) => setForm((prev) => ({ ...prev, employmentStatus: e.target.value }))}
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="ON_LEAVE">ON_LEAVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-300 mb-1">Shift</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-800 text-gray-900 dark:text-dark-50"
                value={form.shift}
                onChange={(e) => setForm((prev) => ({ ...prev, shift: e.target.value }))}
              >
                <option value="DAY">DAY</option>
                <option value="NIGHT">NIGHT</option>
                <option value="FLEX">FLEX</option>
              </select>
            </div>
            <Input
              name="specialty"
              label="Specialty"
              placeholder="Electrical, Plumbing..."
              value={form.specialty}
              onChange={(e) => setForm((prev) => ({ ...prev, specialty: e.target.value }))}
              className="md:col-span-2"
            />
            <Input
              name="joinedDate"
              label="Joined Date"
              type="date"
              value={form.joinedDate}
              onChange={(e) => setForm((prev) => ({ ...prev, joinedDate: e.target.value }))}
              className="md:col-span-2"
            />
            <Input
              name="salary"
              label="Salary (BDT)"
              type="number"
              min="0"
              placeholder={form.role === 'CARETAKER' ? 'Fixed by policy' : 'Monthly salary'}
              value={form.salary}
              onChange={(e) => setForm((prev) => ({ ...prev, salary: e.target.value }))}
              className="md:col-span-2"
              disabled={form.role === 'CARETAKER'}
              required={form.role === 'WARDEN'}
            />
            <Input
              name="hostelId"
              label="Hostel ID"
              type="number"
              min="1"
              placeholder="Hostel ID"
              value={form.hostelId}
              onChange={(e) => setForm((prev) => ({ ...prev, hostelId: e.target.value }))}
              className="md:col-span-2"
              required
            />
            <Button type="submit" disabled={createStaff.isPending} className="md:col-span-2">
              Add Staff
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
              searchKey="name"
              searchPlaceholder="Search staff by name or email..."
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
