// path: src/features/allocations/AllocationsPage.jsx

import { PageHeader } from '../../components/common/PageHeader'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { useAllocationsSummary } from './hooks'
import { useState } from 'react'

export const AllocationsPage = () => {
  const { availableRooms, bookedRooms, loading, error } = useAllocationsSummary()
  const [applyingId, setApplyingId] = useState(null)

  const applyRoom = async (roomId) => {
    try {
      setApplyingId(roomId)

      const res = await fetch(`http://localhost:5000/api/rooms/${roomId}/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || 'Request failed')
      }

      alert(data.message)

      // refresh UI
      window.location.reload()

    } catch (err) {
      console.error(err)
      alert(err.message || 'Failed to send request')
    } finally {
      setApplyingId(null)
    }
  }

  if (loading) return <p>Loading...</p>
  if (error) return <p>Error: {error.message}</p>

  return (
    <div>
      <PageHeader
        title="Room Allocations"
        description="Manage student room allocations"
      />

      <div className="space-y-6">

        {/* AVAILABLE ROOMS */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Available Rooms</h3>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {availableRooms.map((room) => (
                <div key={room.id} className="p-4 border rounded-lg">
                  <p className="font-bold">{room.roomNumber}</p>
                  <p>Block: {room.block}</p>
                  <p>Floor: {room.floor}</p>

                  <button
  type="button"
  onClick={(e) => {
    e.preventDefault()
    e.stopPropagation()   // ✅ VERY IMPORTANT
    applyRoom(room.id)
  }}
  disabled={applyingId === room.id}
  className="mt-2 w-full bg-blue-600 text-white p-1 rounded"
>
  {applyingId === room.id ? 'Applying...' : 'Apply'}
</button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* BOOKED ROOMS */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Booked Rooms</h3>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {bookedRooms.map((room) => (
                <div key={room.id} className="p-4 border rounded-lg">
                  <p className="font-bold">{room.roomNumber}</p>
                  <p>Block: {room.block}</p>
                  <p>Floor: {room.floor}</p>
                  <p className="text-red-500">Occupied</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}