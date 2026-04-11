// path: src/components/common/DataTable.jsx
import React, { useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
} from '@tanstack/react-table'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '../ui/Card'
import { Button } from '../ui/Button'
import Input from '../ui/Input'
import { EmptyState } from './EmptyState'

export const DataTable = ({
  columns,
  data,
  onRowClick,
  searchKey,
  searchPlaceholder = 'Search...',
  pageSize = 10,
}) => {
  const [globalFilter, setGlobalFilter] = useState('')
  const [sorting, setSorting] = useState([])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      globalFilter,
      sorting,
    },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    initialState: {
      pagination: {
        pageSize,
      },
    },
  })

  return (
    <div className="space-y-4">
      {searchKey && (
        <Input
          placeholder={searchPlaceholder}
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />
      )}

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr
                  key={headerGroup.id}
                  className="border-b border-gray-200 dark:border-cyan-500/10 bg-gray-50 dark:bg-dark-800/50"
                >
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-6 py-3 text-left font-semibold text-gray-700 dark:text-cyan-400"
                    >
                      {header.isPlaceholder ? null : (
                        <div
                          onClick={header.column.getToggleSortingHandler()}
                          className={
                            header.column.getCanSort()
                              ? 'cursor-pointer select-none hover:text-gray-900 dark:hover:text-cyan-300 transition-colors'
                              : ''
                          }
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                          {{
                            asc: ' ↑',
                            desc: ' ↓',
                          }[header.column.getIsSorted()] ?? null}
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-8">
                    <EmptyState
                      title="No data found"
                      description="Try adjusting your search criteria"
                    />
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => onRowClick?.(row.original)}
                    className={`border-b border-gray-200 dark:border-dark-700/30 transition-all duration-300 ${
                      onRowClick
                        ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-700/50 hover:border-cyan-500/20 dark:hover:border-cyan-500/20'
                        : ''
                    }`}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="px-6 py-4 text-gray-700 dark:text-dark-300"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <CardContent className="border-t border-gray-200 dark:border-cyan-500/10 p-4 flex items-center justify-between bg-gray-50 dark:bg-dark-800/50">
          <div className="text-sm text-gray-600 dark:text-dark-400">
            Page {table.getState().pagination.pageIndex + 1} of{' '}
            {table.getPageCount()}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft size={16} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
