import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../auth/hooks'
import { useRoom, useUpdateRoom, useCreateRoom } from './hooks'
import { RoomForm } from './RoomForm'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { DetailPageSkeleton } from '../../components/common/Skeletons'
import { Badge } from '../../components/ui/Badge'
import { formatCurrency } from '../../lib/utils'
import { useCreateRoomRequest } from '../roomRequests/hooks'
import { useRoomRequests } from '../roomRequests/hooks'

const renderBoolean = (value) => (value ? 'Yes' : 'No')

export const RoomDetailsPage = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const isNew = id === 'new'
  const { user } = useAuth()

  const { data: room, isLoading } = useRoom(id, !isNew)
  const createRoom = useCreateRoom()
  const updateRoom = useUpdateRoom()
  const createRoomRequest = useCreateRoomRequest()
  const { data: roomRequests = [] } = useRoomRequests(
    user?.role === 'STUDENT' ? { studentEmail: user?.email } : undefined,
    user?.role === 'STUDENT',
  )

  const isRequested = roomRequests.some(
    (request) => String(request.roomId) === String(room?.id) && request.status === 'PENDING',
  )

  const seatsLeft = Number(room?.seatsLeft ?? room?.capacity ?? 0)
  const isFull = seatsLeft === 0

  const attributes = useMemo(() => ([
    { label: 'Room Number', value: room?.roomNumber || '-' },
    { label: 'Block', value: room?.block || '-' },
    { label: 'Floor', value: room?.floor ?? '-' },
    { label: 'Capacity', value: room?.capacity ?? '-' },
    { label: 'Occupied Seats', value: room?.occupiedSeats ?? '-' },
    { label: 'Seats Left', value: seatsLeft },
    { label: 'Type', value: room?.type || '-' },
    { label: 'AC', value: renderBoolean(room?.hasAC) },
    { label: 'Attached Bathroom', value: renderBoolean(room?.hasAttachedBathroom) },
    { label: 'Wi-Fi', value: renderBoolean(room?.hasWifi) },
    { label: 'Balcony', value: renderBoolean(room?.hasBalcony) },
    { label: 'Rental Cost', value: formatCurrency(room?.rentalCost || 0) },
    { label: 'Status', value: room?.status || '-' },
    { label: 'Hostel ID', value: room?.hostelId ?? '-' },
  ]), [room])

  const handleSubmit = async (data) => {
    try {
      if (isNew) {
        await createRoom.mutateAsync(data)
        toast.success('Room created successfully')
      } else {
        await updateRoom.mutateAsync({
          id,
          data,
        })
        toast.success('Room updated successfully')
      }
      navigate('/rooms')
    } catch (error) {
      toast.error('Failed to save room')
    }
  }

  const handleApply = async () => {
    try {
      await createRoomRequest.mutateAsync({
        studentEmail: user.email,
        roomId: room.id,
      })
      toast.success('Room request submitted successfully')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to apply for room')
    }
  }

  if (!isNew && isLoading) {
    return <DetailPageSkeleton />
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/rooms')}
        >
          <ArrowLeft size={16} />
        </Button>
        <h1 className="text-2xl font-bold">
          {isNew ? 'Add New Room' : `Room ${room?.roomNumber}`}
        </h1>
      </div>

      {!isNew && user?.role !== 'ADMIN' ? (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Room Details</h2>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border border-gray-200 dark:border-dark-700">
                <tbody>
                  {attributes.map((item) => (
                    <tr key={item.label} className="border-b border-gray-200 dark:border-dark-700 last:border-b-0">
                      <th className="w-1/3 px-4 py-3 text-left bg-gray-50 dark:bg-dark-800 font-medium text-gray-900 dark:text-dark-50">{item.label}</th>
                      <td className="px-4 py-3 text-gray-700 dark:text-dark-300">{item.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <Badge variant={isFull ? 'primary' : 'success'}>
                {isFull ? 'FULL' : 'AVAILABLE'}
              </Badge>
              {user?.role === 'STUDENT' && !isFull && (
                <div className="flex gap-3">
                  <Button onClick={handleApply} disabled={createRoomRequest.isPending || isRequested} variant="primary">
                    {isRequested ? 'Requested' : 'Apply for this Room'}
                  </Button>
                  <Button onClick={() => navigate('/rooms')} variant="secondary">
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <RoomForm
          room={room}
          onSubmit={handleSubmit}
          loading={isNew ? createRoom.isPending : updateRoom.isPending}
          onCancel={() => navigate('/rooms')}
        />
      )}
    </div>
  )
}
