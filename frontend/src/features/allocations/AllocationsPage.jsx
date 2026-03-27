// path: src/features/allocations/AllocationsPage.jsx
import { PageHeader } from '../../components/common/PageHeader'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { useAllocationsSummary } from './hooks'

export const AllocationsPage = () => {
  const { availableRooms, bookedRooms, loading, error } = useAllocationsSummary()

  if (loading) {
    return (
      <div>
        <PageHeader
          title="Room Allocations"
          description="Manage student room allocations"
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Allocations' },
          ]}
        />
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-slate-600 dark:text-slate-400">Loading...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <PageHeader
          title="Room Allocations"
          description="Manage student room allocations"
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Allocations' },
          ]}
        />
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-red-600 dark:text-red-400">
              Error loading allocations: {error.message}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Room Allocations"
        description="Manage student room allocations"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Allocations' },
        ]}
      />

      <div className="space-y-6">
        {/* Available Rooms */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Available Rooms</h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableRooms.slice(0, 5).map((room) => (
                <div key={room.id} className="p-4 border rounded-lg">
                  <div className="font-medium">{room.roomNumber}</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Block: {room.block} | Floor: {room.floor}
                  </div>
                  <div className="text-sm text-green-600">Status: {room.status}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Booked Rooms */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Booked Rooms</h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bookedRooms.slice(0, 5).map((room) => (
                <div key={room.id} className="p-4 border rounded-lg">
                  <div className="font-medium">{room.roomNumber}</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Block: {room.block} | Floor: {room.floor}
                  </div>
                  <div className="text-sm text-red-600">Status: {room.status}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
