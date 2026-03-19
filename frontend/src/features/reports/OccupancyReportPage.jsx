// path: src/features/reports/OccupancyReportPage.jsx
import { PageHeader } from '../../components/common/PageHeader'
import { Card, CardContent } from '../../components/ui/Card'

export const OccupancyReportPage = () => {
  return (
    <div>
      <PageHeader
        title="Occupancy Report"
        description="Room occupancy analysis"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Reports' },
          { label: 'Occupancy' },
        ]}
      />

      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-slate-600 dark:text-slate-400">
            TODO: Implement occupancy report with charts
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
