// path: src/features/maintenance/MaintenancePage.jsx
import { useState } from 'react'
import { Plus, Trash2, Edit2 } from 'lucide-react'
import { useMaintenance, useDeleteMaintenance } from './hooks'
import { PageHeader } from '../../components/common/PageHeader'
import { DataTable } from '../../components/common/DataTable'
import { Button } from '../../components/ui/Button'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { TableSkeletons } from '../../components/common/Skeletons'
import { Badge } from '../../components/ui/Badge'
import { toast } from 'sonner'

export const MaintenancePage = () => {
  const { data: maintenance = [], isLoading } = useMaintenance()
  const deleteMaintenance = useDeleteMaintenance()
  const [deleteId, setDeleteId] = useState(null)

  const handleDelete = async () => {
    try {
      await deleteMaintenance.mutateAsync(deleteId)
      toast.success('Maintenance request deleted successfully')
      setDeleteId(null)
    } catch (error) {
      toast.error('Failed to delete maintenance request')
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED':
        return 'success'
      case 'IN_PROGRESS':
        return 'primary'
      case 'PENDING':
        return 'warning'
      default:
        return 'default'
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'HIGH':
        return 'danger'
      case 'MEDIUM':
        return 'warning'
      case 'LOW':
        return 'success'
      default:
        return 'default'
    }
  }

  const columns = [
    {
      header: 'Room',
      accessorKey: 'room',
    },
    {
      header: 'Description',
      accessorKey: 'description',
    },
    {
      header: 'Priority',
      accessorKey: 'priority',
      cell: ({ row }) => (
        <Badge variant={getPriorityColor(row.original.priority)}>
          {row.original.priority}
        </Badge>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: ({ row }) => (
        <Badge variant={getStatusColor(row.original.status)}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      header: 'Reported Date',
      accessorKey: 'reportedDate',
    },
    {
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm">
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
        title="Maintenance Requests"
        description="Manage maintenance and repairs"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Maintenance' },
        ]}
        action={
          <Button className="gap-2">
            <Plus size={18} />
            New Request
          </Button>
        }
      />

      {isLoading ? (
        <TableSkeletons />
      ) : (
        <DataTable columns={columns} data={maintenance} />
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Maintenance Request"
        description="Are you sure you want to remove this maintenance request?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        isLoading={deleteMaintenance.isPending}
      />
    </div>
  )
}
