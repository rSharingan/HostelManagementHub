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
                <p className="text-sm text-gray-600 dark:text-dark-300">Courses</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-dark-50">
                  {data.courseDistribution?.length || 0}
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
                <p className="text-sm text-gray-600 dark:text-dark-300">Age Groups</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-dark-50">
                  {data.ageDistribution?.length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MapPin className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600 dark:text-dark-300">Nationalities</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-dark-50">
                  {data.nationalityDistribution?.length || 0}
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
            <CardTitle>Course Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <AnalyticsPieChart
              data={data.courseDistribution}
              title=""
              height={250}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Age Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <AnalyticsPieChart
              data={data.ageDistribution}
              title=""
              height={250}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gender Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <AnalyticsPieChart
              data={data.genderDistribution}
              title=""
              height={250}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Nationality Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <AnalyticsPieChart
              data={data.nationalityDistribution}
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
            <CardTitle>Top Courses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.courseDistribution?.slice(0, 5).map((course, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm text-gray-900 dark:text-dark-50">{course.course}</span>
                  <span className="text-sm font-semibold text-gray-600 dark:text-dark-300">
                    {course.count} ({course.percentage}%)
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Nationality Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.nationalityDistribution?.slice(0, 5).map((nationality, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm text-gray-900 dark:text-dark-50">{nationality.nationality}</span>
                  <span className="text-sm font-semibold text-gray-600 dark:text-dark-300">
                    {nationality.count} ({nationality.percentage}%)
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