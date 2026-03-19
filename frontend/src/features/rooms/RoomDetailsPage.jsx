// path: src/features/rooms/RoomDetailsPage.jsx
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useRoom, useUpdateRoom } from './hooks'
import { RoomForm } from './RoomForm'
import { Button } from '../../components/ui/Button'
import { DetailPageSkeleton } from '../../components/common/Skeletons'
import { toast } from 'sonner'

export const RoomDetailsPage = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const isNew = id === 'new'

  const { data: room, isLoading } = useRoom(id, !isNew)
  const updateRoom = useUpdateRoom()

  const handleSubmit = async (data) => {
    try {
      if (isNew) {
        // Create new room
        await updateRoom.mutateAsync({
          id: 'create',
          data,
        })
        toast.success('Room created successfully')
      } else {
        // Update existing room
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

      <RoomForm
        room={room}
        onSubmit={handleSubmit}
        loading={updateRoom.isPending}
        onCancel={() => navigate('/rooms')}
      />
    </div>
  )
}
