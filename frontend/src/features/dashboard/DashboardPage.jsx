// path: src/features/dashboard/DashboardPage.jsx
import { useState, useEffect } from 'react'
import { Users, Home, DollarSign, AlertCircle, Wrench, CheckCircle } from 'lucide-react'
import { useAuth } from '../auth/hooks'
import { PageHeader } from '../../components/common/PageHeader'
import { CountdownTimer } from '../../components/common/CountdownTimer'
import { AnalyticsDashboard } from '../../components/analytics/AnalyticsDashboard'
import { StatCard } from '../../components/common/StatCard'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import axios from '../../lib/api/axios'
import { API_ENDPOINTS } from '../../lib/api/endpoints'
import { toast } from 'sonner'
import { formatCurrency } from '../../lib/utils'

export const DashboardPage = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState({})
  const [complaints, setComplaints] = useState([])
  const [rooms, setRooms] = useState([])
  const [students, setStudents] = useState([])
  const [payments, setPayments] = useState([])
  const [users, setUsers] = useState([])
  const [rentStatus, setRentStatus] = useState(null)
  const [isPayingRent, setIsPayingRent] = useState(false)
  const currentStudent = user?.role === 'STUDENT'
    ? students.find((student) => student.email === user.email)
    : null

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (user?.role === 'ADMIN') {
          const [studentsRes, roomsRes, complaintsRes, paymentsRes, usersRes] = await Promise.all([
            axios.get(API_ENDPOINTS.STUDENTS.LIST),
            axios.get(API_ENDPOINTS.ROOMS.LIST),
            axios.get(API_ENDPOINTS.COMPLAINTS.LIST),
            axios.get(API_ENDPOINTS.PAYMENTS.LIST),
            axios.get(API_ENDPOINTS.USERS.LIST)
          ])
          setStudents(studentsRes.data)
          setRooms(roomsRes.data)
          setComplaints(complaintsRes.data)
          setPayments(paymentsRes.data)
          setUsers(usersRes.data)
        } else if (user?.role === 'WARDEN') {
          const [roomsRes, complaintsRes, studentsRes, usersRes] = await Promise.all([
            axios.get(API_ENDPOINTS.ROOMS.LIST),
            axios.get(API_ENDPOINTS.COMPLAINTS.LIST),
            axios.get(API_ENDPOINTS.STUDENTS.LIST),
            axios.get(API_ENDPOINTS.USERS.LIST)
          ])
          setRooms(roomsRes.data)
          setComplaints(complaintsRes.data)
          setStudents(studentsRes.data)
          setUsers(usersRes.data)
        } else if (user?.role === 'CARETAKER') {
          const complaintsRes = await axios.get(API_ENDPOINTS.COMPLAINTS.LIST)
          setComplaints(complaintsRes.data)
        } else if (user?.role === 'STUDENT') {
          const [roomsRes, paymentsRes, studentsRes, complaintsRes] = await Promise.all([
            axios.get(API_ENDPOINTS.ROOMS.LIST),
            axios.get(API_ENDPOINTS.PAYMENTS.LIST),
            axios.get(API_ENDPOINTS.STUDENTS.LIST),
            axios.get(API_ENDPOINTS.COMPLAINTS.LIST),
          ])
          setRooms(roomsRes.data)
          setPayments(paymentsRes.data)
          setStudents(studentsRes.data)
          setComplaints(complaintsRes.data)
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        // Set empty arrays as fallback
        setStudents([])
        setRooms([])
        setComplaints([])
        setPayments([])
        setUsers([])
      }
    }

    if (user) fetchData()
  }, [user])

  useEffect(() => {
    const fetchRentStatus = async () => {
      if (!user || user.role !== 'STUDENT') {
        return
      }

      try {
        const { data } = await axios.get(API_ENDPOINTS.FEES.RENT_STATUS, {
          params: { studentEmail: user.email },
        })
        setRentStatus(data)
      } catch (error) {
        setRentStatus(null)
      }
    }

    fetchRentStatus()
  }, [user])

  const renderAdminDashboard = () => (
    <div className="space-y-8 animate-fade-in-up">
      <PageHeader
        title="Admin Dashboard"
        description="Manage all aspects of the hostel system"
        breadcrumbs={[{ label: 'Dashboard' }]}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="animate-slide-in-left" style={{ animationDelay: '0.1s' }}>
          <StatCard
            icon={Users}
            label="Total Students"
            value={students.length}
            trend={`${users.filter(u => u.role === 'STUDENT').length} registered`}
            color="blue"
          />
        </div>
        <div className="animate-slide-in-left" style={{ animationDelay: '0.2s' }}>
          <StatCard
            icon={Users}
            label="Total Wardens"
            value={users.filter(u => u.role === 'WARDEN').length}
            color="purple"
          />
        </div>
        <div className="animate-slide-in-left" style={{ animationDelay: '0.3s' }}>
          <StatCard
            icon={Users}
            label="Total Caretakers"
            value={users.filter(u => u.role === 'CARETAKER').length}
            color="green"
          />
        </div>
        <div className="animate-slide-in-left" style={{ animationDelay: '0.4s' }}>
          <StatCard
            icon={Home}
            label="Total Rooms"
            value={rooms.length}
            trend={`${rooms.filter(r => r.occupied).length} occupied`}
            color="orange"
          />
        </div>
        <div className="animate-slide-in-left" style={{ animationDelay: '0.5s' }}>
          <StatCard
            icon={DollarSign}
            label="Paid Rents"
            value={payments.length}
            color="green"
          />
        </div>
        <div className="animate-slide-in-left" style={{ animationDelay: '0.6s' }}>
          <StatCard
            icon={AlertCircle}
            label="Total Complaints"
            value={complaints.length}
            trend={`${complaints.filter(c => c.status === 'PENDING').length} pending`}
            color="red"
          />
        </div>
        <div className="animate-slide-in-left" style={{ animationDelay: '0.7s' }}>
          <StatCard
            icon={CheckCircle}
            label="Resolved Complaints"
            value={complaints.filter(c => c.status === 'RESOLVED').length}
            color="green"
          />
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="animate-slide-in-right" style={{ animationDelay: '0.8s' }}>
          <Card variant="glass">
            <CardHeader>
              <CardTitle>Recent Complaints</CardTitle>
            </CardHeader>
            <CardContent>
              {complaints.slice(0, 5).map((complaint) => {
                const complaintSummary = complaint.description || complaint.title || 'Complaint'

                return (
                  <div key={complaint.id} className="flex justify-between items-center py-3 border-b border-gray-200/50 dark:border-dark-700/50 last:border-b-0">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-dark-100">{complaintSummary}</p>
                      <p className="text-sm text-gray-600 dark:text-dark-400">
                        By: {complaint.studentName || 'Unknown student'}
                        {complaint.registrationNumber ? ` · ${complaint.registrationNumber}` : ''}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-dark-400 mt-1">
                        {complaint.roomNumber ? `Room ${complaint.roomNumber}` : 'Room not assigned'}
                        {complaint.priority ? ` · ${complaint.priority}` : ''}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      complaint.status === 'PENDING' ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-yellow-900' :
                      complaint.status === 'RESOLVED' ? 'bg-gradient-to-r from-green-400 to-emerald-400 text-green-900' :
                      'bg-gradient-to-r from-blue-400 to-indigo-400 text-blue-900'
                    }`}>
                      {complaint.status}
                    </span>
                  </div>
                )
              })}
              {complaints.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-dark-400">
                  <AlertCircle className="mx-auto mb-2" size={32} />
                  <p>No complaints yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="animate-slide-in-right" style={{ animationDelay: '0.9s' }}>
          <Card variant="glass">
            <CardHeader>
              <CardTitle>Room Occupancy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl">
                  <span className="font-semibold text-gray-700 dark:text-dark-300">Occupied</span>
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{rooms.filter(r => r.occupied).length}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl">
                  <span className="font-semibold text-gray-700 dark:text-dark-300">Vacant</span>
                  <span className="text-2xl font-bold text-green-600 dark:text-green-400">{rooms.filter(r => !r.occupied).length}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-xl">
                  <span className="font-semibold text-gray-700 dark:text-dark-300">Total Capacity</span>
                  <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">{rooms.length * 2}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Analytics Dashboard Section */}
      <div className="mt-8">
        <AnalyticsDashboard />
      </div>
    </div>
  )

  const renderWardenDashboard = () => (
    <div>
      <PageHeader
        title="Warden Dashboard"
        description="Manage rooms, complaints, and student payments"
        breadcrumbs={[{ label: 'Dashboard' }]}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Total Students"
          value={students.length}
        />
        <StatCard
          icon={Home}
          label="Free Rooms"
          value={rooms.filter(r => !r.occupied).length}
        />
        <StatCard
          icon={AlertCircle}
          label="Pending Complaints"
          value={complaints.filter(c => c.status === 'PENDING').length}
        />
        <StatCard
          icon={Users}
          label="Free Caretakers"
          value={users.filter(u => u.role === 'CARETAKER').length}
        />
        <StatCard
          icon={DollarSign}
          label="Paid Students"
          value={students.filter(s => s.rentPaid).length}
        />
        <StatCard
          icon={DollarSign}
          label="Unpaid Students"
          value={students.filter(s => !s.rentPaid).length}
        />
        <StatCard
          icon={Home}
          label="Occupied Rooms"
          value={rooms.filter(r => r.occupied).length}
        />
        <StatCard
          icon={CheckCircle}
          label="Resolved Complaints"
          value={complaints.filter(c => c.status === 'RESOLVED').length}
        />
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Student Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Total Students</span>
                <span className="font-semibold">{students.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Paid Rent</span>
                <span className="font-semibold text-green-600">{students.filter(s => s.rentPaid).length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Unpaid Rent</span>
                <span className="font-semibold text-red-600">{students.filter(s => !s.rentPaid).length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Allocated Rooms</span>
                <span className="font-semibold">{students.filter(s => s.roomId).length}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Students</CardTitle>
          </CardHeader>
          <CardContent>
            {students.slice(0, 5).map(student => (
              <div key={student.id} className="flex justify-between items-center py-2 border-b">
                <div>
                  <p className="font-medium">{student.name}</p>
                  <p className="text-sm text-gray-600 dark:text-dark-400">{student.registrationNumber}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs ${
                    student.rentPaid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {student.rentPaid ? 'Paid' : 'Unpaid'}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Available Rooms</CardTitle>
          </CardHeader>
          <CardContent>
            {rooms.filter(r => !r.occupied).slice(0, 5).map(room => (
              <div key={room.id} className="flex justify-between items-center py-2 border-b">
                <div>
                  <p className="font-medium">Room {room.roomNumber}</p>
                  <p className="text-sm text-gray-600 dark:text-dark-400">Block {room.block}</p>
                </div>
                <span className="text-green-600">Available</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Students with Unpaid Rents</CardTitle>
          </CardHeader>
          <CardContent>
            {students.filter(s => !s.rentPaid).slice(0, 5).map(student => (
              <div key={student.id} className="flex justify-between items-center py-2 border-b">
                <div>
                  <p className="font-medium">{student.name}</p>
                  <p className="text-sm text-gray-600 dark:text-dark-400">{student.registrationNumber}</p>
                </div>
                <span className="text-red-600">Unpaid</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const renderCaretakerDashboard = () => (
    <div>
      <PageHeader
        title="Caretaker Dashboard"
        description="Manage and resolve student complaints"
        breadcrumbs={[{ label: 'Dashboard' }]}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={AlertCircle}
          label="Total Complaints"
          value={complaints.length}
        />
        <StatCard
          icon={Wrench}
          label="Pending Complaints"
          value={complaints.filter(c => c.status === 'PENDING').length}
        />
        <StatCard
          icon={CheckCircle}
          label="Resolved Complaints"
          value={complaints.filter(c => c.status === 'RESOLVED').length}
        />
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>All Complaints</CardTitle>
          </CardHeader>
          <CardContent>
            {complaints.map((complaint) => {
              const complaintSummary = complaint.description || complaint.title || 'Complaint'

              return (
                <div key={complaint.id} className="border-b border-gray-200 pb-4 mb-4 last:border-b-0 last:pb-0 last:mb-0">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-900 dark:text-dark-100">{complaintSummary}</h3>
                      <p className="text-gray-600 dark:text-dark-300 mt-1">{complaint.description || complaint.title || 'No description provided'}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        complaint.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 
                        complaint.status === 'RESOLVED' ? 'bg-green-100 text-green-800' : 
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {complaint.status}
                      </span>
                      {complaint.priority && (
                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700 dark:bg-dark-700 dark:text-dark-200">
                          {complaint.priority}
                        </span>
                      )}
                      {complaint.status === 'PENDING' && (
                        <Button size="sm" onClick={() => handleResolveComplaint(complaint.id)}>
                          Resolve
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-dark-800 rounded-lg p-3">
                    <h4 className="font-medium text-gray-900 dark:text-dark-100 mb-2">Student Details:</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-700 dark:text-dark-200">
                      <div>
                        <span className="font-medium">Name:</span> {complaint.studentName || 'N/A'}
                      </div>
                      <div>
                        <span className="font-medium">Email:</span> {complaint.studentEmail || 'N/A'}
                      </div>
                      <div>
                        <span className="font-medium">Registration:</span> {complaint.registrationNumber || 'N/A'}
                      </div>
                      <div>
                        <span className="font-medium">Department:</span> {complaint.department || 'N/A'}
                      </div>
                      <div>
                        <span className="font-medium">Year:</span> {complaint.yearOfStudy || 'N/A'}
                      </div>
                      <div>
                        <span className="font-medium">Room:</span> {complaint.roomNumber || 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const renderStudentDashboard = () => (
    <div>
      <PageHeader
        title="Student Dashboard"
        description="View your room and payment status"
        breadcrumbs={[{ label: 'Dashboard' }]}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Home}
          label="Available Rooms"
          value={rooms.filter(r => !r.occupied).length}
        />
        <StatCard
          icon={DollarSign}
          label="Rent Status"
          value={rentStatus?.status === 'DUE' ? 'Due' : 'OK'}
        />
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Available Rooms</CardTitle>
          </CardHeader>
          <CardContent>
            {rooms.filter(r => !r.occupied).slice(0, 5).map(room => (
              <div key={room.id} className="flex justify-between items-center py-2 border-b">
                <div>
                  <p className="font-medium">Room {room.roomNumber}</p>
                  <p className="text-sm text-gray-600 dark:text-dark-400">Block {room.block} - {formatCurrency(room.rentalCost)}/month</p>
                </div>
                <Button size="sm">Apply</Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rent Payment Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className={`text-4xl mb-4 ${rentStatus?.status === 'DUE' ? 'text-red-500' : 'text-green-500'}`}>
                {rentStatus?.status === 'DUE' ? '✗' : '✓'}
              </div>
              <p className="text-lg font-medium">
                {rentStatus?.status === 'DUE' ? 'Rent Due' : 'Rent Up To Date'}
              </p>
              <p className="text-sm text-gray-700 dark:text-dark-300 mt-2">
                Months paid: {rentStatus?.monthsPaid || 0}
              </p>
              {rentStatus?.consecutiveMonths > 0 && (
                <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                  🎯 {rentStatus.consecutiveMonths} consecutive payment month{rentStatus.consecutiveMonths !== 1 ? 's' : ''}
                </p>
              )}
              <p className="text-sm text-cyan-600 dark:text-cyan-300 mt-1">
                Next cycle: {rentStatus?.nextCycleToPay}
              </p>

              <hr className="my-4 border-gray-300 dark:border-dark-700" />

              <div className="py-4">
                <p className="text-sm text-gray-600 dark:text-dark-300 mb-3">Time until next payment due:</p>
                <CountdownTimer daysUntil={rentStatus?.daysUntilPaymentDue || 0} />
              </div>

              <hr className="my-4 border-gray-300 dark:border-dark-700" />

              {rentStatus?.notifyRent && (
                <p className="mt-2 text-sm text-amber-600">
                  {rentStatus?.canPayNow
                    ? `Payment window is open. Pending cycles: ${rentStatus.pendingCycles}`
                    : `Reminder: rent becomes payable on day 31. You are on day ${rentStatus.daysUsed}.`}
                </p>
              )}
              <Button
                className="mt-4"
                disabled={!rentStatus?.canPayNow || isPayingRent}
                onClick={handlePayRent}
              >
                {isPayingRent ? 'Processing...' : rentStatus?.canPayNow ? 'Pay Rent' : 'Payment Locked'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Submit Complaint</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitComplaint} className="space-y-4">
              <textarea
                name="description"
                placeholder="Description"
                className="w-full px-3 py-2 border rounded"
                rows={3}
                required
              />
              <select
                name="priority"
                className="w-full px-3 py-2 border rounded bg-white dark:bg-dark-900"
                defaultValue="MEDIUM"
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
              </select>
              <Button type="submit">Submit Complaint</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const handleResolveComplaint = async (complaintId) => {
    try {
      await axios.put(API_ENDPOINTS.COMPLAINTS.UPDATE(complaintId), {
        status: 'RESOLVED',
      })
      // Refresh complaints
      const complaintsRes = await axios.get(API_ENDPOINTS.COMPLAINTS.LIST)
      setComplaints(complaintsRes.data)
      toast.success('Complaint resolved successfully')
    } catch (error) {
      console.error('Error resolving complaint:', error)
      toast.error('Failed to resolve complaint')
    }
  }

  const handleSubmitComplaint = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    try {
      await axios.post(API_ENDPOINTS.COMPLAINTS.CREATE, {
        description: formData.get('description'),
        priority: formData.get('priority'),
        studentEmail: user.email,
      })
      // Refresh complaints
      const complaintsRes = await axios.get(API_ENDPOINTS.COMPLAINTS.LIST)
      setComplaints(complaintsRes.data)
      e.target.reset()
      toast.success('Complaint submitted successfully')
    } catch (error) {
      console.error('Error submitting complaint:', error)
      toast.error('Failed to submit complaint')
    }
  }

  const handlePayRent = async () => {
    try {
      setIsPayingRent(true)
      await axios.post(API_ENDPOINTS.FEES.RENT_PAY, {
        studentEmail: user.email,
        method: 'CARD',
      })

      const [paymentsRes, rentStatusRes] = await Promise.all([
        axios.get(API_ENDPOINTS.PAYMENTS.LIST),
        axios.get(API_ENDPOINTS.FEES.RENT_STATUS, { params: { studentEmail: user.email } }),
      ])

      setPayments(paymentsRes.data)
      setRentStatus(rentStatusRes.data)
      toast.success('Rent paid successfully')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to process rent payment')
    } finally {
      setIsPayingRent(false)
    }
  }

  if (!user) return <div>Loading...</div>

  switch (user.role) {
    case 'ADMIN':
      return renderAdminDashboard()
    case 'WARDEN':
      return renderWardenDashboard()
    case 'CARETAKER':
      return renderCaretakerDashboard()
    case 'STUDENT':
      return renderStudentDashboard()
    default:
      return <div>Invalid role</div>
  }
}
