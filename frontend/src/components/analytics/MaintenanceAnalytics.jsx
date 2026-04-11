// path: src/components/analytics/MaintenanceAnalytics.jsx
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { AnalyticsPieChart } from './PieChart'
import axios from '../../lib/api/axios'
import { API_ENDPOINTS } from '../../lib/api/endpoints'
import { Wrench, Clock, DollarSign, TrendingUp } from 'lucide-react'

export const MaintenanceAnalytics = () => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(API_ENDPOINTS.ANALYTICS.MAINTENANCE)
        setData(response.data)
      } catch (error) {
        console.error('Error fetching maintenance analytics:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

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

  const formatHours = (hours) => {
    if (hours < 24) return `${Math.round(hours)}h`
    const days = Math.floor(hours / 24)
    const remainingHours = Math.round(hours % 24)
    return `${days}d ${remainingHours}h`
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Wrench className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600 dark:text-dark-300">Total Requests</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-dark-50">
                  {data.totalRequests}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-sm text-gray-600 dark:text-dark-300">Issue Types</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-dark-50">
                  {data.issueTypeDistribution?.length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600 dark:text-dark-300">Total Cost</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-dark-50">
                  {formatCurrency(data.totalCost)}
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
                <p className="text-sm text-gray-600 dark:text-dark-300">Avg Cost</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-dark-50">
                  {formatCurrency(data.costAnalysis?.length > 0
                    ? data.costAnalysis.reduce((sum, item) => sum + item.avg_cost, 0) / data.costAnalysis.length
                    : 0
                  )}
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
            <CardTitle>Issue Type Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <AnalyticsPieChart
              data={data.issueTypeDistribution}
              title=""
              height={250}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Request Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <AnalyticsPieChart
              data={data.statusDistribution}
              title=""
              height={250}
            />
          </CardContent>
        </Card>
      </div>

      {/* Resolution Time Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Average Resolution Time by Issue Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-dark-700">
                  <th className="text-left py-2 px-4 font-medium text-gray-900 dark:text-dark-50">Issue Type</th>
                  <th className="text-left py-2 px-4 font-medium text-gray-900 dark:text-dark-50">Avg Resolution Time</th>
                  <th className="text-left py-2 px-4 font-medium text-gray-900 dark:text-dark-50">Total Issues</th>
                </tr>
              </thead>
              <tbody>
                {data.resolutionTimeByType?.map((item, index) => (
                  <tr key={index} className="border-b border-gray-100 dark:border-dark-800">
                    <td className="py-2 px-4 text-gray-900 dark:text-dark-50">{item.issueType}</td>
                    <td className="py-2 px-4 text-gray-900 dark:text-dark-50">
                      {formatHours(item.avg_resolution_hours)}
                    </td>
                    <td className="py-2 px-4 text-gray-900 dark:text-dark-50">{item.total_issues}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Cost Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Cost Analysis by Issue Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-dark-700">
                  <th className="text-left py-2 px-4 font-medium text-gray-900 dark:text-dark-50">Issue Type</th>
                  <th className="text-left py-2 px-4 font-medium text-gray-900 dark:text-dark-50">Total Issues</th>
                  <th className="text-left py-2 px-4 font-medium text-gray-900 dark:text-dark-50">Total Cost</th>
                  <th className="text-left py-2 px-4 font-medium text-gray-900 dark:text-dark-50">Average Cost</th>
                </tr>
              </thead>
              <tbody>
                {data.costAnalysis?.map((item, index) => (
                  <tr key={index} className="border-b border-gray-100 dark:border-dark-800">
                    <td className="py-2 px-4 text-gray-900 dark:text-dark-50">{item.issueType}</td>
                    <td className="py-2 px-4 text-gray-900 dark:text-dark-50">{item.issue_count}</td>
                    <td className="py-2 px-4 text-gray-900 dark:text-dark-50 font-semibold">
                      {formatCurrency(item.total_cost)}
                    </td>
                    <td className="py-2 px-4 text-gray-900 dark:text-dark-50">
                      {formatCurrency(item.avg_cost)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Requests Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Maintenance Requests (Last 12 Months)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-dark-700">
                  <th className="text-left py-2 px-4 font-medium text-gray-900 dark:text-dark-50">Month/Year</th>
                  <th className="text-left py-2 px-4 font-medium text-gray-900 dark:text-dark-50">Requests</th>
                </tr>
              </thead>
              <tbody>
                {data.monthlyRequests?.map((month, index) => (
                  <tr key={index} className="border-b border-gray-100 dark:border-dark-800">
                    <td className="py-2 px-4 text-gray-900 dark:text-dark-50">
                      {month.month}/{month.year}
                    </td>
                    <td className="py-2 px-4 text-gray-900 dark:text-dark-50">{month.request_count}</td>
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