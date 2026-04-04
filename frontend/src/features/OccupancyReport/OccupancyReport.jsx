// src/features/reports/OccupancyReportPage.jsx
import React from 'react';
import { useOccupancyReport } from './hook';

const OccupancyReportPage = () => {
  const { data: report, isLoading, isError } = useOccupancyReport();

  if (isLoading) return <div className="p-4">Loading...</div>;
  if (isError) return <div className="p-4 text-red-500">Error loading report</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Occupancy Report</h1>
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
              <th className="border px-4 py-2">Report Date</th>
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
                  {new Date(row.reportDate).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OccupancyReportPage;