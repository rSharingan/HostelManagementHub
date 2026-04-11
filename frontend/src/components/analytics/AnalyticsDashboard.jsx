// path: src/components/analytics/AnalyticsDashboard.jsx
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { Button } from '../ui/Button'
import { OccupancyAnalytics } from './OccupancyAnalytics'
import { FinancialAnalytics } from './FinancialAnalytics'
import { StudentAnalytics } from './StudentAnalytics'
import { MaintenanceAnalytics } from './MaintenanceAnalytics'
import { BarChart3, DollarSign, Users, Wrench } from 'lucide-react'

const analyticsTabs = [
  {
    id: 'occupancy',
    label: 'Occupancy Analytics',
    icon: BarChart3,
    component: OccupancyAnalytics,
    description: 'Room utilization, status distribution, and floor-wise occupancy'
  },
  {
    id: 'financial',
    label: 'Financial Reports',
    icon: DollarSign,
    component: FinancialAnalytics,
    description: 'Revenue analysis, payment trends, and outstanding dues'
  },
  {
    id: 'students',
    label: 'Student Demographics',
    icon: Users,
    component: StudentAnalytics,
    description: 'Age distribution, course breakdown, and nationality stats'
  },
  {
    id: 'maintenance',
    label: 'Maintenance Analytics',
    icon: Wrench,
    component: MaintenanceAnalytics,
    description: 'Issue types, resolution times, and cost analysis'
  }
]

export const AnalyticsDashboard = () => {
  const [activeTab, setActiveTab] = useState('occupancy')

  const ActiveComponent = analyticsTabs.find(tab => tab.id === activeTab)?.component

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-50">
            Analytics Dashboard
          </h1>
          <p className="text-gray-600 dark:text-dark-300 mt-1">
            Comprehensive insights into hostel operations and performance
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {analyticsTabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id

              return (
                <Button
                  key={tab.id}
                  variant={isActive ? 'default' : 'outline'}
                  className={`h-auto p-4 flex flex-col items-center space-y-2 ${
                    isActive
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'hover:bg-gray-50 dark:hover:bg-dark-800'
                  }`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <Icon className={`w-6 h-6 ${isActive ? 'text-white' : 'text-gray-600 dark:text-dark-300'}`} />
                  <div className="text-center">
                    <div className={`text-sm font-medium ${isActive ? 'text-white' : 'text-gray-900 dark:text-dark-50'}`}>
                      {tab.label}
                    </div>
                    <div className={`text-xs mt-1 ${isActive ? 'text-blue-100' : 'text-gray-500 dark:text-dark-400'}`}>
                      {tab.description}
                    </div>
                  </div>
                </Button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Active Analytics Component */}
      <div className="mt-6">
        {ActiveComponent && <ActiveComponent />}
      </div>
    </div>
  )
}