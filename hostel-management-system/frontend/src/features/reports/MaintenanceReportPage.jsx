// path: src/features/reports/MaintenanceReportPage.jsx
import { useMaintenanceReport } from './hooks'
import { PageHeader } from '../../components/common/PageHeader'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { StatCard } from '../../components/common/StatCard'
import { AlertCircle, CheckCircle, Wrench } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { Skeleton } from '../../components/ui/Skeleton'

export const MaintenanceReportPage = () => {
  const { data: report, isLoading } = useMaintenanceReport()

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED':
        return 'success'
      case 'IN_PROGRESS':
        return 'primary'
      case 'PENDING':
        return 'warning'
      default:
        return 'default'
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'HIGH':
        return 'danger'
      case 'MEDIUM':
        return 'warning'
      case 'LOW':
        return 'success'
      default:
        return 'default'
    }
  }

  return (
    <div>
      <PageHeader
        title="Maintenance Report"
        description="Maintenance and repairs analysis"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Reports' },
          { label: 'Maintenance' },
        ]}
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-8 w-full mb-2" />
                <Skeleton className="h-6 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              icon={Wrench}
              label="Total Requests"
              value={report?.total || 0}
            />
            <StatCard
              icon={AlertCircle}
              label="Pending"
              value={report?.pending || 0}
              trend="Awaiting action"
            />
            <StatCard
              icon={Wrench}
              label="In Progress"
              value={report?.inProgress || 0}
              trend="Being worked on"
            />
            <StatCard
              icon={CheckCircle}
              label="Completed"
              value={report?.completed || 0}
              trend="All finished"
              trendUp
            />
          </div>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Recent Requests</h3>
            </CardHeader>
            <CardContent>
              {report?.requests && report.requests.length > 0 ? (
                <div className="space-y-4">
                  {report.requests.map((request) => (
                    <div
                      key={request.id}
                      className="flex items-start justify-between pb-4 border-b last:border-0"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-slate-900 dark:text-slate-50">
                            Room {request.room}
                          </p>
                          <Badge variant={getPriorityColor(request.priority)}>
                            {request.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {request.description}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                          Reported: {request.reportedDate}
                        </p>
                      </div>
                      <div>
                        <Badge variant={getStatusColor(request.status)}>
                          {request.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-slate-600 dark:text-slate-400 py-8">
                  No maintenance requests
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
