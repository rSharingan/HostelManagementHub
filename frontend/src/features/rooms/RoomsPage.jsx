// path: src/features/rooms/RoomsPage.jsx
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, Edit2, CheckCircle, X } from 'lucide-react'
import { useRooms, useDeleteRoom } from './hooks'
import { PageHeader } from '../../components/common/PageHeader'
import { DataTable } from '../../components/common/DataTable'
import { Button } from '../../components/ui/Button'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { TableSkeletons } from '../../components/common/Skeletons'
import { Badge } from '../../components/ui/Badge'
import { formatCurrency } from '../../lib/utils'
import { toast } from 'sonner'
import { useAuth } from '../auth/hooks'
import { useCreateRoomRequest, useRoomRequests, useCancelRoomRequest } from '../roomRequests/hooks'
import { useRentStatus } from '../fees/hooks'

export const RoomsPage = () => {
  const navigate = useNavigate()
  const { data: rooms = [], isLoading, error } = useRooms()
  const deleteRoom = useDeleteRoom()
  const { user } = useAuth()
  const [deleteId, setDeleteId] = useState(null)
  const [applyingRoomId, setApplyingRoomId] = useState(null)
  const [cancellingRequestId, setCancellingRequestId] = useState(null)
  const [optimisticRequestedRoomIds, setOptimisticRequestedRoomIds] = useState([])
  const [filters, setFilters] = useState({
    availableOnly: false,
    hasAC: false,
    hasAttachedBathroom: false,
    hasWifi: false,
    hasBalcony: false,
  })
  const createRoomRequest = useCreateRoomRequest()
  const { data: rentStatus } = useRentStatus(
    { studentEmail: user?.email },
    user?.role === 'STUDENT',
  )
  const { data: roomRequests = [] } = useRoomRequests(
    user?.role === 'STUDENT' ? { studentEmail: user?.email } : undefined,
    user?.role === 'STUDENT',
  )
  const cancelRoomRequest = useCancelRoomRequest()

  const requestedRoomIds = useMemo(() => {
    if (user?.role !== 'STUDENT') {
      return new Set()
    }

    const roomIds = roomRequests
      .filter((request) => String(request.status || '').toUpperCase() === 'PENDING')
      .map((request) => String(request.roomId))

    optimisticRequestedRoomIds.forEach((roomId) => {
      if (!roomIds.includes(String(roomId))) {
        roomIds.push(String(roomId))
      }
    })

    return new Set(roomIds)
  }, [optimisticRequestedRoomIds, roomRequests, user?.role])

  const latestRequestByRoomId = useMemo(() => {
    const map = new Map()
    if (user?.role !== 'STUDENT') {
      return map
    }

    // API already returns requests in DESC order; keep first occurrence per room as latest.
    for (const request of roomRequests) {
      const roomId = String(request.roomId)
      if (!map.has(roomId)) {
        map.set(roomId, {
          id: request.id,
          status: String(request.status || '').toUpperCase(),
        })
      }
    }

    return map
  }, [roomRequests, user?.role])

  const requestStatusByRoomId = useMemo(() => {
    const map = new Map()
    if (user?.role !== 'STUDENT') {
      return map
    }

    for (const [roomId, info] of latestRequestByRoomId.entries()) {
      map.set(roomId, info.status)
    }

    return map
  }, [latestRequestByRoomId, user?.role])

  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      const seatsLeft = Number(room.seatsLeft ?? room.capacity ?? 0)
      if (user?.role === 'STUDENT' && seatsLeft <= 0) {
        return false
      }
      if (user?.role === 'STUDENT' && rentStatus?.hasActiveAllocation && String(rentStatus.roomId) === String(room.id)) {
        return false
      }
      if (filters.availableOnly && room.status !== 'AVAILABLE') {
        return false
      }
      if (filters.hasAC && !room.hasAC) {
        return false
      }
      if (filters.hasAttachedBathroom && !room.hasAttachedBathroom) {
        return false
      }
      if (filters.hasWifi && !room.hasWifi) {
        return false
      }
      if (filters.hasBalcony && !room.hasBalcony) {
        return false
      }
      return true
    })
  }, [filters, rentStatus?.hasActiveAllocation, rentStatus?.roomId, rooms, user?.role])

  const handleDelete = async () => {
    try {
      await deleteRoom.mutateAsync(deleteId)
      toast.success('Room deleted successfully')
      setDeleteId(null)
    } catch (error) {
      toast.error('Failed to delete room')
    }
  }

  const handleApply = async (room) => {
    try {
      setApplyingRoomId(room.id)
      await createRoomRequest.mutateAsync({
        studentEmail: user.email,
        roomId: room.id,
      })
      setOptimisticRequestedRoomIds((current) =>
        current.includes(String(room.id)) ? current : [...current, String(room.id)],
      )
      toast.success('Room request submitted successfully')
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to apply for room')
    } finally {
      setApplyingRoomId(null)
    }
  }

  const handleCancelRequest = async (requestId) => {
    try {
      setCancellingRequestId(requestId)
      await cancelRoomRequest.mutateAsync(requestId)
      toast.success('Room request cancelled successfully')
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to cancel room request')
    } finally {
      setCancellingRequestId(null)
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
      header: 'Attributes',
      cell: ({ row }) => {
        const attrs = [
          row.original.hasAC && 'AC',
          row.original.hasAttachedBathroom && 'Attached Bath',
          row.original.hasWifi && 'Wi-Fi',
          row.original.hasBalcony && 'Balcony',
        ].filter(Boolean)

        if (attrs.length === 0) {
          return <span className="text-gray-500 dark:text-dark-400">Standard</span>
        }

        return (
          <div className="flex flex-wrap gap-1">
            {attrs.map((attr) => (
              <Badge key={attr} variant="secondary">{attr}</Badge>
            ))}
          </div>
        )
      },
    },
    {
      header: 'Capacity',
      accessorKey: 'capacity',
    },
    {
      header: 'Seats Left',
      cell: ({ row }) => {
        const seatsLeft = Number(row.original.seatsLeft ?? row.original.capacity ?? 0)
        return <span className={seatsLeft === 0 ? 'text-red-600 font-medium' : 'text-green-700 font-medium'}>{seatsLeft}</span>
      },
    },
    {
      header: 'Allocated Students',
      cell: ({ row }) => {
        const allocated = row.original.allocatedStudents || [];
        if (allocated.length === 0) {
          return <span className="text-gray-500 dark:text-dark-400">None</span>;
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
      cell: ({ row }) => {
        const seatsLeft = Number(row.original.seatsLeft ?? row.original.capacity ?? 0)
        const isFull = seatsLeft === 0
        return (
          <Badge variant={isFull ? 'primary' : 'success'}>
            {isFull ? 'FULL' : 'AVAILABLE'}
          </Badge>
        )
      },
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
        const seatsLeft = Number(row.original.seatsLeft ?? row.original.capacity ?? 0)
        const isAvailable = seatsLeft > 0
        const isRequested = requestedRoomIds.has(String(row.original.id))
        const requestStatus = requestStatusByRoomId.get(String(row.original.id))
        const hasActiveAllocation = Boolean(rentStatus?.hasActiveAllocation)
        const isCurrentRoom = hasActiveAllocation && String(rentStatus?.roomId) === String(row.original.id)
        
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
        } else if (user?.role === 'STUDENT') {
          // Student view
          const latestRequest = latestRequestByRoomId.get(String(row.original.id))
          const pendingRequestId = latestRequest?.status === 'PENDING' ? latestRequest.id : null
          return (
            <div className="flex gap-2">
              {requestStatus === 'APPROVED_WAITING_SHIFT' ? (
                <Badge variant="warning">Approved - Waiting Shift</Badge>
              ) : requestStatus === 'APPROVED' ? (
                <Badge variant="success">Approved</Badge>
              ) : requestStatus === 'PENDING' ? (
                <>
                  <Badge variant="warning">Pending Approval</Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCancelRequest(pendingRequestId)}
                    disabled={!pendingRequestId || cancellingRequestId === pendingRequestId || cancelRoomRequest.isPending}
                    className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X size={16} />
                    Cancel Request
                  </Button>
                </>
              ) : isRequested ? (
                <Badge variant="warning">Requested</Badge>
              ) : isCurrentRoom ? (
                <Badge variant="secondary">Current Room</Badge>
              ) : isAvailable ? (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleApply(row.original)}
                  disabled={applyingRoomId === row.original.id || createRoomRequest.isPending}
                  className="gap-2"
                >
                  <CheckCircle size={16} />
                  Apply
                </Button>
              ) : (
                <Badge variant="secondary">Full</Badge>
              )}
            </div>
          )
        } else {
          return <span className="text-gray-500 dark:text-dark-400 text-sm">View only</span>
        }
      },
    },
  ]

  return (
    <div>
      <PageHeader
        title="Rooms"
        description={user?.role === 'ADMIN' ? 'Manage hostel rooms' : user?.role === 'STUDENT' ? 'Available rooms for application' : 'View hostel rooms'}
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
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-600">Failed to load rooms. Please check your database connection.</p>
          <p className="text-sm text-gray-500 mt-2">{error.message}</p>
        </div>
      ) : (
        <>
          {user?.role === 'STUDENT' && (
            <div className="mb-4 p-4 rounded-lg border border-sky-200 bg-sky-50 dark:border-sky-900 dark:bg-sky-950/20">
              <p className="text-sm font-semibold text-sky-800 dark:text-sky-200">Your current allocation</p>
              <p className="text-sm text-sky-800/90 dark:text-sky-300 mt-1">
                Room: {rentStatus?.roomNumber || 'Not allocated'} | Bed: {rentStatus?.bedNumber ? `Bed ${rentStatus.bedNumber}` : 'N/A'}
              </p>
              <p className="text-sm text-sky-800/90 dark:text-sky-300">
                Monthly rent: {formatCurrency(rentStatus?.monthlyRent || 0)} | Balance: {formatCurrency(rentStatus?.currentBalance || 0)}
              </p>
              <p className="text-sm mt-2 text-sky-900 dark:text-sky-100">
                {rentStatus?.canRequestRoomChange
                  ? 'Room change is available now.'
                  : `Room change will unlock in ${rentStatus?.daysUntilRoomChangeAllowed || 0} day(s).`}
              </p>
            </div>
          )}

          <div className="mb-4 p-4 border border-gray-200 dark:border-dark-700 rounded-lg">
            <p className="text-sm font-medium text-gray-700 dark:text-dark-300 mb-3">Filter Rooms</p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.availableOnly}
                  onChange={(e) => setFilters((prev) => ({ ...prev, availableOnly: e.target.checked }))}
                />
                Available Only
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.hasAC}
                  onChange={(e) => setFilters((prev) => ({ ...prev, hasAC: e.target.checked }))}
                />
                AC
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.hasAttachedBathroom}
                  onChange={(e) => setFilters((prev) => ({ ...prev, hasAttachedBathroom: e.target.checked }))}
                />
                Attached Bath
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.hasWifi}
                  onChange={(e) => setFilters((prev) => ({ ...prev, hasWifi: e.target.checked }))}
                />
                Wi-Fi
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.hasBalcony}
                  onChange={(e) => setFilters((prev) => ({ ...prev, hasBalcony: e.target.checked }))}
                />
                Balcony
              </label>
            </div>
          </div>

          <DataTable
            columns={columns}
            data={filteredRooms}
            onRowClick={(row) => navigate(`/rooms/${row.id}`)}
            searchKey="roomNumber"
            searchPlaceholder="Search rooms..."
          />
        </>
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
