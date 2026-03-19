// path: src/features/reports/MaintenanceReportPage.jsx
import { PageHeader } from '../../components/common/PageHeader'
import { Card, CardContent } from '../../components/ui/Card'

export const MaintenanceReportPage = () => {
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

      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-slate-600 dark:text-slate-400">
            TODO: Implement maintenance report with charts
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
