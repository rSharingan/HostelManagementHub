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
    role: 'WARDEN',
  })

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      await createStaff.mutateAsync(form)
      toast.success('Staff member created')
      setForm({ name: '', email: '', password: '', role: 'WARDEN' })
    } catch {
      toast.error('Failed to create staff member')
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
          <form className="grid grid-cols-1 md:grid-cols-5 gap-3" onSubmit={handleCreate}>
            <Input
              name="name"
              placeholder="Full name"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              required
            />
            <Input
              name="email"
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              required
            />
            <Input
              name="password"
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              required
            />
            <select
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white dark:bg-slate-800"
              value={form.role}
              onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}
            >
              <option value="WARDEN">WARDEN</option>
              <option value="CARETAKER">CARETAKER</option>
            </select>
            <Button type="submit" disabled={createStaff.isPending}>
              Add Staff
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
              searchKey="name"
              searchPlaceholder="Search staff by name or email..."
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
