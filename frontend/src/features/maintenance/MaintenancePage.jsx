// path: src/features/maintenance/MaintenancePage.jsx
import { useState } from 'react'
import { PageHeader } from '../../components/common/PageHeader'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { DataTable } from '../../components/common/DataTable'
import { Button } from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { useCreateMaintenance, useDeleteMaintenance, useMaintenance, useUpdateMaintenance } from './hooks'
import { Badge } from '../../components/ui/Badge'
import { toast } from 'sonner'

export const MaintenancePage = () => {
  const { data = [], isLoading } = useMaintenance()
  const createMaintenance = useCreateMaintenance()
  const updateMaintenance = useUpdateMaintenance()
  const deleteMaintenance = useDeleteMaintenance()
  const [form, setForm] = useState({
    description: '',
    room: '',
    priority: 'MEDIUM',
  })

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      await createMaintenance.mutateAsync(form)
      toast.success('Maintenance request created')
      setForm({ description: '', room: '', priority: 'MEDIUM' })
    } catch {
      toast.error('Failed to create maintenance request')
    }
  }

  const handleResolve = async (row) => {
    try {
      await updateMaintenance.mutateAsync({
        id: row.id,
        data: {
          ...row,
          status: 'RESOLVED',
        },
      })
      toast.success('Marked as resolved')
    } catch {
      toast.error('Failed to update request')
    }
  }

  const handleDelete = async (id) => {
    try {
      await deleteMaintenance.mutateAsync(id)
      toast.success('Maintenance request deleted')
    } catch {
      toast.error('Failed to delete request')
    }
  }

  const columns = [
    { header: 'ID', accessorKey: 'id' },
    { header: 'Room', accessorKey: 'room' },
    { header: 'Description', accessorKey: 'description' },
    { header: 'Priority', accessorKey: 'priority' },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: ({ row }) => (
        <Badge variant={row.original.status === 'RESOLVED' ? 'success' : 'warning'}>
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
            onClick={() => handleResolve(row.original)}
            disabled={row.original.status === 'RESOLVED'}
          >
            Resolve
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => handleDelete(row.original.id)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Maintenance Requests"
        description="Manage maintenance and repairs"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Maintenance' },
        ]}
      />

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Create Maintenance Request</h3>
        </CardHeader>
        <CardContent>
          <form className="grid grid-cols-1 md:grid-cols-4 gap-3" onSubmit={handleCreate}>
            <Input
              name="room"
              placeholder="Room (e.g. A-101)"
              value={form.room}
              onChange={(e) => setForm((prev) => ({ ...prev, room: e.target.value }))}
            />
            <Input
              name="description"
              placeholder="Issue description"
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              required
            />
            <select
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white dark:bg-slate-800"
              value={form.priority}
              onChange={(e) => setForm((prev) => ({ ...prev, priority: e.target.value }))}
            >
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
            </select>
            <Button type="submit" disabled={createMaintenance.isPending}>
              Add Request
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
              searchKey="description"
              searchPlaceholder="Search maintenance requests..."
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
