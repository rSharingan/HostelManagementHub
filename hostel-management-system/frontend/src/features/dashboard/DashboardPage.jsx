// path: src/features/dashboard/DashboardPage.jsx
import { Users, Home, DollarSign, AlertCircle, CheckCircle, UserCheck, TrendingUp, Eye, Activity, Shield, Building2, CreditCard, XCircle, Clock, Sparkles, TrendingDown, Zap } from 'lucide-react'
import { useDashboardStats } from './hooks'
import { formatCurrency } from '../../lib/utils'

const ModernStatCard = ({ icon: Icon, label, value, trend, color = "blue", bgGradient, delay = 0 }) => (
  <div className={`relative overflow-hidden rounded-3xl ${bgGradient} p-6 text-white shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 cursor-pointer group animate-fade-in`}
    style={{ animationDelay: `${delay * 100}ms` }}>
    {/* Animated gradient overlay */}
    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
    
    <div className="flex items-center justify-between relative z-10">
      <div className="flex-1">
        <p className="text-sm font-medium opacity-90 group-hover:opacity-100 transition-opacity">{label}</p>
        <p className="text-4xl font-bold mt-2 group-hover:scale-110 transition-transform duration-300 origin-left">{value}</p>
        <p className="text-xs opacity-80 mt-2 group-hover:opacity-100 transition-opacity flex items-center gap-1">
          <Sparkles size={14} className="inline" />
          {trend}
        </p>
      </div>
      <div className="opacity-30 group-hover:opacity-40 transition-opacity duration-300 transform group-hover:scale-110">
        <Icon size={56} className="animate-float" />
      </div>
    </div>
    <div className="absolute -bottom-6 -right-6 opacity-5 group-hover:opacity-10 transition-opacity duration-300">
      <Icon size={120} />
    </div>
    
    {/* Shimmer effect */}
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-500 transform -skew-x-12"></div>
  </div>
)

const ActivityCard = ({ title, children, icon: Icon, color = "blue", delay = 0 }) => (
  <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 rounded-3xl border border-slate-200/50 dark:border-slate-700/50 p-8 shadow-lg hover:shadow-2xl transition-all duration-500 group backdrop-blur-sm animate-fade-in"
    style={{ animationDelay: `${delay * 100}ms` }}>
    
    {/* Decorative gradient background */}
    <div className="absolute inset-0 bg-gradient-to-br from-slate-500/5 to-slate-600/5 dark:from-slate-400/5 dark:to-slate-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    
    <div className="flex items-center gap-4 mb-8 relative z-10">
      <div className={`p-3 rounded-2xl bg-gradient-to-br from-${color}-100 to-${color}-200 dark:from-${color}-900/40 dark:to-${color}-800/40 group-hover:shadow-lg transition-all duration-300 transform group-hover:scale-110`}>
        <Icon className={`text-${color}-600 dark:text-${color}-400`} size={28} />
      </div>
      <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-slate-900 group-hover:to-slate-600 group-hover:bg-clip-text transition-all duration-300">
        {title}
      </h3>
    </div>
    
    <div className="relative z-10">
      {children}
    </div>
  </div>
)

