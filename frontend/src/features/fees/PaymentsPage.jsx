// path: src/features/fees/PaymentsPage.jsx
import { PageHeader } from '../../components/common/PageHeader'
import { Card, CardContent } from '../../components/ui/Card'

export const PaymentsPage = () => {
  return (
    <div>
      <PageHeader
        title="Payments"
        description="View and manage fee payments"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Fees' },
          { label: 'Payments' },
        ]}
      />

      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-slate-600 dark:text-slate-400">
            TODO: Implement payments feature with DataTable
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
