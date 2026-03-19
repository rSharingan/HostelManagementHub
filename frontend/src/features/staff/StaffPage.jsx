// path: src/features/staff/StaffPage.jsx
import { PageHeader } from '../../components/common/PageHeader'
import { Card, CardContent } from '../../components/ui/Card'

export const StaffPage = () => {
  return (
    <div>
      <PageHeader
        title="Staff"
        description="Manage hostel staff"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Staff' },
        ]}
      />

      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-slate-600 dark:text-slate-400">
            TODO: Implement staff management with DataTable
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