const TransactionItem = ({ transaction, type, index }) => (
  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-700/50 dark:to-slate-800/50 rounded-2xl hover:from-slate-100 hover:to-slate-200 dark:hover:from-slate-600/50 dark:hover:to-slate-700/50 transition-all duration-300 transform hover:scale-102 hover:shadow-lg group cursor-pointer animate-fade-in"
    style={{ animationDelay: `${index * 50}ms` }}>
    <div className="flex items-center gap-3 flex-1">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-md transition-all duration-300 transform group-hover:scale-110 ${
        type === 'paid' ? 'bg-gradient-to-br from-green-400 to-green-600 dark:from-green-500 dark:to-green-700' :
        type === 'unpaid' ? 'bg-gradient-to-br from-red-400 to-red-600 dark:from-red-500 dark:to-red-700' :
        'bg-gradient-to-br from-blue-400 to-blue-600 dark:from-blue-500 dark:to-blue-700'
      }`}>
        {type === 'paid' ? <CheckCircle className="text-white" size={24} /> :
         type === 'unpaid' ? <XCircle className="text-white" size={24} /> :
         <CreditCard className="text-white" size={24} />}
      </div>
      <div className="flex-1">
        <p className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-slate-900 group-hover:to-slate-600 group-hover:bg-clip-text transition-all duration-300">
          {transaction.studentName}
        </p>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Room {transaction.roomNumber} • {new Date(transaction.date).toLocaleDateString()}
        </p>
      </div>
    </div>
    <div className="text-right">
      <p className={`font-bold text-xl transition-all duration-300 transform group-hover:scale-110 origin-right ${
        type === 'paid' ? 'text-green-600 dark:text-green-400' :
        type === 'unpaid' ? 'text-red-600 dark:text-red-400' :
        'text-blue-600 dark:text-blue-400'
      }`}>
        {formatCurrency(transaction.amount)}
      </p>
      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{transaction.method || 'Pending'}</p>
    </div>
  </div>
)

export const DashboardPage = () => {
  const { data: stats, isLoading } = useDashboardStats()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Animated background elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob dark:opacity-5"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000 dark:opacity-5"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000 dark:opacity-5"></div>
      </div>

      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 dark:from-blue-900 dark:via-purple-900 dark:to-indigo-900 text-white overflow-hidden">
        {/* Animated gradient overlay */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-white/10 to-purple-500/0 animate-pulse"></div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-16 relative z-10">
          <div className="flex items-center gap-6 mb-6 animate-fade-in">
            <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-md border border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-110">
              <Building2 size={40} className="animate-float" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="text-yellow-300 animate-spin" size={24} />
                <h1 className="text-5xl font-black bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">Admin Dashboard</h1>
              </div>
              <p className="text-blue-100 text-lg">Complete oversight of hostel operations and finances</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-12 relative z-20">
        {/* Key Financial Metrics */}
        <div className="mt-12 mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-8 bg-gradient-to-b from-blue-600 to-purple-600 rounded-full"></div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Financial Overview</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <ModernStatCard
              icon={CheckCircle}
              label="Total Paid"
              value={formatCurrency(stats?.totalPaid || 0)}
              trend="Revenue collected this month"
              bgGradient="bg-gradient-to-br from-green-400 via-green-500 to-emerald-600 hover:from-green-500 hover:via-green-600 hover:to-emerald-700"
              delay={0}
            />
            <ModernStatCard
              icon={XCircle}
              label="Total Unpaid"
              value={formatCurrency(stats?.totalUnpaid || 0)}
              trend="Outstanding payments"
              bgGradient="bg-gradient-to-br from-red-400 via-red-500 to-pink-600 hover:from-red-500 hover:via-red-600 hover:to-pink-700"
              delay={1}
            />
            <ModernStatCard
              icon={CreditCard}
              label="Monthly Revenue"
              value={formatCurrency(stats?.monthlyRevenue || 0)}
              trend="Current month collection"
              bgGradient="bg-gradient-to-br from-blue-400 via-blue-500 to-cyan-600 hover:from-blue-500 hover:via-blue-600 hover:to-cyan-700"
              delay={2}
            />
            <ModernStatCard
              icon={TrendingUp}
              label="Collection Rate"
              value={`${stats?.collectionRate || 0}%`}
              trend="Payment completion rate"
              bgGradient="bg-gradient-to-br from-purple-400 via-purple-500 to-pink-600 hover:from-purple-500 hover:via-purple-600 hover:to-pink-700"
              delay={3}
            />
          </div>
        </div>

        {/* Operational Metrics */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-8 bg-gradient-to-b from-cyan-600 to-blue-600 rounded-full"></div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Operations</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <ModernStatCard
              icon={Home}
              label="Available Rooms"
              value={stats?.availableRooms || 0}
              trend="Ready for allocation"
              bgGradient="bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 hover:from-emerald-500 hover:via-teal-600 hover:to-cyan-700"
              delay={0}
            />
            <ModernStatCard
              icon={UserCheck}
              label="Active Staff"
              value={stats?.totalStaff || 0}
              trend={`${stats?.wardens?.length || 0} wardens, ${stats?.caretakers?.length || 0} caretakers`}
              bgGradient="bg-gradient-to-br from-cyan-400 via-blue-500 to-blue-600 hover:from-cyan-500 hover:via-blue-600 hover:to-blue-700"
              delay={1}
            />
            <ModernStatCard
              icon={AlertCircle}
              label="Pending Complaints"
              value={stats?.pendingMaintenance || 0}
              trend="Require attention"
              bgGradient="bg-gradient-to-br from-orange-400 via-red-500 to-rose-600 hover:from-orange-500 hover:via-red-600 hover:to-rose-700"
              delay={2}
            />
            <ModernStatCard
              icon={Users}
              label="Total Students"
              value={stats?.totalStudents || 0}
              trend="Currently enrolled"
              bgGradient="bg-gradient-to-br from-indigo-400 via-purple-500 to-fuchsia-600 hover:from-indigo-500 hover:via-purple-600 hover:to-fuchsia-700"
              delay={3}
            />
          </div>
        </div>

        {/* Transaction Monitoring */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <ActivityCard title="Recent Paid Transactions" icon={CheckCircle} color="green" delay={0}>
            <div className="space-y-4">
              {stats?.recentPayments?.length > 0 ? (
                stats.recentPayments.map((transaction, index) => (
                  <TransactionItem key={index} transaction={transaction} type="paid" index={index} />
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="inline-block p-4 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-2xl mb-4">
                    <CheckCircle className="text-green-600 dark:text-green-400 mx-auto animate-bounce" size={48} />
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 font-semibold">No recent payments</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Payments will appear here</p>
                </div>
              )}
            </div>
          </ActivityCard>

          <ActivityCard title="Unpaid Transactions" icon={XCircle} color="red" delay={1}>
            <div className="space-y-4">
              {stats?.unpaidTransactions?.length > 0 ? (
                stats.unpaidTransactions.map((transaction, index) => (
                  <TransactionItem key={index} transaction={transaction} type="unpaid" index={index} />
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="inline-block p-4 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-2xl mb-4">
                    <CheckCircle className="text-green-600 dark:text-green-400 mx-auto animate-bounce" size={48} />
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 font-semibold">All payments up to date</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Excellent payment collection</p>
                </div>
              )}
            </div>
          </ActivityCard>
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
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
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

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }

        .scale-102 {
          transform: scale(1.02);
        }
      `}</style>
    </div>
  )
}
