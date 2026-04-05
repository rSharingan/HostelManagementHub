// path: src/features/allocations/AllocationsPage.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '../../components/common/PageHeader'
import { DataTable } from '../../components/common/DataTable'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { TableSkeletons } from '../../components/common/Skeletons'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { useAllocations, useCreateAllocation, useDeleteAllocation } from './hooks'
import { useStudents } from '../students/hooks'
import { useRooms } from '../rooms/hooks'

export const AllocationsPage = () => {
  const navigate = useNavigate()
  const { data: allocations = [], isLoading: allocationsLoading, error: allocationsError } = useAllocations()
  const { data: rooms = [], isLoading: roomsLoading, error: roomsError } = useRooms()
  const studentsQuery = useStudents()
  const students = studentsQuery.data ?? []
  const studentsError = studentsQuery.error
  const createAllocation = useCreateAllocation()
  const deleteAllocation = useDeleteAllocation()

  const [deleteId, setDeleteId] = useState(null)
  const [isCreateMode, setIsCreateMode] = useState(false)
  const [studentId, setStudentId] = useState('')
  const [roomId, setRoomId] = useState('')
  const [allocatedDate, setAllocatedDate] = useState('')
  const [status, setStatus] = useState('ACTIVE')

  // Group allocations by room
  const roomsWithAllocations = rooms.map(room => ({
    ...room,
    allocations: allocations.filter(a => a.roomId === room.id && a.status === 'ACTIVE')
  })).filter(room => room.allocations.length > 0 || room.status === 'AVAILABLE') // Show rooms with allocations or available

  const availableRooms = rooms.filter((room) => room.status === 'AVAILABLE')

  const handleCreate = async () => {
    if (!studentId || !roomId) {
      toast.error('Please select student and room')
      return
    }

    try {
      await createAllocation.mutateAsync({ studentId, roomId, allocated_date: allocatedDate, status })
      toast.success('Allocation created successfully')
      setIsCreateMode(false)
      setStudentId('')
      setRoomId('')
      setAllocatedDate('')
      setStatus('ACTIVE')
    } catch (error) {
      toast.error('Failed to create allocation')
    }
  }

  const handleDelete = async () => {
    try {
      await deleteAllocation.mutateAsync(deleteId)
      toast.success('Allocation removed successfully')
      setDeleteId(null)
    } catch (error) {
      toast.error('Failed to delete allocation')
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
        const allocations = row.original.allocations || [];
        if (allocations.length === 0) {
          return <span className="text-gray-500">No students allocated</span>;
        }
        return (
          <div className="flex flex-col gap-1">
            {allocations.map((allocation, index) => (
              <div key={allocation.id} className="flex items-center justify-between gap-2 text-sm">
                <span>{allocation.studentName} ({allocation.registrationNumber})</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    setDeleteId(allocation.id)
                  }}
                  className="text-red-600 hover:text-red-700 h-6 w-6 p-0"
                >
                  <Trash2 size={14} />
                </Button>
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
  ]

  return (
    <div>
      <PageHeader
        title="Room Allocations"
        description="View students allocated to each room and manage allocations"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Allocations' },
        ]}
        action={
          <Button
            onClick={() => setIsCreateMode((v) => !v)}
            className="gap-2"
          >
            {isCreateMode ? 'Close' : 'Add Allocation'}
          </Button>
        }
      />

      {isCreateMode && (
        <div className="mb-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
                Student
              </label>
              {studentsError ? (
                <p className="text-red-600 text-sm">Failed to load students</p>
              ) : (
                <select
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                >
                  <option value="">Select Student</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.name} ({student.registrationNumber || student.email})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
                Room
              </label>
              {roomsError ? (
                <p className="text-red-600 text-sm">Failed to load rooms</p>
              ) : availableRooms.length === 0 ? (
                <p className="mt-2 text-sm text-red-600">No available rooms to allocate. Add rooms or release existing allocations.</p>
              ) : (
                <select
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                >
                  <option value="">Select Room</option>
                  {availableRooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.roomNumber} (Block {room.block} - {room.type})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
                Allocated Date
              </label>
              <Input
                type="date"
                value={allocatedDate}
                onChange={(e) => setAllocatedDate(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              >
                <option value="ACTIVE">Active</option>
                <option value="RELEASED">Released</option>
              </select>
            </div>

            <div className="flex items-end">
              <Button
                onClick={handleCreate}
                loading={createAllocation.isPending}
                disabled={availableRooms.length === 0 || !studentId || !roomId}
                className="w-full"
              >
                Save Allocation
              </Button>
            </div>
          </div>
        </div>
      )}

      {allocationsLoading || roomsLoading ? (
        <TableSkeletons />
      ) : allocationsError || roomsError || studentsError ? (
        <div className="text-center py-8">
          <p className="text-red-600">Failed to load data. Please check your database connection.</p>
          <p className="text-sm text-gray-500 mt-2">
            {allocationsError?.message || roomsError?.message || studentsError?.message}
          </p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={roomsWithAllocations}
          onRowClick={(row) => navigate(`/rooms/${row.id}`)}
          searchKey="roomNumber"
          searchPlaceholder="Search rooms..."
        />
      )}

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Delete Allocation"
        description="Are you sure you want to delete this allocation?"
        confirmLabel="Delete"
        onConfirm={handleDelete}
        loading={deleteAllocation.isPending}
      />
    </div>
  )
}
