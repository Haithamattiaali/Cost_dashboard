/**
 * DataTable Module
 * Simplified, reliable data table implementation with core features only
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  ColumnDef,
  flexRender,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
} from '@tanstack/react-table';
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Eye,
  EyeOff,
  Search,
  X,
} from 'lucide-react';

// Column configuration type
export interface DataTableColumn {
  id: string;
  header: string;
  accessorKey: string;
  dataType?: 'text' | 'number' | 'currency' | 'enum';
  width?: number;
  formatter?: (value: any) => string;
  enableSorting?: boolean;
  enableFiltering?: boolean;
}

// Props interface
interface DataTableProps {
  data: any[];
  columns: DataTableColumn[];
  pageSize?: number;
  className?: string;
  enablePagination?: boolean;
  enableColumnVisibility?: boolean;
}

// Format currency helper
const formatCurrency = (value: number): string => {
  if (value === null || value === undefined) return '-';
  return new Intl.NumberFormat('en-SA', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

// Main DataTable component
export const DataTable: React.FC<DataTableProps> = ({
  data,
  columns,
  pageSize = 50,
  className = '',
  enablePagination = true,
  enableColumnVisibility = true,
}) => {
  // State management
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState('');

  // Transform columns for TanStack Table
  const tableColumns = useMemo<ColumnDef<any>[]>(
    () => [
      // Selection column
      {
        id: 'select',
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={table.getIsAllRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
            className="w-4 h-4"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            className="w-4 h-4"
          />
        ),
        size: 40,
      },
      // Data columns
      ...columns.map(col => ({
        id: col.id,
        accessorKey: col.accessorKey,
        header: ({ column }: any) => (
          <div className="flex items-center justify-between">
            <span>{col.header}</span>
            {col.enableSorting !== false && (
              <button
                onClick={() => column.toggleSorting()}
                className="ml-2 p-1 hover:bg-gray-100 rounded"
              >
                {column.getIsSorted() === 'asc' ? (
                  <ChevronUp className="h-4 w-4" />
                ) : column.getIsSorted() === 'desc' ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronsUpDown className="h-4 w-4 text-gray-400" />
                )}
              </button>
            )}
          </div>
        ),
        cell: ({ getValue }: any) => {
          const value = getValue();
          if (col.formatter) {
            return col.formatter(value);
          }
          if (col.dataType === 'currency') {
            return formatCurrency(Number(value) || 0);
          }
          return value ?? '-';
        },
        size: col.width || 150,
        enableSorting: col.enableSorting !== false,
        enableColumnFilter: col.enableFiltering !== false,
      })),
    ],
    [columns]
  );

  // Create table instance
  const table = useReactTable({
    data: data || [],
    columns: tableColumns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: enablePagination ? getPaginationRowModel() : undefined,
    initialState: {
      pagination: {
        pageSize,
      },
    },
  });

  // Clear filters
  const clearFilters = useCallback(() => {
    setColumnFilters([]);
    setGlobalFilter('');
  }, []);

  // Column visibility menu
  const ColumnVisibilityMenu = () => (
    <div className="relative inline-block">
      <details className="relative">
        <summary className="px-3 py-2 text-sm bg-white border rounded cursor-pointer hover:bg-gray-50 flex items-center gap-2">
          <Eye className="h-4 w-4" />
          Columns
        </summary>
        <div className="absolute right-0 z-10 mt-2 w-48 bg-white border rounded shadow-lg p-2 max-h-64 overflow-y-auto">
          {columns.map(col => (
            <label
              key={col.id}
              className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
            >
              <input
                type="checkbox"
                checked={columnVisibility[col.id] !== false}
                onChange={e =>
                  setColumnVisibility(prev => ({
                    ...prev,
                    [col.id]: e.target.checked,
                  }))
                }
                className="w-4 h-4"
              />
              <span className="text-sm">{col.header}</span>
            </label>
          ))}
        </div>
      </details>
    </div>
  );

  return (
    <div className={`data-table-container ${className}`}>
      {/* Toolbar */}
      <div className="mb-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          {/* Global filter */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={globalFilter ?? ''}
              onChange={e => setGlobalFilter(e.target.value)}
              placeholder="Search all columns..."
              className="pl-10 pr-8 py-2 border rounded w-64"
            />
            {globalFilter && (
              <button
                onClick={() => setGlobalFilter('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
              >
                <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>

          {/* Clear filters button */}
          {(columnFilters.length > 0 || globalFilter) && (
            <button
              onClick={clearFilters}
              className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded"
            >
              Clear Filters
            </button>
          )}

          {/* Selection info */}
          {Object.keys(rowSelection).length > 0 && (
            <div className="text-sm text-gray-600">
              {Object.keys(rowSelection).length} row(s) selected
            </div>
          )}
        </div>

        {/* Column visibility */}
        {enableColumnVisibility && <ColumnVisibilityMenu />}
      </div>

      {/* Table */}
      <div className="overflow-x-auto border rounded">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-sm font-semibold text-gray-900"
                    style={{
                      width: header.column.getSize(),
                      minWidth: header.column.getSize(),
                    }}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}

                    {/* Column filter */}
                    {header.column.getCanFilter() && header.id !== 'select' && (
                      <div className="mt-2">
                        <input
                          type="text"
                          value={(header.column.getFilterValue() ?? '') as string}
                          onChange={e => header.column.setFilterValue(e.target.value)}
                          placeholder={`Filter...`}
                          className="w-full px-2 py-1 text-xs border rounded"
                        />
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={tableColumns.length}
                  className="px-4 py-8 text-center text-gray-500"
                >
                  No data available
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map(row => (
                <tr
                  key={row.id}
                  className={`hover:bg-gray-50 ${
                    row.getIsSelected() ? 'bg-blue-50' : ''
                  }`}
                >
                  {row.getVisibleCells().map(cell => (
                    <td
                      key={cell.id}
                      className="px-4 py-2 text-sm text-gray-900"
                      style={{
                        width: cell.column.getSize(),
                        minWidth: cell.column.getSize(),
                      }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {enablePagination && (
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {table.getState().pagination.pageIndex * pageSize + 1} to{' '}
            {Math.min(
              (table.getState().pagination.pageIndex + 1) * pageSize,
              data?.length || 0
            )}{' '}
            of {data?.length || 0} results
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              className="px-3 py-1 text-sm border rounded disabled:opacity-50"
            >
              First
            </button>
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="px-3 py-1 text-sm border rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm">
              Page {table.getState().pagination.pageIndex + 1} of{' '}
              {table.getPageCount()}
            </span>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="px-3 py-1 text-sm border rounded disabled:opacity-50"
            >
              Next
            </button>
            <button
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
              className="px-3 py-1 text-sm border rounded disabled:opacity-50"
            >
              Last
            </button>
          </div>
        </div>
      )}

      {/* Data summary */}
      <div className="mt-2 text-xs text-gray-500">
        Total rows: {data?.length || 0} | Filtered rows:{' '}
        {table.getFilteredRowModel().rows.length} | Selected rows:{' '}
        {Object.keys(rowSelection).length}
      </div>
    </div>
  );
};

// Export default for convenience
export default DataTable;