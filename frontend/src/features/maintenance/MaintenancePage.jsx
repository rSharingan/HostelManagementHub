// path: src/features/maintenance/MaintenancePage.jsx
import { PageHeader } from '../../components/common/PageHeader'
import { Card, CardContent } from '../../components/ui/Card'

export const MaintenancePage = () => {
  return (
    <div>
      <PageHeader
        title="Maintenance Requests"
        description="Manage maintenance and repairs"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Maintenance' },
        ]}
      />

      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-slate-600 dark:text-slate-400">
            TODO: Implement maintenance request tracking
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
