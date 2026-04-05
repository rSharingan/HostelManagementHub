// path: src/features/rooms/RoomsPage.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, Edit2, CheckCircle } from 'lucide-react'
import { useRooms, useDeleteRoom, useApplyRoom } from './hooks'
import { PageHeader } from '../../components/common/PageHeader'
import { DataTable } from '../../components/common/DataTable'
import { Button } from '../../components/ui/Button'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { TableSkeletons } from '../../components/common/Skeletons'
import { Badge } from '../../components/ui/Badge'
import { formatCurrency } from '../../lib/utils'
import { toast } from 'sonner'
import { useAuth } from '../auth/hooks'

export const RoomsPage = () => {
  const navigate = useNavigate()
  const { data: rooms = [], isLoading } = useRooms()
  const deleteRoom = useDeleteRoom()
  const applyRoom = useApplyRoom()
  const { user } = useAuth()
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

  const handleApply = async (roomId) => {
    try {
      await applyRoom.mutateAsync(roomId)
      toast.success('Room applied successfully')
    } catch (error) {
      toast.error('Failed to apply for room')
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
      header: 'Allocated Students',
      cell: ({ row }) => {
        const allocated = row.original.allocatedStudents || [];
        if (allocated.length === 0) {
          return <span className="text-gray-500">None</span>;
        }
        return (
          <div className="flex flex-col gap-1">
            {allocated.map((student, index) => (
              <div key={index} className="text-sm">
                {student.name} ({student.registrationNumber})
              </div>
            ))}
          </div>
        );
      },
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
      cell: ({ row }) => {
        const isAdmin = user?.role === 'ADMIN'
        const isAvailable = row.original.status === 'AVAILABLE'
        
        if (isAdmin) {
          return (
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
          )
        } else {
          // Student view
          return (
            <div className="flex gap-2">
              {isAvailable ? (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleApply(row.original.id)}
                  disabled={applyRoom.isPending}
                  className="gap-2"
                >
                  <CheckCircle size={16} />
                  Apply
                </Button>
              ) : (
                <Badge variant="secondary">Occupied</Badge>
              )}
            </div>
          )
        }
      },
    },
  ]

  return (
    <div>
      <PageHeader
        title="Rooms"
        description={user?.role === 'ADMIN' ? "Manage hostel rooms" : "Available rooms for application"}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Rooms' },
        ]}
        action={
          user?.role === 'ADMIN' ? (
            <Button
              onClick={() => navigate('/rooms/new')}
              className="gap-2"
            >
              <Plus size={16} />
              Add Room
            </Button>
          ) : null
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
