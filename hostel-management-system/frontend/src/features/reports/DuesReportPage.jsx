import { useDuesReport } from './hooks'
import { PageHeader } from '../../components/common/PageHeader'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { StatCard } from '../../components/common/StatCard'
import { DollarSign } from 'lucide-react'
import { formatCurrency } from '../../lib/utils'
import { Skeleton } from '../../components/ui/Skeleton'

export const DuesReportPage = () => {
  const { data: report, isLoading } = useDuesReport()

  return (
    <div>
      <PageHeader
        title="Dues Report"
        description="Outstanding fees and payment tracking"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Reports' },
          { label: 'Dues' },
        ]}
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <StatCard
              icon={DollarSign}
              label="Total Outstanding Dues"
              value={formatCurrency(report?.totalDues || 0)}
              trend={`${report?.pendingCount || 0} students`}
            />
            <StatCard
              icon={DollarSign}
              label="Pending Invoices"
              value={report?.pendingCount || 0}
            />
          </div>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Outstanding by Student</h3>
            </CardHeader>
            <CardContent>
              {report?.byStudent && report.byStudent.length > 0 ? (
                <div className="space-y-4">
                  {report.byStudent.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between pb-4 border-b last:border-0"
                    >
                      <div>
                        <p className="font-medium text-slate-900 dark:text-slate-50">
                          {item.studentName}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {item.studentEmail}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                          Due: {item.dueDate}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-red-600 dark:text-red-400">
                          {formatCurrency(item.amount)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-slate-600 dark:text-slate-400 py-8">
                  No outstanding dues
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
