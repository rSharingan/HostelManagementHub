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

export const StaffPage = () => {
  const { data = [], isLoading } = useStaff()
  const createStaff = useCreateStaff()
  const deleteStaff = useDeleteStaff()
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'WARDEN',
    hostelId: '1',
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
    }

    try {
      await createStaff.mutateAsync(payload)
      toast.success('Staff member created')
      setForm({ name: '', email: '', password: '', confirmPassword: '', role: 'WARDEN', hostelId: '1' })
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

  const columns = [
    { header: 'ID', accessorKey: 'id' },
    { header: 'Name', accessorKey: 'name' },
    { header: 'Email', accessorKey: 'email' },
    { header: 'Hostel ID', accessorKey: 'hostelId' },
    {
      header: 'Role',
      accessorKey: 'role',
      cell: ({ row }) => <Badge variant="primary">{row.original.role}</Badge>,
    },
    {
      header: 'Actions',
      cell: ({ row }) => (
        <Button size="sm" variant="danger" onClick={() => handleDelete(row.original.id)}>
          Delete
        </Button>
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
          <form className="grid grid-cols-1 md:grid-cols-7 gap-3" onSubmit={handleCreate}>
            <Input
              name="name"
              label="Full Name"
              placeholder="Full name"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              required
            />
            <Input
              name="email"
              label="Email"
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              required
            />
            <Input
              name="password"
              label="Password"
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              required
            />
            <Input
              name="confirmPassword"
              label="Confirm Password"
              type="password"
              placeholder="Confirm password"
              value={form.confirmPassword}
              onChange={(e) => setForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
              required
            />
            <div>
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
            <Input
              name="hostelId"
              label="Hostel ID"
              type="number"
              min="1"
              placeholder="Hostel ID"
              value={form.hostelId}
              onChange={(e) => setForm((prev) => ({ ...prev, hostelId: e.target.value }))}
              required
            />
            <Button type="submit" disabled={createStaff.isPending}>
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
