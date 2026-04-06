// path: src/features/roomRequests/RoomRequestsPage.jsx
import { useMemo } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { PageHeader } from '../../components/common/PageHeader'
import { DataTable } from '../../components/common/DataTable'
import { TableSkeletons } from '../../components/common/Skeletons'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { toast } from 'sonner'
import { useRooms } from '../rooms/hooks'
import { useStudents } from '../students/hooks'
import { useApproveRoomRequest, useRoomRequests } from './hooks'

export const RoomRequestsPage = () => {
  const { data: roomRequests = [], isLoading, error } = useRoomRequests()
  const { data: rooms = [] } = useRooms()
  const { data: students = [] } = useStudents()
  const approveRoomRequest = useApproveRoomRequest()

  const roomLookup = useMemo(
    () => new Map(rooms.map((room) => [String(room.id), room])),
    [rooms],
  )

  const studentLookup = useMemo(
    () => new Map(students.map((student) => [String(student.id), student])),
    [students],
  )

  const tableData = useMemo(
    () =>
      roomRequests.map((request) => ({
        ...request,
        studentName:
          request.studentName ||
          request.student?.name ||
          studentLookup.get(String(request.studentId))?.name ||
          'Unknown Student',
        roomNumber:
          request.roomNumber ||
          request.room?.roomNumber ||
          roomLookup.get(String(request.roomId))?.roomNumber ||
          'Unknown Room',
      })),
    [roomLookup, roomRequests, studentLookup],
  )

  const handleApprove = async (requestId) => {
    try {
      await approveRoomRequest.mutateAsync(requestId)
      toast.success('Room request approved successfully')
    } catch (approveError) {
      toast.error(approveError?.response?.data?.message || 'Failed to approve room request')
    }
  }

  const columns = [
    {
      header: 'Request ID',
      accessorKey: 'id',
    },
    {
      header: 'Student Name',
      accessorKey: 'studentName',
    },
    {
      header: 'Room Number',
      accessorKey: 'roomNumber',
    },
    {
      header: 'Status',
      cell: ({ row }) => (
        <Badge
          variant={
            row.original.status === 'APPROVED'
              ? 'success'
              : row.original.status === 'PENDING'
                ? 'warning'
                : 'default'
          }
        >
          {row.original.status}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      cell: ({ row }) => {
        const isApproved = row.original.status === 'APPROVED'

        if (isApproved) {
          return (
            <Button variant="success" size="sm" disabled className="gap-2">
              <CheckCircle2 size={16} />
              Approved
            </Button>
          )
        }

        return (
          <Button
            variant="warning"
            size="sm"
            onClick={() => handleApprove(row.original.id)}
            disabled={approveRoomRequest.isPending}
            className="gap-2"
          >
            <CheckCircle2 size={16} />
            Approve
          </Button>
        )
      },
    },
  ]

  return (
    <div>
      <PageHeader
        title="Room Requests"
        description="Review and approve student room requests"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Room Requests' },
        ]}
      />

      {isLoading ? (
        <TableSkeletons />
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-600">Failed to load room requests.</p>
          <p className="text-sm text-gray-500 mt-2">{error.message}</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={tableData}
          searchKey="studentName"
          searchPlaceholder="Search room requests..."
        />
      )}
    </div>
  )
}