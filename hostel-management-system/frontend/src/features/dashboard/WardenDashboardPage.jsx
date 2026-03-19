// path: src/features/dashboard/WardenDashboardPage.jsx
import { Users, Home, AlertCircle, Eye, TrendingUp, Shield, Building2, Clock, CheckCircle, MapPin } from 'lucide-react'
import { useDashboardStats } from './hooks'
import { formatCurrency } from '../../lib/utils'

const ModernStatCard = ({ icon: Icon, label, value, trend, color = "blue", bgGradient, delay = 0 }) => (
  <div className={`relative overflow-hidden rounded-2xl ${bgGradient} p-6 text-white shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-110 group animate-fade-in`} style={{ animationDelay: `${delay * 100}ms` }}>
    {/* Shimmer effect */}
    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    
    <div className="flex items-center justify-between relative z-10">
      <div>
        <p className="text-sm font-medium opacity-90">{label}</p>
        <p className="text-4xl font-bold mt-2">{value}</p>
        <p className="text-xs opacity-75 mt-2">{trend}</p>
      </div>
      <div className="opacity-30 animate-float">
        <Icon size={56} />
      </div>
    </div>
    <div className="absolute -bottom-6 -right-6 opacity-10 animate-blob">
      <Icon size={100} />
    </div>
  </div>
)

const ActivityCard = ({ title, children, icon: Icon, color = "blue", delay = 0 }) => (
  <div className={`bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 dark:border-slate-700/50 p-6 shadow-md hover:shadow-lg transition-all duration-300 animate-fade-in group`} style={{ animationDelay: `${delay * 100}ms` }}>
    <div className="flex items-center gap-3 mb-6">
      <div className={`p-3 rounded-xl bg-gradient-to-br ${
        color === 'blue' ? 'from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30' :
        color === 'purple' ? 'from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30' :
        color === 'orange' ? 'from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30' :
        'from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30'
      } group-hover:scale-110 transition-transform duration-300`}>
        <Icon className={`${
          color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
          color === 'purple' ? 'text-purple-600 dark:text-purple-400' :
          color === 'orange' ? 'text-orange-600 dark:text-orange-400' :
          'text-green-600 dark:text-green-400'
        }`} size={22} />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
    </div>
    {children}
  </div>
)

