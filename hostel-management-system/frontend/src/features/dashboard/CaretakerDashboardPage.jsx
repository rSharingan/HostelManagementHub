// path: src/features/dashboard/CaretakerDashboardPage.jsx
import { AlertCircle, Wrench, CheckCircle, Clock, UserCheck, Building2, Play, Check, Home, MapPin } from 'lucide-react'
import { useDashboardStats } from './hooks'

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
        color === 'green' ? 'from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30' :
        color === 'orange' ? 'from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30' :
        'from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30'
      } group-hover:scale-110 transition-transform duration-300`}>
        <Icon className={`${
          color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
          color === 'green' ? 'text-green-600 dark:text-green-400' :
          color === 'orange' ? 'text-orange-600 dark:text-orange-400' :
          'text-purple-600 dark:text-purple-400'
        }`} size={22} />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
    </div>
    {children}
  </div>
)

export const CaretakerDashboardPage = () => {
  const { data: stats, isLoading } = useDashboardStats()

  const caretakerComplaints = stats?.caretakerComplaints?.filter(c => c.status === 'PENDING') || []
  const inProgressComplaints = stats?.caretakerComplaints?.filter(c => c.status === 'IN_PROGRESS') || []

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading caretaker dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-50 to-green-50/30 dark:from-slate-950 dark:via-slate-950 dark:to-green-950/20 relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 -left-40 w-80 h-80 bg-green-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 -right-40 w-80 h-80 bg-teal-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" style={{ animationDelay: '2s' }}></div>
        <div className="absolute -bottom-8 left-20 w-80 h-80 bg-cyan-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-green-600 via-teal-600 to-cyan-600 text-white overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 right-10 w-40 h-40 bg-white rounded-full animate-blob" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-16">
          <div className="flex items-center gap-4 mb-4 animate-fade-in">
            <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm transform transition-all duration-300 hover:scale-110 hover:bg-white/30 animate-float">
              <Wrench size={40} />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-cyan-100 to-white">Caretaker Dashboard</h1>
              <p className="text-green-100 mt-2 text-lg">Manage maintenance complaints from your hostel</p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 -mt-10 pb-16">
        {/* Key Metrics Section */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-8 bg-gradient-to-b from-green-500 to-teal-500 rounded-full"></div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Key Metrics</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <ModernStatCard
              icon={AlertCircle}
              label="Pending Complaints"
              value={caretakerComplaints.length}
              trend="From your hostel"
              bgGradient="bg-gradient-to-br from-orange-500 via-orange-600 to-red-700"
              delay={0}
            />
            <ModernStatCard
              icon={Wrench}
              label="In Progress"
              value={inProgressComplaints.length}
              trend="Currently working on"
              bgGradient="bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-600"
              delay={1}
            />
            <ModernStatCard
              icon={CheckCircle}
              label="Completed Today"
              value="0"
              trend="Issues resolved"
              bgGradient="bg-gradient-to-br from-green-500 via-emerald-600 to-teal-700"
              delay={2}
            />
            <ModernStatCard
              icon={Home}
              label="Hostel Rooms"
              value={stats?.totalRooms || 0}
              trend="Under your care"
              bgGradient="bg-gradient-to-br from-purple-500 via-indigo-600 to-blue-700"
              delay={3}
            />
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-700 to-transparent mb-12"></div>

        {/* Hostel Overview Section */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full"></div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white\">Hostel Overview</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ActivityCard title="Hostel Maintenance Status" icon={Building2} color="blue" delay={0}>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/20 dark:to-red-900/20 p-5 rounded-xl border border-orange-200 dark:border-orange-800 transform hover:scale-110 transition-transform duration-300">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-4 h-4 bg-orange-500 rounded-full animate-pulse"></div>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">Pending</span>
                  </div>
                  <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{caretakerComplaints.length}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">awaiting action</p>
                </div>
                <div className="bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/20 dark:to-cyan-900/20 p-5 rounded-xl border border-blue-200 dark:border-blue-800 transform hover:scale-110 transition-transform duration-300">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">In Progress</span>
                  </div>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{inProgressComplaints.length}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">being worked on</p>
                </div>
              </div>
            </ActivityCard>

            <ActivityCard title="Quick Actions" icon={UserCheck} color="green" delay={1}>
              <div className="grid grid-cols-1 gap-3">
                <button className="w-full p-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-medium hover:from-green-600 hover:to-emerald-600 transition-all duration-300 transform hover:scale-105 shadow-md flex items-center justify-center gap-2">
                  <CheckCircle size={20} />
                  Mark Task Complete
                </button>
                <button className="w-full p-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-medium hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 transform hover:scale-105 shadow-md flex items-center justify-center gap-2">
                  <Wrench size={20} />
                  Request Supplies
                </button>
                <button className="w-full p-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 shadow-md flex items-center justify-center gap-2">
                  <MapPin size={20} />
                  View Hostel Layout
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
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Maintenance Tasks</h2>
          </div>
          <ActivityCard title="Pending Complaints Assigned to You" icon={AlertCircle} color="orange" delay={0}>
            <div className="space-y-3">
              {caretakerComplaints.length > 0 ? (
                caretakerComplaints.map((complaint, index) => (
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
                      <button className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-md inline-flex items-center gap-2">
                        <Play size={14} />
                        Start Work
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <CheckCircle className="mx-auto text-green-500 mb-3" size={48} />
                  <p className="text-slate-500 dark:text-slate-400 font-medium">No pending complaints</p>
                  <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">All maintenance issues have been resolved</p>
                </div>
              )}
            </div>
          </ActivityCard>
        </div>

        {/* Work in Progress Section */}
        {inProgressComplaints.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full"></div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Work in Progress</h2>
            </div>
            <ActivityCard title="Tasks Currently Being Worked On" icon={Wrench} color="blue" delay={0}>
              <div className="space-y-3">
                {inProgressComplaints.map((complaint, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-800 dark:to-slate-800/50 rounded-xl hover:from-blue-50 hover:to-cyan-50 dark:hover:from-slate-700 dark:hover:to-slate-700/50 transition-all duration-300 transform hover:scale-102 hover:shadow-md group border-l-4 border-blue-500 animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-full flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                        <Wrench className="text-white" size={24} />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900 dark:text-slate-100 line-clamp-2">{complaint.description}</p>
                        <div className="flex items-center gap-4 mt-2 flex-wrap">
                          <span className="inline-flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400">
                            <Home size={14} /> Room {complaint.roomNumber}
                          </span>
                          <span className="text-sm text-slate-600 dark:text-slate-400">
                            Started: {new Date(complaint.reportedDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105 shadow-md inline-flex items-center gap-2">
                      <Check size={14} />
                      Complete
                    </button>
                  </div>
                ))}
              </div>
            </ActivityCard>
          </div>
        )}
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