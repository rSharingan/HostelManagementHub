// path: src/features/rooms/NewRoomPage.jsx
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { PageHeader } from '../../components/common/PageHeader'
import { RoomForm } from './RoomForm'
import { useCreateRoom } from './hooks'

export const NewRoomPage = () => {
  const navigate = useNavigate()
  const createRoom = useCreateRoom()

  const handleSubmit = async (data) => {
    try {
      await createRoom.mutateAsync(data)
      toast.success('Room created successfully')
      navigate('/rooms')
    } catch (error) {
      toast.error('Failed to create room')
    }
  }

  const handleCancel = () => {
    navigate('/rooms')
  }

  return (
    <div>
      <PageHeader
        title="Add New Room"
        description="Create a new room in the hostel"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Rooms', href: '/rooms' },
          { label: 'New Room' },
        ]}
      />

      <div className="max-w-2xl mx-auto mt-6">
        <RoomForm
          onSubmit={handleSubmit}
          loading={createRoom.isPending}
          onCancel={handleCancel}
        />
      </div>
    </div>
  )
}