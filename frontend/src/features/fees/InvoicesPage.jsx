// path: src/features/fees/InvoicesPage.jsx
import { PageHeader } from '../../components/common/PageHeader'
import { Card, CardContent } from '../../components/ui/Card'

export const InvoicesPage = () => {
  return (
    <div>
      <PageHeader
        title="Invoices"
        description="View and manage fee invoices"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Fees' },
          { label: 'Invoices' },
        ]}
      />

      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-slate-600 dark:text-slate-400">
            TODO: Implement invoices feature with DataTable
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
