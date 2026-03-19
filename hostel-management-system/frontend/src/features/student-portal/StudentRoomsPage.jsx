// path: src/features/student-portal/StudentRoomsPage.jsx
import { Home, Users, DollarSign, MapPin } from 'lucide-react'
import { useAvailableRooms } from './hooks'
import { PageHeader } from '../../components/common/PageHeader'
import { formatCurrency } from '../../lib/utils'

export const StudentRoomsPage = () => {
  const { data: rooms, isLoading } = useAvailableRooms()

  return (
    <div>
      <PageHeader
        title="Available Rooms"
        description="Browse and view details of available rooms."
        breadcrumbs={[{ label: 'Student Portal' }, { label: 'Available Rooms' }]}
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : rooms && rooms.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Room {room.roomNumber}</h3>
                  <p className="text-slate-600 dark:text-slate-400 flex items-center gap-1">
                    <MapPin size={14} />
                    Block {room.block}, Floor {room.floor}
                  </p>
                </div>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                  Available
                </span>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-slate-500" />
                  <span className="text-sm">Capacity: {room.capacity} students</span>
                </div>

                <div className="flex items-center gap-2">
                  <Home size={16} className="text-slate-500" />
                  <span className="text-sm">Type: {room.type || 'Standard'}</span>
                </div>

                <div className="flex items-center gap-2">
                  <DollarSign size={16} className="text-slate-500" />
                  <span className="text-sm font-medium">
                    {formatCurrency(room.rentalCost)}/month
                  </span>
                </div>
              </div>

              <button className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors">
                Request Allocation
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Home size={48} className="mx-auto text-slate-400 mb-4" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
            No Available Rooms
          </h3>
          <p className="text-slate-600 dark:text-slate-400">
            All rooms are currently occupied. Please check back later.
          </p>
        </div>
      )}
    </div>
  )
}