/**
 * DataTable Module
 * Enterprise-grade data table with Excel-like filtering, export, and aggregation
 */

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
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
  FilterFn,
} from '@tanstack/react-table';
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Eye,
  EyeOff,
  Search,
  X,
  Filter,
  Check,
  Download,
  FileSpreadsheet,
  FileText,
} from 'lucide-react';
import { SelectionReportCard } from './SelectionReportCard';
import * as XLSX from 'xlsx';

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
  enableAggregation?: boolean;
}

// Props interface
interface DataTableProps {
  data: any[];
  columns: DataTableColumn[];
  pageSize?: number;
  className?: string;
  enablePagination?: boolean;
  enableColumnVisibility?: boolean;
  enableExport?: boolean;
  enableAggregation?: boolean;
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

// Custom filter function for multi-select
const multiSelectFilter: FilterFn<any> = (row, columnId, filterValue) => {
  if (!filterValue || filterValue.length === 0) return true;
  const rowValue = row.getValue(columnId);
  return filterValue.includes(rowValue);
};

// Excel-like Filter Dropdown Component
interface FilterDropdownProps {
  column: any;
  data: any[];
  onClose: () => void;
}

const FilterDropdown: React.FC<FilterDropdownProps> = ({ column, data, onClose }) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    // Add slight delay to prevent immediate closure
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const uniqueValues = useMemo(() => {
    const values = new Set<any>();
    data.forEach(row => {
      const value = row[column.id];
      if (value !== undefined && value !== null) {
        values.add(value);
      }
    });
    return Array.from(values).sort();
  }, [data, column.id]);

  const [selectedValues, setSelectedValues] = useState<Set<any>>(
    () => new Set(column.getFilterValue() || [])
  );

  const handleSelectAll = () => {
    if (selectedValues.size === uniqueValues.length) {
      setSelectedValues(new Set());
    } else {
      setSelectedValues(new Set(uniqueValues));
    }
  };

  const handleToggleValue = (value: any) => {
    const newSet = new Set(selectedValues);
    if (newSet.has(value)) {
      newSet.delete(value);
    } else {
      newSet.add(value);
    }
    setSelectedValues(newSet);
  };

  const handleApply = () => {
    column.setFilterValue(selectedValues.size > 0 ? Array.from(selectedValues) : undefined);
    onClose();
  };

  const handleClear = () => {
    setSelectedValues(new Set());
    column.setFilterValue(undefined);
    onClose();
  };

