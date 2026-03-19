// path: src/features/allocations/AllocationsPage.jsx
import { PageHeader } from '../../components/common/PageHeader'
import { Card, CardContent } from '../../components/ui/Card'

export const AllocationsPage = () => {
  return (
    <div>
      <PageHeader
        title="Room Allocations"
        description="Manage student room allocations"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Allocations' },
        ]}
      />

      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-slate-600 dark:text-slate-400">
            TODO: Implement allocations feature with DataTable
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
