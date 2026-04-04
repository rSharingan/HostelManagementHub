import { useState, useEffect } from 'react'
import { PageHeader } from '../../components/common/PageHeader'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'

export const RoomRequestsAdmin = () => {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [approvingId, setApprovingId] = useState(null)

  // Fetch room requests on mount
  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const res = await fetch('http://localhost:5000/api/room-requests')
      if (!res.ok) throw new Error('Failed to fetch requests')
      const data = await res.json()
      setRequests(data)
      setError(null)
    } catch (err) {
      setError(err.message)
      alert('Error fetching room requests: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (requestId) => {
    if (!window.confirm('Approve this room request?')) return

    try {
      setApprovingId(requestId)
      const res = await fetch(`http://localhost:5000/api/room-requests/${requestId}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      })
      if (!res.ok) throw new Error('Failed to approve request')
      
      // Update local state
      setRequests(requests.map(req => 
        req.id === requestId ? { ...req, status: 'APPROVED' } : req
      ))
      alert('Request approved successfully')
    } catch (err) {
      alert('Error: ' + err.message)
    } finally {
      setApprovingId(null)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div>
        <PageHeader
          title="Room Requests"
          description="Manage student room requests"
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Room Requests' },
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

  // Error state
  if (error) {
    return (
      <div>
        <PageHeader
          title="Room Requests"
          description="Manage student room requests"
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Room Requests' },
          ]}
        />
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-red-600">Error: {error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Room Requests"
        description="Manage student room requests"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Room Requests' },
        ]}
      />

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Pending Room Requests</h3>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <p className="text-slate-600 dark:text-slate-400">No requests</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-300 dark:border-slate-600">
                    <th className="text-left p-3 font-semibold">ID</th>
                    <th className="text-left p-3 font-semibold">Student</th>
                    <th className="text-left p-3 font-semibold">Room</th>
                    <th className="text-left p-3 font-semibold">Status</th>
                    <th className="text-center p-3 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((request) => (
                    <tr
                      key={request.id}
                      className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                    >
                      <td className="p-3">{request.id}</td>
                      <td className="p-3">{request.studentName || 'N/A'}</td>
                      <td className="p-3">{request.roomNumber || 'N/A'}</td>
                      <td className="p-3">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            request.status === 'PENDING'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                              : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          }`}
                        >
                          {request.status}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        {request.status === 'PENDING' ? (
                          <button
                            onClick={() => handleApprove(request.id)}
                            disabled={approvingId === request.id}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition font-semibold"
                          >
                            {approvingId === request.id ? 'Approving...' : 'Approve'}
                          </button>
                        ) : (
                          <span className="text-green-600 font-semibold">Approved</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
