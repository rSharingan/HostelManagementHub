// path: src/features/reports/OccupancyReportPage.jsx
import { PageHeader } from '../../components/common/PageHeader';
import { Card, CardContent } from '../../components/ui/Card';
import { useOccupancyReport } from './hooks';

/**
 * Occupancy report page
 */
export const OccupancyReportPage = () => {
  const { data: report = [], isLoading, isError } = useOccupancyReport();

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
        <CardContent className="p-8">
          {isLoading && <p className="text-center">Loading...</p>}
          {isError && <p className="text-center text-red-500">Error loading report</p>}
          {!isLoading && !isError && (
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-300">
                <thead className="bg-gray-100">
                  <tr className="text-center">
                    <th className="border px-4 py-2">ID</th>
                    <th className="border px-4 py-2">Room ID</th>
                    <th className="border px-4 py-2">Room Number</th>
                    <th className="border px-4 py-2">Capacity</th>
                    <th className="border px-4 py-2">Occupied</th>
                    <th className="border px-4 py-2">Available</th>
                    <th className="border px-4 py-2">Last Allocation Time</th>
                  </tr>
                </thead>
                <tbody>
                  {report.map((row) => (
                    <tr key={row.id} className="text-center">
                      <td className="border px-4 py-2">{row.id}</td>
                      <td className="border px-4 py-2">{row.roomId}</td>
                      <td className="border px-4 py-2">{row.roomNumber}</td>
                      <td className="border px-4 py-2">{row.capacity}</td>
                      <td className="border px-4 py-2">{row.occupied}</td>
                      <td className="border px-4 py-2">{row.available}</td>
                      <td className="border px-4 py-2">
                        {row.lastAllocationAt ? new Date(row.lastAllocationAt).toLocaleString() : 'N/A'}
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
  );
};