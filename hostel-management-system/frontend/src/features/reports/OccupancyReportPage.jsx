// path: src/features/reports/OccupancyReportPage.jsx
import { useOccupancyReport } from './hooks'
import { PageHeader } from '../../components/common/PageHeader'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { StatCard } from '../../components/common/StatCard'
import { Home } from 'lucide-react'
import { Skeleton } from '../../components/ui/Skeleton'

export const OccupancyReportPage = () => {
  const { data: report, isLoading } = useOccupancyReport()

  return (
    <div>
      <PageHeader
        title="Occupancy Report"
        description="Room occupancy analysis and statistics"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Reports' },
          { label: 'Occupancy' },
        ]}
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <StatCard
              icon={Home}
              label="Total Rooms"
              value={report?.totalRooms || 0}
            />
            <StatCard
              icon={Home}
              label="Occupied Rooms"
              value={report?.occupiedRooms || 0}
              trend={`${report?.occupancyRate}%`}
              trendUp
            />
            <StatCard
              icon={Home}
              label="Available Rooms"
              value={report?.availableRooms || 0}
              trendUp
            />
          </div>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Occupancy by Block</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {report?.byBlock &&
                  Object.entries(report.byBlock).map(([block, data]) => (
                    <div key={block} className="flex items-center justify-between pb-4 border-b last:border-0">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-slate-50">
                          Block {block}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {data.occupied} of {data.total} occupied
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                          {((data.occupied / data.total) * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