export const WardenDashboardPage = () => {
  const { data: stats, isLoading } = useDashboardStats()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading warden dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-50 to-indigo-50/30 dark:from-slate-950 dark:via-slate-950 dark:to-indigo-950/20 relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 -left-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" style={{ animationDelay: '2s' }}></div>
        <div className="absolute -bottom-8 left-20 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 right-10 w-40 h-40 bg-white rounded-full animate-blob" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-16">
          <div className="flex items-center gap-4 mb-4 animate-fade-in">
            <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm transform transition-all duration-300 hover:scale-110 hover:bg-white/30 animate-float">
              <Shield size={40} />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-white">Warden Dashboard</h1>
              <p className="text-purple-100 mt-2 text-lg">Monitor student complaints and hostel room availability</p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 -mt-10 pb-16">
        {/* Key Metrics Section */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-8 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full"></div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Key Metrics</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <ModernStatCard
              icon={Users}
              label="Total Students"
              value={stats?.totalStudents || 0}
              trend="Students under supervision"
              bgGradient="bg-gradient-to-br from-indigo-500 via-indigo-600 to-indigo-700"
              delay={0}
            />
            <ModernStatCard
              icon={Home}
              label="Available Rooms"
              value={stats?.availableRooms || 0}
              trend="Ready for student allocation"
              bgGradient="bg-gradient-to-br from-green-500 via-green-600 to-emerald-700"
              delay={1}
            />
            <ModernStatCard
              icon={AlertCircle}
              label="Student Complaints"
              value={stats?.wardenComplaints?.length || 0}
              trend="From students in your hostel"
              bgGradient="bg-gradient-to-br from-orange-500 via-red-500 to-rose-600"
              delay={2}
            />
            <ModernStatCard
              icon={TrendingUp}
              label="Occupancy Rate"
              value={`${stats?.occupancyRate || 0}%`}
              trend="Current room utilization"
              bgGradient="bg-gradient-to-br from-purple-500 via-pink-500 to-red-500"
              delay={3}
            />
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-700 to-transparent mb-12"></div>

        {/* Room Management Section */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-8 bg-gradient-to-b from-green-500 to-emerald-500 rounded-full"></div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Room Management</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ActivityCard title="Available Rooms for Students" icon={Building2} color="blue" delay={0}>
              <div className="space-y-3">
                {stats?.availableRoomsList?.length > 0 ? (
                  stats.availableRoomsList.map((room, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-800 dark:to-slate-800/50 rounded-xl hover:from-blue-50 hover:to-cyan-50 dark:hover:from-slate-700 dark:hover:to-slate-700/50 transition-all duration-300 transform hover:scale-102 hover:shadow-md group animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                          <Home className="text-white" size={28} />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-slate-100">Room {room.roomNumber}</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {room.type} • Capacity: {room.capacity} students
                          </p>
                          <p className="text-sm font-medium text-green-600 dark:text-green-400">
                            {formatCurrency(room.price)}/month per student
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded-full text-xs font-medium mb-2 block">
                          Available Now
                        </span>
                        <button className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 transform hover:scale-105 shadow-md">
                          View Details
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Home className="mx-auto text-slate-400 mb-3" size={48} />
                    <p className="text-slate-500 dark:text-slate-400 font-medium">No rooms currently available</p>
                    <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">All rooms are occupied</p>
                  </div>
                )}
              </div>
            </ActivityCard>

            <ActivityCard title="Room Occupancy Overview" icon={Eye} color="purple" delay={1}>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 p-5 rounded-xl border border-green-200 dark:border-green-800 transform hover:scale-110 transition-transform duration-300">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">Occupied</span>
                  </div>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats?.occupiedRooms || 0}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">rooms in use</p>
                </div>
                <div className="bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/20 dark:to-cyan-900/20 p-5 rounded-xl border border-blue-200 dark:border-blue-800 transform hover:scale-110 transition-transform duration-300">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">Available</span>
                  </div>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats?.availableRooms || 0}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">rooms free</p>
                </div>
              </div>
              <div className="space-y-3">
                <button className="w-full p-4 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white rounded-xl font-medium hover:from-purple-600 hover:via-pink-600 hover:to-red-600 transition-all duration-300 transform hover:scale-105 shadow-md flex items-center justify-center gap-2">
                  <MapPin size={20} />
                  View Room Layout
                </button>
                <button className="w-full p-4 bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 text-white rounded-xl font-medium hover:from-blue-600 hover:via-cyan-600 hover:to-teal-600 transition-all duration-300 transform hover:scale-105 shadow-md flex items-center justify-center gap-2">
                  <Users size={20} />
                  Student Room Assignments
                </button>
              </div>
            </ActivityCard>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-700 to-transparent mb-12"></div>

        {/* Complaints Section */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-8 bg-gradient-to-b from-orange-500 to-red-500 rounded-full"></div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Student Complaints</h2>
          </div>
          <ActivityCard title="Complaints from Your Hostel" icon={AlertCircle} color="orange" delay={0}>
            <div className="space-y-3">
              {stats?.wardenComplaints?.length > 0 ? (
                stats.wardenComplaints.map((complaint, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-orange-50 dark:from-slate-800 dark:to-slate-800/50 rounded-xl hover:from-orange-50 hover:to-red-50 dark:hover:from-slate-700 dark:hover:to-slate-700/50 transition-all duration-300 transform hover:scale-102 hover:shadow-md group border-l-4 animate-fade-in" style={{
                    borderColor: complaint.priority === 'HIGH' ? '#ef4444' : complaint.priority === 'MEDIUM' ? '#f59e0b' : '#10b981',
                    animationDelay: `${index * 50}ms`
                  }}>
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-sm ${
                        complaint.priority === 'HIGH' ? 'bg-gradient-to-br from-red-400 to-red-600' :
                        complaint.priority === 'MEDIUM' ? 'bg-gradient-to-br from-yellow-400 to-orange-600' :
                        'bg-gradient-to-br from-green-400 to-emerald-600'
                      }`}>
                        {complaint.priority[0]}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900 dark:text-slate-100 line-clamp-2">{complaint.description}</p>
                        <div className="flex items-center gap-4 mt-2 flex-wrap">
                          <span className="inline-flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400">
                            <Home size={14} /> Room {complaint.roomNumber}
                          </span>
                          <span className="text-sm text-slate-600 dark:text-slate-400">{complaint.studentName}</span>
                          <span className="text-xs text-slate-500 dark:text-slate-500">{new Date(complaint.reportedDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold transform group-hover:scale-110 transition-transform duration-300 ${
                        complaint.priority === 'HIGH' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                        complaint.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                        'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      }`}>
                        {complaint.priority}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold transform group-hover:scale-110 transition-transform duration-300 ${
                        complaint.status === 'PENDING' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' :
                        complaint.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                        'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      }`}>
                        {complaint.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <CheckCircle className="mx-auto text-green-500 mb-3" size={48} />
                  <p className="text-slate-500 dark:text-slate-400 font-medium">No complaints from students</p>
                  <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">All student issues have been resolved</p>
                </div>
              )}
            </div>
          </ActivityCard>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-700 to-transparent mb-12"></div>

        {/* Quick Actions Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-8 bg-gradient-to-b from-slate-400 to-slate-600 rounded-full"></div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="group bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl border-2 border-indigo-200 dark:border-indigo-800 p-6 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 hover:border-indigo-400 dark:hover:border-indigo-600 animate-fade-in" style={{ animationDelay: '0ms' }}>
              <div className="text-center">
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 transform group-hover:scale-110 transition-transform duration-300 shadow-md">
                  <Users className="text-white" size={28} />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Student Management</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">View and manage student records</p>
                <button className="w-full py-2 px-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg font-medium hover:from-indigo-600 hover:to-purple-600 transition-all duration-300 transform hover:scale-105 shadow-md">
                  View Students
                </button>
              </div>
            </div>

            <div className="group bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl border-2 border-green-200 dark:border-green-800 p-6 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 hover:border-green-400 dark:hover:border-green-600 animate-fade-in" style={{ animationDelay: '50ms' }}>
              <div className="text-center">
                <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 transform group-hover:scale-110 transition-transform duration-300 shadow-md">
                  <CheckCircle className="text-white" size={28} />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Maintenance Reports</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Generate hostel maintenance reports</p>
                <button className="w-full py-2 px-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-medium hover:from-green-600 hover:to-emerald-600 transition-all duration-300 transform hover:scale-105 shadow-md">
                  Generate Report
                </button>
              </div>
            </div>

            <div className="group bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl border-2 border-purple-200 dark:border-purple-800 p-6 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 hover:border-purple-400 dark:hover:border-purple-600 animate-fade-in" style={{ animationDelay: '100ms' }}>
              <div className="text-center">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4 transform group-hover:scale-110 transition-transform duration-300 shadow-md">
                  <Clock className="text-white" size={28} />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Attendance Tracking</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Monitor student attendance records</p>
                <button className="w-full py-2 px-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 shadow-md">
                  View Attendance
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-12px);
          }
        }
        
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
          opacity: 0;
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }

        .group:hover .scale-110 {
          transform: scale(1.1);
        }
      `}</style>
    </div>
  )
}