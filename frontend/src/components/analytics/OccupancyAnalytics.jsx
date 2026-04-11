// path: src/components/analytics/OccupancyAnalytics.jsx
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { AnalyticsPieChart } from './PieChart'
import axios from '../../lib/api/axios'
import { API_ENDPOINTS } from '../../lib/api/endpoints'
import { BarChart3, Users, Home, TrendingUp } from 'lucide-react'

export const OccupancyAnalytics = () => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(API_ENDPOINTS.ANALYTICS.OCCUPANCY)
        setData(response.data)
      } catch (error) {
        console.error('Error fetching occupancy analytics:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
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

  const occupancyRate = data.totalRooms > 0
    ? Math.round((data.occupiedRooms / data.totalRooms) * 100)
    : 0

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Home className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600 dark:text-dark-300">Total Rooms</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-dark-50">
                  {data.totalRooms}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600 dark:text-dark-300">Occupied</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-dark-50">
                  {data.occupiedRooms}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-sm text-gray-600 dark:text-dark-300">Occupancy Rate</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-dark-50">
                  {occupancyRate}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600 dark:text-dark-300">Available</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-dark-50">
                  {data.totalRooms - data.occupiedRooms}
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
            <CardTitle>Room Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <AnalyticsPieChart
              data={data.occupancyByStatus}
              title=""
              height={250}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Room Type Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <AnalyticsPieChart
              data={data.roomTypeDistribution}
              title=""
              height={250}
            />
          </CardContent>
        </Card>
      </div>

      {/* Floor-wise Occupancy Table */}
      <Card>
        <CardHeader>
          <CardTitle>Floor-wise Occupancy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-dark-700">
                  <th className="text-left py-2 px-4 font-medium text-gray-900 dark:text-dark-50">Floor</th>
                  <th className="text-left py-2 px-4 font-medium text-gray-900 dark:text-dark-50">Total Rooms</th>
                  <th className="text-left py-2 px-4 font-medium text-gray-900 dark:text-dark-50">Occupied</th>
                  <th className="text-left py-2 px-4 font-medium text-gray-900 dark:text-dark-50">Occupancy Rate</th>
                </tr>
              </thead>
              <tbody>
                {data.floorOccupancy?.map((floor, index) => (
                  <tr key={index} className="border-b border-gray-100 dark:border-dark-800">
                    <td className="py-2 px-4 text-gray-900 dark:text-dark-50">{floor.floor}</td>
                    <td className="py-2 px-4 text-gray-900 dark:text-dark-50">{floor.total_rooms}</td>
                    <td className="py-2 px-4 text-gray-900 dark:text-dark-50">{floor.occupied_rooms}</td>
                    <td className="py-2 px-4 text-gray-900 dark:text-dark-50">{floor.occupancy_rate}%</td>
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