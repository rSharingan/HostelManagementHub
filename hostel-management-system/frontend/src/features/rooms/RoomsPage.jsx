// path: src/features/rooms/RoomsPage.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, Edit2 } from 'lucide-react'
import { useRooms, useDeleteRoom } from './hooks'
import { PageHeader } from '../../components/common/PageHeader'
import { DataTable } from '../../components/common/DataTable'
import { Button } from '../../components/ui/Button'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { TableSkeletons } from '../../components/common/Skeletons'
import { Badge } from '../../components/ui/Badge'
import { formatCurrency } from '../../lib/utils'
import { toast } from 'sonner'

export const RoomsPage = () => {
  const navigate = useNavigate()
  const { data: rooms = [], isLoading } = useRooms()
  const deleteRoom = useDeleteRoom()
  const [deleteId, setDeleteId] = useState(null)

  const handleDelete = async () => {
    try {
      await deleteRoom.mutateAsync(deleteId)
      toast.success('Room deleted successfully')
      setDeleteId(null)
    } catch (error) {
      toast.error('Failed to delete room')
    }
  }

  const columns = [
    {
      header: 'Room Number',
      accessorKey: 'roomNumber',
    },
    {
      header: 'Block',
      accessorKey: 'block',
    },
    {
      header: 'Type',
      accessorKey: 'type',
    },
    {
      header: 'Capacity',
      accessorKey: 'capacity',
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: ({ row }) => (
        <Badge
          variant={
            row.original.status === 'AVAILABLE'
              ? 'success'
              : row.original.status === 'OCCUPIED'
                ? 'primary'
                : 'warning'
          }
        >
          {row.original.status}
        </Badge>
      ),
    },
    {
      header: 'Rental Cost',
      accessorKey: 'rentalCost',
      cell: ({ row }) => formatCurrency(row.original.rentalCost),
    },
    {
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/rooms/${row.original.id}`)}
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
        title="Rooms"
        description="Manage hostel rooms"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Rooms' },
        ]}
        action={
          <Button
            onClick={() => navigate('/rooms/new')}
            className="gap-2"
          >
            <Plus size={16} />
            Add Room
          </Button>
        }
      />

      {isLoading ? (
        <TableSkeletons />
      ) : (
        <DataTable
          columns={columns}
          data={rooms}
          onRowClick={(row) => navigate(`/rooms/${row.id}`)}
          searchKey="roomNumber"
          searchPlaceholder="Search rooms..."
        />
      )}

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Delete Room"
        description="Are you sure you want to delete this room? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        loading={deleteRoom.isPending}
      />
    </div>
  )
}
