// path: src/features/reports/DuesReportPage.jsx
import { PageHeader } from '../../components/common/PageHeader'
import { Card, CardContent } from '../../components/ui/Card'
import { useDuesReport } from './hooks'
import { Badge } from '../../components/ui/Badge'
import { formatCurrency } from '../../lib/utils'

export const DuesReportPage = () => {
  const { data: report = [], isLoading, isError } = useDuesReport()

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
        <CardContent className="p-8">
          {isLoading && <p className="text-center">Loading...</p>}
          {isError && <p className="text-center text-red-500">Error loading dues report</p>}
          {!isLoading && !isError && (
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-300">
                <thead className="bg-gray-100">
                  <tr className="text-center">
                    <th className="border px-4 py-2">Student</th>
                    <th className="border px-4 py-2">Registration</th>
                    <th className="border px-4 py-2">Room</th>
                    <th className="border px-4 py-2">Monthly Rent</th>
                    <th className="border px-4 py-2">Days Used</th>
                    <th className="border px-4 py-2">Due Cycles</th>
                    <th className="border px-4 py-2">Paid Cycles</th>
                    <th className="border px-4 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {report.map((row) => (
                    <tr key={`${row.studentId}-${row.roomNumber}`} className="text-center">
                      <td className="border px-4 py-2">{row.studentName}</td>
                      <td className="border px-4 py-2">{row.registrationNumber}</td>
                      <td className="border px-4 py-2">{row.roomNumber}</td>
                      <td className="border px-4 py-2">{formatCurrency(row.monthlyRent || 0)}</td>
                      <td className="border px-4 py-2">{row.daysUsed}</td>
                      <td className="border px-4 py-2">{row.dueCycles}</td>
                      <td className="border px-4 py-2">{row.paidCycles}</td>
                      <td className="border px-4 py-2">
                        <Badge variant={row.status === 'DUE' ? 'warning' : 'success'}>{row.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
