// path: src/components/analytics/StudentAnalytics.jsx
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { AnalyticsPieChart } from './PieChart'
import axios from '../../lib/api/axios'
import { API_ENDPOINTS } from '../../lib/api/endpoints'
import { Users, GraduationCap, Calendar, MapPin } from 'lucide-react'

export const StudentAnalytics = () => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(API_ENDPOINTS.ANALYTICS.STUDENTS)
        setData(response.data)
      } catch (error) {
        console.error('Error fetching student analytics:', error)
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

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600 dark:text-dark-300">Total Students</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-dark-50">
                  {data.totalStudents}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <GraduationCap className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600 dark:text-dark-300">Departments</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-dark-50">
                  {data.departmentDistribution?.length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-sm text-gray-600 dark:text-dark-300">Year of Study</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-dark-50">
                  {data.yearOfStudyDistribution?.length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600 dark:text-dark-300">Status Types</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-dark-50">
                  {data.statusDistribution?.length || 0}
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
            <CardTitle>Department Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <AnalyticsPieChart
              data={data.departmentDistribution}
              title=""
              height={250}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <AnalyticsPieChart
              data={data.statusDistribution}
              title=""
              height={250}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Year of Study Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <AnalyticsPieChart
              data={data.yearOfStudyDistribution}
              title=""
              height={250}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Registration Year Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <AnalyticsPieChart
              data={data.registrationYearDistribution}
              title=""
              height={250}
            />
          </CardContent>
        </Card>
      </div>

      {/* Year of Study Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Year of Study Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <AnalyticsPieChart
            data={data.yearOfStudyDistribution}
            title=""
            height={300}
          />
        </CardContent>
      </Card>

      {/* Detailed Tables */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Departments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.departmentDistribution?.slice(0, 5).map((department, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm text-gray-900 dark:text-dark-50">{department.department}</span>
                  <span className="text-sm font-semibold text-gray-600 dark:text-dark-300">
                    {department.count} ({department.percentage}%)
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Registration Year Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.registrationYearDistribution?.slice(0, 5).map((year, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm text-gray-900 dark:text-dark-50">{year.registration_year}</span>
                  <span className="text-sm font-semibold text-gray-600 dark:text-dark-300">
                    {year.count} students
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}