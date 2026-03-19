// path: src/features/allocations/AllocationsPage.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, Edit2 } from 'lucide-react'
import { useAllocations, useDeleteAllocation } from './hooks'
import { PageHeader } from '../../components/common/PageHeader'
import { DataTable } from '../../components/common/DataTable'
import { Button } from '../../components/ui/Button'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { TableSkeletons } from '../../components/common/Skeletons'
import { Badge } from '../../components/ui/Badge'
import { toast } from 'sonner'

export const AllocationsPage = () => {
  const navigate = useNavigate()
  const { data: allocations = [], isLoading } = useAllocations()
  const deleteAllocation = useDeleteAllocation()
  const [deleteId, setDeleteId] = useState(null)

  const handleDelete = async () => {
    try {
      await deleteAllocation.mutateAsync(deleteId)
      toast.success('Allocation deleted successfully')
      setDeleteId(null)
    } catch (error) {
      toast.error('Failed to delete allocation')
    }
  }

  const columns = [
    {
      header: 'Student Name',
      accessorKey: 'student',
    },
    {
      header: 'Room Number',
      accessorKey: 'roomNumber',
    },
    {
      header: 'Check-In Date',
      accessorKey: 'checkInDate',
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: ({ row }) => (
        <Badge
          variant={row.original.status === 'ACTIVE' ? 'success' : 'warning'}
        >
          {row.original.status}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/allocations/${row.original.id}`)}
          >
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
        title="Room Allocations"
        description="Manage student room allocations"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Allocations' },
        ]}
        action={
          <Button
            onClick={() => navigate('/allocations/new')}
            className="gap-2"
          >
            <Plus size={18} />
            New Allocation
          </Button>
        }
      />

      {isLoading ? (
        <TableSkeletons />
      ) : (
        <DataTable columns={columns} data={allocations} />
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Allocation"
        description="Are you sure you want to remove this allocation? This will mark the room as available."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        isLoading={deleteAllocation.isPending}
      />
    </div>
  )
}
