// path: src/features/staff/StaffPage.jsx
import { useState } from 'react'
import { Plus, Trash2, Edit2 } from 'lucide-react'
import { useStaff, useDeleteStaff } from './hooks'
import { PageHeader } from '../../components/common/PageHeader'
import { DataTable } from '../../components/common/DataTable'
import { Button } from '../../components/ui/Button'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { TableSkeletons } from '../../components/common/Skeletons'
import { Badge } from '../../components/ui/Badge'
import { toast } from 'sonner'

export const StaffPage = () => {
  const { data: staff = [], isLoading } = useStaff()
  const deleteStaff = useDeleteStaff()
  const [deleteId, setDeleteId] = useState(null)
  const [showForm, setShowForm] = useState(false)

  const handleDelete = async () => {
    try {
      await deleteStaff.mutateAsync(deleteId)
      toast.success('Staff member deleted successfully')
      setDeleteId(null)
    } catch (error) {
      toast.error('Failed to delete staff member')
    }
  }

  const columns = [
    {
      header: 'Name',
      accessorKey: 'name',
    },
    {
      header: 'Email',
      accessorKey: 'email',
    },
    {
      header: 'Position',
      accessorKey: 'position',
    },
    {
      header: 'Department',
      accessorKey: 'department',
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: ({ row }) => (
        <Badge variant={row.original.status === 'ACTIVE' ? 'success' : 'warning'}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => setShowForm(true)}>
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
        title="Staff"
        description="Manage hostel staff"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Staff' },
        ]}
        action={
          <Button onClick={() => setShowForm(true)} className="gap-2">
            <Plus size={18} />
            Add Staff
          </Button>
        }
      />

      {isLoading ? (
        <TableSkeletons />
      ) : (
        <DataTable columns={columns} data={staff} />
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Staff Member"
        description="Are you sure you want to remove this staff member?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        isLoading={deleteStaff.isPending}
      />
    </div>
  )
}
