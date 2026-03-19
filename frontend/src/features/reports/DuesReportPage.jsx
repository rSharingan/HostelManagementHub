// path: src/features/reports/DuesReportPage.jsx
import { PageHeader } from '../../components/common/PageHeader'
import { Card, CardContent } from '../../components/ui/Card'

export const DuesReportPage = () => {
  return (
    <div>
      <PageHeader
        title="Dues Report"
        description="Outstanding fees analysis"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Reports' },
          { label: 'Dues' },
        ]}
      />

      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-slate-600 dark:text-slate-400">
            TODO: Implement dues report with charts
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