  const dropdownContent = (
    <div
      ref={dropdownRef}
      className="fixed bg-white border-2 border-gray-300 rounded-lg shadow-2xl p-3 min-w-[240px] max-h-[450px] overflow-hidden flex flex-col"
      style={{
        zIndex: 99999,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: 'white'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header controls */}
      <div className="flex items-center justify-between pb-2 border-b mb-2">
        <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
          <input
            type="checkbox"
            checked={selectedValues.size === uniqueValues.length}
            onChange={handleSelectAll}
            className="w-4 h-4"
          />
          Select All ({uniqueValues.length})
        </label>
      </div>

      {/* Values list */}
      <div className="flex-1 overflow-y-auto max-h-[250px] space-y-1">
        {uniqueValues.map(value => (
          <label
            key={value}
            className="flex items-center gap-2 p-1 hover:bg-gray-50 rounded cursor-pointer"
          >
            <input
              type="checkbox"
              checked={selectedValues.has(value)}
              onChange={() => handleToggleValue(value)}
              className="w-4 h-4"
            />
            <span className="text-sm truncate">
              {value === null || value === undefined ? '(Empty)' : String(value)}
            </span>
          </label>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 pt-2 border-t mt-2">
        <button
          onClick={handleApply}
          className="flex-1 px-3 py-1.5 bg-[#9e1f63] text-white text-sm rounded hover:bg-[#8a1a57]"
        >
          Apply
        </button>
        <button
          onClick={handleClear}
          className="flex-1 px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200"
        >
          Clear
        </button>
      </div>
    </div>
  );

  // Render dropdown in portal to avoid table overflow issues
  return ReactDOM.createPortal(
    dropdownContent,
    document.body
  );
};

// Column Visibility Modal Component
interface ColumnVisibilityModalProps {
  columns: DataTableColumn[];
  columnVisibility: VisibilityState;
  onApply: (visibility: VisibilityState) => void;
  onClose: () => void;
}

const ColumnVisibilityModal: React.FC<ColumnVisibilityModalProps> = ({
  columns,
  columnVisibility,
  onApply,
  onClose,
}) => {
  const [tempVisibility, setTempVisibility] = useState<VisibilityState>(columnVisibility);

  const visibleCount = useMemo(() => {
    return columns.filter(col => tempVisibility[col.id] !== false).length;
  }, [columns, tempVisibility]);

  const handleApply = () => {
    onApply(tempVisibility);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full max-h-[80vh] flex flex-col">
        <h3 className="text-lg font-semibold mb-4">Column Visibility</h3>
        <p className="text-sm text-gray-600 mb-4">
          {visibleCount} of {columns.length} columns visible
        </p>

        <div className="flex-1 overflow-y-auto space-y-2 mb-4">
          {columns.map(col => (
            <label
              key={col.id}
              className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
            >
              <input
                type="checkbox"
                checked={tempVisibility[col.id] !== false}
                onChange={e =>
                  setTempVisibility(prev => ({
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

        <div className="flex gap-3 pt-4 border-t">
          <button
            onClick={handleApply}
            className="flex-1 px-4 py-2 bg-[#9e1f63] text-white rounded hover:bg-[#8a1a57]"
          >
            Apply Changes
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};


// Export Service
class ExportService {
  static exportToCSV(data: any[], columns: DataTableColumn[], filename: string) {
    // Prepare headers
    const headers = columns.map(col => col.header).join(',');

    // Prepare rows
    const rows = data.map(row => {
      return columns.map(col => {
        const value = row[col.accessorKey];
        // Handle values with commas or quotes
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',');
    }).join('\n');

    // Create CSV content
    const csvContent = `${headers}\n${rows}`;

    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  static exportToExcel(data: any[], columns: DataTableColumn[], filename: string) {
    // Prepare worksheet data
    const wsData = [
      columns.map(col => col.header), // Headers
      ...data.map(row => columns.map(col => {
        const value = row[col.accessorKey];
        if (col.dataType === 'currency' && typeof value === 'number') {
          return value;
        }
        return value ?? '';
      }))
    ];

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Set column widths
    ws['!cols'] = columns.map(col => ({ wch: Math.max(col.header.length, 15) }));

    // Apply number formatting for currency columns
    columns.forEach((col, idx) => {
      if (col.dataType === 'currency') {
        for (let rowIdx = 1; rowIdx < wsData.length; rowIdx++) {
          const cellAddr = XLSX.utils.encode_cell({ r: rowIdx, c: idx });
          if (ws[cellAddr]) {
            ws[cellAddr].z = '"SAR "#,##0';
          }
        }
      }
    });

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data');

    // Save file
    XLSX.writeFile(wb, filename);
  }
}

// Main DataTable component
export const DataTable: React.FC<DataTableProps> = ({
  data,
  columns,
  pageSize = 50,
  className = '',
  enablePagination = true,
  enableColumnVisibility = true,
  enableExport = true,
  enableAggregation = true,
}) => {
  // State management
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState('');
  const [activeFilterColumn, setActiveFilterColumn] = useState<string | null>(null);
  const [showColumnModal, setShowColumnModal] = useState(false);
  const filterRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

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
            <div className="flex items-center gap-1 ml-2">
              {/* Filter button */}
              {col.enableFiltering !== false && (
                <div className="relative" ref={el => filterRefs.current[col.id] = el}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveFilterColumn(activeFilterColumn === col.id ? null : col.id);
                    }}
                    className={`p-1 rounded ${
                      column.getFilterValue() ? 'bg-[#9e1f63]/10 text-[#9e1f63]' : 'hover:bg-gray-100'
                    }`}
                  >
                    <Filter className="h-3 w-3" />
                  </button>
                  {activeFilterColumn === col.id && (
                    <FilterDropdown
                      column={column}
                      data={data}
                      onClose={() => setActiveFilterColumn(null)}
                    />
                  )}
                </div>
              )}
              {/* Sort button */}
              {col.enableSorting !== false && (
                <button
                  onClick={() => column.toggleSorting()}
                  className="p-1 hover:bg-gray-100 rounded"
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
        filterFn: multiSelectFilter,
      })),
    ],
    [columns, data, activeFilterColumn]
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
    globalFilterFn: 'includesString',
    initialState: {
      pagination: {
        pageSize,
      },
    },
  });

  // Get filtered rows for export and aggregation
  const filteredRows = table.getFilteredRowModel().rows;
  const filteredData = useMemo(() =>
    filteredRows.map(row => row.original),
    [filteredRows]
  );

  // Calculate totals for selected rows
  const selectedRowTotals = useMemo(() => {
    const selectedRows = table.getSelectedRowModel().rows;
    if (selectedRows.length === 0) return null;

    const totals: Record<string, number> = {};

    columns.forEach(col => {
      if ((col.dataType === 'currency' || col.dataType === 'number') && col.enableAggregation !== false) {
        const sum = selectedRows.reduce((acc, row) => {
          const value = row.original[col.accessorKey || col.id];
          return acc + (Number(value) || 0);
        }, 0);
        if (sum > 0) {
          totals[col.header || col.id] = sum;
        }
      }
    });

    return Object.keys(totals).length > 0 ? totals : null;
  }, [table.getSelectedRowModel().rows, columns]);

  // Clear filters
  const clearFilters = useCallback(() => {
    // Clear all column filters (including search inputs and dropdown filters)
    table.getAllColumns().forEach(column => {
      column.setFilterValue(undefined);
    });
    // Clear global filter
    setGlobalFilter('');
    // Clear the column filters state
    setColumnFilters([]);
    // Clear all row selections (checkboxes)
    table.resetRowSelection();
  }, [table]);

  // Export handlers
  const handleExportCSV = useCallback(() => {
    const visibleColumns = columns.filter(col => columnVisibility[col.id] !== false);
    const timestamp = new Date().toISOString().split('T')[0];
    ExportService.exportToCSV(filteredData, visibleColumns, `data_export_${timestamp}.csv`);
  }, [filteredData, columns, columnVisibility]);

  const handleExportExcel = useCallback(() => {
    const visibleColumns = columns.filter(col => columnVisibility[col.id] !== false);
    const timestamp = new Date().toISOString().split('T')[0];
    ExportService.exportToExcel(filteredData, visibleColumns, `data_export_${timestamp}.xlsx`);
  }, [filteredData, columns, columnVisibility]);

  // Removed - now handled inside FilterDropdown component

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

        <div className="flex items-center gap-2">
          {/* Export buttons */}
          {enableExport && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCSV}
                className="px-3 py-2 text-sm bg-white border rounded hover:bg-gray-50 flex items-center gap-2 transition-colors"
              >
                <FileText className="h-4 w-4" />
                CSV
              </button>
              <button
                onClick={handleExportExcel}
                className="px-3 py-2 text-sm bg-white border rounded hover:bg-gray-50 flex items-center gap-2 transition-colors"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Excel
              </button>
            </div>
          )}

          {/* Column visibility */}
          {enableColumnVisibility && (
            <button
              onClick={() => setShowColumnModal(true)}
              className="px-3 py-2 text-sm bg-white border rounded hover:bg-gray-50 flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              Columns
            </button>
          )}
        </div>
      </div>


      {/* Selection Report Dashboard - shows when data is filtered OR rows are selected */}
      {(table.getSelectedRowModel().rows.length > 0 ||
        (filteredData.length > 0 && filteredData.length < (data?.length || 0))) && (
        <SelectionReportCard
          selectedRows={
            table.getSelectedRowModel().rows.length > 0
              ? table.getSelectedRowModel().rows.map(row => row.original)
              : filteredData
          }
          columns={columns}
          totalRows={data?.length || 0}
          isFiltered={filteredData.length < (data?.length || 0)}
          isSelected={table.getSelectedRowModel().rows.length > 0}
          allData={data}
        />
      )}

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
                  </th>
                ))}
              </tr>
            ))}
            {/* Search input row for each column */}
            <tr className="bg-gray-50 border-b">
              <th className="px-4 py-2">
                {/* Empty cell for checkbox column */}
              </th>
              {columns.map(col => (
                <th key={col.id} className="px-4 py-2">
                  {col.enableFiltering !== false ? (
                    <input
                      type="text"
                      value={(table.getColumn(col.id)?.getFilterValue() ?? '') as string}
                      onChange={e => {
                        const value = e.target.value;
                        table.getColumn(col.id)?.setFilterValue(value || undefined);
                      }}
                      onKeyDown={e => {
                        e.stopPropagation();
                      }}
                      placeholder="Search..."
                      className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:border-[#9e1f63] focus:ring-1 focus:ring-[#9e1f63]/20"
                    />
                  ) : null}
                </th>
              ))}
            </tr>
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
                    row.getIsSelected() ? 'bg-[#9e1f63]/5' : ''
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
              filteredData.length
            )}{' '}
            of {filteredData.length} filtered results (Total: {data?.length || 0})
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
        Active filters: {columnFilters.length} | Total rows: {data?.length || 0} |
        Filtered rows: {filteredData.length} | Selected rows: {Object.keys(rowSelection).length}
      </div>

      {/* Column visibility modal */}
      {showColumnModal && (
        <ColumnVisibilityModal
          columns={columns}
          columnVisibility={columnVisibility}
          onApply={setColumnVisibility}
          onClose={() => setShowColumnModal(false)}
        />
      )}
    </div>
  );
};

// Export default for convenience
export default DataTable;