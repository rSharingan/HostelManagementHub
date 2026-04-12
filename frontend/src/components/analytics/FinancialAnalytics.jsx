// path: src/components/analytics/FinancialAnalytics.jsx
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { AnalyticsPieChart } from './PieChart'
import { PremiumUpgrade } from '../common/PremiumUpgrade'
import axios from '../../lib/api/axios'
import { API_ENDPOINTS } from '../../lib/api/endpoints'
import { usePremiumStatus } from '../../features/auth/hooks'
import { DollarSign, CreditCard, TrendingUp, AlertTriangle } from 'lucide-react'

export const FinancialAnalytics = () => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const { data: premiumData, isLoading: premiumLoading } = usePremiumStatus()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(API_ENDPOINTS.ANALYTICS.FINANCIAL)
        setData(response.data)
      } catch (error) {
        console.error('Error fetching financial analytics:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (premiumLoading) {
    return <div>Loading...</div>
  }

  if (!premiumData?.isPremium) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <PremiumUpgrade
          type="premium"
          amount={9.99}
          title="Unlock Premium Analytics"
          description="Get advanced financial insights and detailed reports"
          features={[
            "Advanced financial charts and graphs",
            "Detailed revenue breakdowns",
            "Outstanding dues analysis",
            "Monthly trend reports",
            "Export capabilities",
          ]}
        />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-48 bg-gray-200 dark:bg-dark-700 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!data) return null

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount || 0)
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600 dark:text-dark-300">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-dark-50">
                  {formatCurrency(data.totalRevenue)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-sm text-gray-600 dark:text-dark-300">Outstanding Dues</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-dark-50">
                  {formatCurrency(data.totalOutstanding)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CreditCard className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600 dark:text-dark-300">Payment Methods</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-dark-50">
                  {data.paymentMethods?.length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600 dark:text-dark-300">Avg Monthly</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-dark-50">
                  {formatCurrency(data.totalRevenue / 12)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
          </CardHeader>
          <CardContent>
            <AnalyticsPieChart
              data={data.paymentMethods}
              title=""
              height={250}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue by Room Type</CardTitle>
          </CardHeader>
          <CardContent>
            <AnalyticsPieChart
              data={data.revenueByRoomType}
              title=""
              dataKey="total_revenue"
              height={250}
            />
          </CardContent>
        </Card>
      </div>

      {/* Outstanding Dues Table */}
      <Card>
        <CardHeader>
          <CardTitle>Top Outstanding Dues</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-dark-700">
                  <th className="text-left py-2 px-4 font-medium text-gray-900 dark:text-dark-50">Student</th>
                  <th className="text-left py-2 px-4 font-medium text-gray-900 dark:text-dark-50">Room</th>
                  <th className="text-left py-2 px-4 font-medium text-gray-900 dark:text-dark-50">Pending Invoices</th>
                  <th className="text-left py-2 px-4 font-medium text-gray-900 dark:text-dark-50">Total Dues</th>
                </tr>
              </thead>
              <tbody>
                {data.outstandingDues?.slice(0, 10).map((student, index) => (
                  <tr key={index} className="border-b border-gray-100 dark:border-dark-800">
                    <td className="py-2 px-4 text-gray-900 dark:text-dark-50">{student.name}</td>
                    <td className="py-2 px-4 text-gray-900 dark:text-dark-50">{student.roomId || 'N/A'}</td>
                    <td className="py-2 px-4 text-gray-900 dark:text-dark-50">{student.pending_invoices}</td>
                    <td className="py-2 px-4 text-gray-900 dark:text-dark-50 font-semibold">
                      {formatCurrency(student.total_dues)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Revenue Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Revenue Trend (Last 12 Months)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-dark-700">
                  <th className="text-left py-2 px-4 font-medium text-gray-900 dark:text-dark-50">Month/Year</th>
                  <th className="text-left py-2 px-4 font-medium text-gray-900 dark:text-dark-50">Payments</th>
                  <th className="text-left py-2 px-4 font-medium text-gray-900 dark:text-dark-50">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {data.monthlyRevenue?.map((month, index) => (
                  <tr key={index} className="border-b border-gray-100 dark:border-dark-800">
                    <td className="py-2 px-4 text-gray-900 dark:text-dark-50">
                      {month.month}/{month.year}
                    </td>
                    <td className="py-2 px-4 text-gray-900 dark:text-dark-50">{month.payment_count}</td>
                    <td className="py-2 px-4 text-gray-900 dark:text-dark-50 font-semibold">
                      {formatCurrency(month.total_revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}