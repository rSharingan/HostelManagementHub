// path: src/features/student-portal/StudentDashboardPage.jsx
import { User, Home, DollarSign, AlertCircle, Eye, CreditCard, MessageSquare, GraduationCap, Calendar, CheckCircle, MapPin, Receipt } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useStudentDashboard } from './hooks'
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
        color === 'green' ? 'from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30' :
        color === 'orange' ? 'from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30' :
        color === 'purple' ? 'from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30' :
        'from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30'
      } group-hover:scale-110 transition-transform duration-300`}>
        <Icon className={`${
          color === 'green' ? 'text-green-600 dark:text-green-400' :
          color === 'orange' ? 'text-orange-600 dark:text-orange-400' :
          color === 'purple' ? 'text-purple-600 dark:text-purple-400' :
          'text-blue-600 dark:text-blue-400'
        }`} size={22} />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
    </div>
    {children}
  </div>
)

const QuickActionCard = ({ title, description, icon: Icon, buttonText, buttonColor, link, onClick, delay = 0 }) => (
  <div className={`group bg-gradient-to-br ${
    buttonColor === 'green' ? 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800 hover:border-green-400 dark:hover:border-green-600' :
    buttonColor === 'orange' ? 'from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-orange-200 dark:border-orange-800 hover:border-orange-400 dark:hover:border-orange-600' :
    buttonColor === 'purple' ? 'from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800 hover:border-purple-400 dark:hover:border-purple-600' :
    'from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600'
  } rounded-2xl border-2 p-6 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 animate-fade-in`} style={{ animationDelay: `${delay * 100}ms` }}>
    <div className="flex items-center gap-4 mb-4">
      <div className={`p-3 rounded-xl bg-gradient-to-br ${
        buttonColor === 'green' ? 'from-green-400 to-emerald-600' :
        buttonColor === 'orange' ? 'from-orange-400 to-red-600' :
        buttonColor === 'purple' ? 'from-purple-400 to-pink-600' :
        'from-blue-400 to-cyan-600'
      } rounded-full flex items-center justify-center shadow-md transform group-hover:scale-110 transition-transform duration-300`}>
        <Icon className="text-white" size={28} />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">{description}</p>
      </div>
    </div>
    {link ? (
      <Link to={link}>
        <button className={`w-full py-3 px-4 bg-gradient-to-r ${
          buttonColor === 'green' ? 'from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600' :
          buttonColor === 'orange' ? 'from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600' :
          buttonColor === 'purple' ? 'from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600' :
          'from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600'
        } text-white rounded-xl transition-all duration-300 transform hover:scale-105 shadow-md font-medium`}>
          {buttonText}
        </button>
      </Link>
    ) : (
      <button
        onClick={onClick}
        className={`w-full py-3 px-4 bg-gradient-to-r ${
          buttonColor === 'green' ? 'from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600' :
          buttonColor === 'orange' ? 'from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600' :
          buttonColor === 'purple' ? 'from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600' :
          'from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600'
        } text-white rounded-xl transition-all duration-300 transform hover:scale-105 shadow-md font-medium`}
      >
        {buttonText}
      </button>
    )}
  </div>
)

export const StudentDashboardPage = () => {
  const { data: stats, isLoading } = useStudentDashboard()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading student portal...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-50 to-blue-50/30 dark:from-slate-950 dark:via-slate-950 dark:to-blue-950/20 relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 -left-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" style={{ animationDelay: '2s' }}></div>
        <div className="absolute -bottom-8 left-20 w-80 h-80 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 text-white overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 right-10 w-40 h-40 bg-white rounded-full animate-blob" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-16">
          <div className="flex items-center gap-4 mb-4 animate-fade-in">
            <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm transform transition-all duration-300 hover:scale-110 hover:bg-white/30 animate-float">
              <GraduationCap size={40} />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-white">Student Portal</h1>
              <p className="text-blue-100 mt-2 text-lg">Manage your hostel experience with ease</p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 -mt-10 pb-16">
        {/* Key Metrics Section */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full"></div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Your Status</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <ModernStatCard
              icon={Home}
              label="My Room"
              value={stats?.roomNumber || 'Not allocated'}
              trend={stats?.roomStatus || 'Check status'}
              bgGradient="bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-700"
              delay={0}
            />
            <ModernStatCard
              icon={DollarSign}
              label="Pending Fees"
              value={formatCurrency(stats?.pendingFees || 0)}
              trend={`${stats?.pendingInvoices || 0} invoices`}
              bgGradient="bg-gradient-to-br from-orange-500 via-orange-600 to-red-700"
              delay={1}
            />
            <ModernStatCard
              icon={Eye}
              label="Available Rooms"
              value={stats?.availableRooms || 0}
              trend="Rooms to choose from"
              bgGradient="bg-gradient-to-br from-green-500 via-green-600 to-emerald-700"
              delay={2}
            />
            <ModernStatCard
              icon={AlertCircle}
              label="My Complaints"
              value={stats?.myComplaints?.length || 0}
              trend="Active requests"
              bgGradient="bg-gradient-to-br from-purple-500 via-pink-600 to-red-700"
              delay={3}
            />
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-700 to-transparent mb-12"></div>

        {/* Main Features Section */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-8 bg-gradient-to-b from-green-500 to-cyan-500 rounded-full"></div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">My Portal</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Available Rooms */}
            <ActivityCard title="Available Rooms" icon={Eye} color="green" delay={0}>
              <div className="space-y-3">
                {stats?.availableRoomsList?.length > 0 ? (
                  stats.availableRoomsList.slice(0, 3).map((room, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-green-50 dark:from-slate-800 dark:to-slate-800/50 rounded-xl hover:from-green-50 hover:to-emerald-50 dark:hover:from-slate-700 dark:hover:to-slate-700/50 transition-all duration-300 transform hover:scale-102 hover:shadow-md group border-l-4 border-green-500 animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                          <Home className="text-white" size={24} />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-slate-100">Room {room.roomNumber}</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {room.type} • Cap: {room.capacity}
                          </p>
                          <p className="text-sm font-medium text-green-600 dark:text-green-400">
                            {formatCurrency(room.price)}/month
                          </p>
                        </div>
                      </div>
                      <Link to="/student-portal/rooms">
                        <button className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105 shadow-md font-medium">
                          View Details
                        </button>
                      </Link>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Home className="mx-auto text-slate-400 mb-3" size={48} />
                    <p className="text-slate-500 dark:text-slate-400 font-medium">No rooms currently available</p>
                    <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Check back later</p>
                  </div>
                )}
              </div>
              <Link to="/student-portal/rooms">
                <button className="w-full mt-4 py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium hover:from-green-600 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105 shadow-md">
                  View All Available Rooms
                </button>
              </Link>
            </ActivityCard>

            {/* Fee Payment Status */}
            <ActivityCard title="Fee Payment Status" icon={Receipt} color="orange" delay={1}>
              <div className="space-y-3">
                {stats?.pendingInvoices?.length > 0 ? (
                  stats.pendingInvoices.slice(0, 3).map((invoice, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-orange-50 dark:from-slate-800 dark:to-slate-800/50 rounded-xl hover:from-orange-50 hover:to-red-50 dark:hover:from-slate-700 dark:hover:to-slate-700/50 transition-all duration-300 transform hover:scale-102 hover:shadow-md group border-l-4 animate-fade-in" style={{
                      borderColor: invoice.status === 'OVERDUE' ? '#ef4444' : invoice.status === 'PENDING' ? '#f59e0b' : '#10b981',
                      animationDelay: `${index * 50}ms`
                    }}>
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                          invoice.status === 'OVERDUE' ? 'bg-gradient-to-br from-red-400 to-red-600' :
                          invoice.status === 'PENDING' ? 'bg-gradient-to-br from-orange-400 to-orange-600' :
                          'bg-gradient-to-br from-green-400 to-green-600'
                        }`}>
                          {invoice.id}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-slate-100">Invoice #{invoice.id}</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Due: {new Date(invoice.dueDate).toLocaleDateString()}
                          </p>
                          <p className="text-sm font-medium text-orange-600 dark:text-orange-400">
                            {formatCurrency(invoice.amount)}
                          </p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold transform group-hover:scale-110 transition-transform duration-300 ${
                        invoice.status === 'PENDING' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' :
                        invoice.status === 'OVERDUE' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                        'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      }`}>
                        {invoice.status}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <CheckCircle className="mx-auto text-green-500 mb-3" size={48} />
                    <p className="text-slate-500 dark:text-slate-400 font-medium">All fees paid</p>
                    <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">No outstanding payments</p>
                  </div>
                )}
              </div>
              <Link to="/student-portal/fees">
                <button className="w-full mt-4 py-3 px-4 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl font-medium hover:from-orange-600 hover:to-red-700 transition-all duration-300 transform hover:scale-105 shadow-md">
                  View All Payments
                </button>
              </Link>
            </ActivityCard>

            {/* Complaint Submission */}
            <ActivityCard title="Submit Complaint" icon={MessageSquare} color="purple" delay={2}>
              <div className="space-y-4">
                <div className="text-center py-6">
                  <MessageSquare className="mx-auto text-purple-500 mb-3" size={40} />
                  <p className="text-slate-600 dark:text-slate-400 mb-4 font-medium">
                    Report maintenance issues, facility problems, or other concerns
                  </p>
                  <button className="w-full py-3 px-4 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl font-medium hover:from-purple-600 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 shadow-md">
                    Submit New Complaint
                  </button>
                </div>
                {stats?.myComplaints?.length > 0 && (
                  <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-3">Recent Complaints</p>
                    {stats.myComplaints.slice(0, 2).map((complaint, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gradient-to-r from-slate-50 to-purple-50 dark:from-slate-800 dark:to-slate-800/50 rounded-lg mb-2 hover:from-purple-50 hover:to-pink-50 dark:hover:from-slate-700 dark:hover:to-slate-700/50 transition-all duration-300 group animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100 line-clamp-1">{complaint.description}</p>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                            {new Date(complaint.reportedDate).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold transform group-hover:scale-110 transition-transform duration-300 ${
                          complaint.status === 'PENDING' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' :
                          complaint.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                          'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        }`}>
                          {complaint.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ActivityCard>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-700 to-transparent mb-12"></div>

        {/* Quick Actions Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-8 bg-gradient-to-b from-slate-400 to-slate-600 rounded-full"></div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <QuickActionCard
              title="Room Information"
              description="View your room details and allocation status"
              icon={Home}
              buttonText="View Room"
              buttonColor="blue"
              onClick={() => console.log('View room clicked')}
              delay={0}
            />

            <QuickActionCard
              title="Pay Rent"
              description="Make payments for your pending fees"
              icon={CreditCard}
              buttonText="Pay Now"
              buttonColor="green"
              link="/student-portal/fees"
              delay={1}
            />

            <QuickActionCard
              title="Apply Complaint"
              description="Submit maintenance requests for your room"
              icon={MessageSquare}
              buttonText="Submit Request"
              buttonColor="orange"
              onClick={() => console.log('Submit complaint clicked')}
              delay={2}
            />

            <QuickActionCard
              title="Available Rooms"
              description="Browse and view available rooms"
              icon={Eye}
              buttonText="View Rooms"
              buttonColor="purple"
              link="/student-portal/rooms"
              delay={3}
            />
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