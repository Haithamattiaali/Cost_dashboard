/**
 * Selection Report Dashboard Module
 * Enterprise-grade analytics dashboard for selected DataTable rows
 * Following CNS architecture patterns with proper module boundaries
 */

import React, { useMemo, useCallback } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Package,
  Percent,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Award,
  Layers,
  Info,
  ChevronRight,
  Download,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { summarizeConversion } from '../../lib/execSummaryConversion';
import { fmtMoney, fmtPct, fmtShort, toneForCost } from '../../utils/delta';

// ===========================
// Module Contracts & Interfaces
// ===========================

export interface SelectionReportData {
  selectedRows: any[];
  columns: Array<{
    id: string;
    header: string;
    accessorKey: string;
    dataType?: 'text' | 'number' | 'currency' | 'enum';
    enableAggregation?: boolean;
  }>;
  totalRows?: number;
  isFiltered?: boolean;
  isSelected?: boolean;
  allData?: any[];
  // Conversion mode parameters
  conversionMode?: boolean;
  periods?: {
    p1: { year: number; qtr: number };
    p2: { year: number; qtr: number };
  };
  allConversionData?: any[]; // All rows for both periods
  selectedKeys?: Set<string | number>; // Keys of selected rows
}

interface MetricCardProps {
  title: string;
  value: string | number | React.ReactNode;
  icon: React.ReactNode;
  subtitle?: string;
  gradient?: boolean;
  trend?: 'up' | 'down' | 'neutral';
}

interface CategoryData {
  name: string;
  value: number;
  percentage: number;
  count: number;
}

interface DepartmentData {
  department: string;
  value: number;
  percentage: number;
  items: number;
}

interface StatisticsData {
  highest: { label: string; value: number };
  lowest: { label: string; value: number };
  average: number;
  median: number;
  standardDeviation: number;
  quartiles: {
    q1: number;
    q2: number;
    q3: number;
  };
}

// ===========================
// Utility Services
// ===========================

class AnalyticsService {
  /**
   * Format currency values
   */
  static formatCurrency(value: number): string {
    if (value === null || value === undefined) return 'SAR 0';
    return new Intl.NumberFormat('en-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }

  /**
   * Format large numbers with abbreviations
   */
  static formatLargeNumber(value: number): string {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toLocaleString();
  }

  /**
   * Calculate percentage
   */
  static calculatePercentage(value: number, total: number): number {
    if (total === 0) return 0;
    return (value / total) * 100;
  }

  /**
   * Calculate statistics for numeric array
   */
  static calculateStatistics(values: number[]): StatisticsData {
    if (values.length === 0) {
      return {
        highest: { label: '-', value: 0 },
        lowest: { label: '-', value: 0 },
        average: 0,
        median: 0,
        standardDeviation: 0,
        quartiles: { q1: 0, q2: 0, q3: 0 },
      };
    }

    const sorted = [...values].sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);
    const average = sum / sorted.length;

    // Calculate median
    const mid = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];

    // Calculate quartiles
    const q1Index = Math.floor(sorted.length * 0.25);
    const q3Index = Math.floor(sorted.length * 0.75);
    const quartiles = {
      q1: sorted[q1Index],
      q2: median,
      q3: sorted[q3Index],
    };

    // Calculate standard deviation
    const squaredDiffs = values.map(value => Math.pow(value - average, 2));
    const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
    const standardDeviation = Math.sqrt(avgSquaredDiff);

    return {
      highest: { label: 'Highest', value: sorted[sorted.length - 1] },
      lowest: { label: 'Lowest', value: sorted[0] },
      average,
      median,
      standardDeviation,
      quartiles,
    };
  }

  /**
   * Group data by category and aggregate
   */
  static aggregateByCategory(
    rows: any[],
    categoryField: string,
    valueField: string
  ): CategoryData[] {
    const grouped = new Map<string, { value: number; count: number }>();

    rows.forEach(row => {
      const category = row[categoryField] || 'Uncategorized';
      const value = Number(row[valueField]) || 0;

      if (grouped.has(category)) {
        const existing = grouped.get(category)!;
        existing.value += value;
        existing.count += 1;
      } else {
        grouped.set(category, { value, count: 1 });
      }
    });

    const total = Array.from(grouped.values()).reduce((sum, item) => sum + item.value, 0);

    return Array.from(grouped.entries())
      .map(([name, data]) => ({
        name,
        value: data.value,
        percentage: this.calculatePercentage(data.value, total),
        count: data.count,
      }))
      .sort((a, b) => b.value - a.value);
  }
}

// ===========================
// Sub-Components
// ===========================

/**
 * Metric Card Component
 */
const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon,
  subtitle,
  gradient = false,
  trend,
}) => {
  return (
    <div
      className={`p-5 rounded-xl border min-h-[200px] h-auto ${
        gradient
          ? 'bg-gradient-to-br from-white via-[#f2f2f4] to-[#e2e1e6] border-[#e2e1e6] shadow-md'
          : 'bg-white border-[#e2e1e6] shadow-sm'
      } hover:shadow-lg transition-all duration-300`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-semibold text-[#424046] uppercase tracking-wider mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            {title}
          </p>
          {typeof value === 'string' || typeof value === 'number' ? (
            <p className="text-2xl font-bold text-[#424046]">{value}</p>
          ) : (
            <div>{value}</div>
          )}
          {subtitle && (
            <p className="text-xs text-[#717171] mt-2 font-medium">{subtitle}</p>
          )}
        </div>
        <div className={`p-2.5 rounded-lg ${gradient ? 'bg-gradient-to-br from-[#9e1f63]/10 to-[#e05e3d]/10' : 'bg-[#f2f2f4]'}`}>
          {icon}
        </div>
      </div>
      {trend && (
        <div className="mt-3 pt-3 border-t border-[#e2e1e6] flex items-center gap-1">
          <TrendingUp
            className={`h-3 w-3 ${
              trend === 'up' ? 'text-[#005b8c]' : trend === 'down' ? 'text-[#e05e3d]' : 'text-[#717171]'
            }`}
          />
          <span
            className={`text-xs font-semibold uppercase tracking-wider ${
              trend === 'up' ? 'text-[#005b8c]' : trend === 'down' ? 'text-[#e05e3d]' : 'text-[#717171]'
            }`}
          >
            {trend === 'up' ? 'Increasing' : trend === 'down' ? 'Decreasing' : 'Stable'}
          </span>
        </div>
      )}
    </div>
  );
};

/**
 * Horizontal Bar Chart Component
 */
const HorizontalBarChart: React.FC<{ data: CategoryData[]; title: string }> = ({ data, title }) => {
  const maxValue = Math.max(...data.map(d => d.value));

  return (
    <div className="bg-white p-5 rounded-xl border border-[#e2e1e6] shadow-sm hover:shadow-md transition-all duration-300">
      <h3 className="text-sm font-bold text-[#424046] mb-4 flex items-center gap-2 uppercase tracking-wider" style={{ fontFamily: 'Montserrat, sans-serif' }}>
        <div className="p-1.5 bg-gradient-to-br from-[#9e1f63]/10 to-[#e05e3d]/10 rounded-lg">
          <BarChart3 className="h-4 w-4 text-[#9e1f63]" />
        </div>
        {title}
      </h3>
      <div className="space-y-3">
        {data.slice(0, 5).map((item, index) => (
          <div key={`${item.name}-${index}`} className="group">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-[#424046] truncate max-w-[150px]" title={item.name}>
                {item.name}
              </span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-[#717171] font-medium">
                  {item.count} {item.count === 1 ? 'item' : 'items'}
                </span>
                <span className="text-xs font-bold text-[#424046]">
                  {AnalyticsService.formatCurrency(item.value)}
                </span>
              </div>
            </div>
            <div className="relative h-7 bg-[#f2f2f4] rounded-lg overflow-hidden">
              <div
                className="absolute left-0 top-0 h-full bg-gradient-to-r from-[#9e1f63] to-[#e05e3d] rounded-lg transition-all duration-500 ease-out shadow-sm"
                style={{
                  width: `${(item.value / maxValue) * 100}%`,
                  animation: 'slideIn 0.5s ease-out',
                }}
              >
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-white drop-shadow">
                  {item.percentage.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Top Items List Component
 */
const TopItemsList: React.FC<{ items: any[]; valueField: string; labelField: string }> = ({
  items,
  valueField,
  labelField,
}) => {
  const topItems = useMemo(() => {
    return items
      .map(item => ({
        label: item[labelField] || 'Unknown',
        value: Number(item[valueField]) || 0,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [items, valueField, labelField]);

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200">
      <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
        <Award className="h-4 w-4 text-[#9e1f63]" />
        Top Selected Items
      </h3>
      <div className="space-y-2">
        {topItems.map((item, index) => (
          <div
            key={`${item.label}-${index}`}
            className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-2">
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  index === 0
                    ? 'bg-gradient-to-br from-[#9e1f63] to-[#c2185b] text-white'
                    : index < 3
                    ? 'bg-[#9e1f63]/20 text-[#9e1f63]'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {index + 1}
              </span>
              <span className="text-sm text-gray-700 truncate max-w-[180px]">{item.label}</span>
            </div>
            <span className="text-sm font-semibold text-gray-900">
              {AnalyticsService.formatCurrency(item.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Statistics Panel Component
 */
const StatisticsPanel: React.FC<{ stats: StatisticsData }> = ({ stats }) => {
  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200">
      <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
        <Activity className="h-4 w-4 text-[#9e1f63]" />
        Statistical Analysis
      </h3>
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-gradient-to-br from-[#9e1f63]/10 to-[#e05e3d]/10 rounded-lg border border-[#9e1f63]/20">
          <p className="text-xs text-[#721548] mb-1 font-semibold">Highest Value</p>
          <p className="text-lg font-bold text-[#9e1f63]">
            {AnalyticsService.formatCurrency(stats.highest.value)}
          </p>
          <p className="text-xs text-[#721548] mt-1 truncate" title={stats.highest.label}>
            {stats.highest.label}
          </p>
        </div>
        <div className="p-3 bg-gradient-to-br from-[#424046]/10 to-[#6a686f]/10 rounded-lg border border-[#424046]/20">
          <p className="text-xs text-[#424046] mb-1 font-semibold">Lowest Value</p>
          <p className="text-lg font-bold text-[#424046]">
            {AnalyticsService.formatCurrency(stats.lowest.value)}
          </p>
          <p className="text-xs text-[#424046] mt-1 truncate" title={stats.lowest.label}>
            {stats.lowest.label}
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * Department Distribution Component
 */
const DepartmentDistribution: React.FC<{ data: DepartmentData[] }> = ({ data }) => {
  const totalValue = data.reduce((sum, dept) => sum + dept.value, 0);

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200">
      <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
        <Layers className="h-4 w-4 text-[#9e1f63]" />
        Department Distribution
      </h3>
      <div className="space-y-2">
        {data.slice(0, 6).map((dept, index) => {
          const colors = [
            'from-[#9e1f63] to-[#c2185b]',
            'from-purple-500 to-purple-600',
            'from-blue-500 to-blue-600',
            'from-indigo-500 to-indigo-600',
            'from-teal-500 to-teal-600',
            'from-green-500 to-green-600',
          ];
          const bgColor = colors[index % colors.length];

          return (
            <div key={`${dept.department}-${index}`} className="group">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${bgColor}`} />
                  <span className="text-xs font-medium text-gray-600">
                    {dept.department}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500">
                    {dept.items} {dept.items === 1 ? 'item' : 'items'}
                  </span>
                  <span className="text-xs font-semibold text-gray-900">
                    {dept.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`absolute left-0 top-0 h-full bg-gradient-to-r ${bgColor} rounded-full transition-all duration-500`}
                  style={{
                    width: `${dept.percentage}%`,
                    animation: 'slideIn 0.5s ease-out',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-3 pt-3 border-t">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">Total Value:</span>
          <span className="font-bold text-gray-900">
            {AnalyticsService.formatCurrency(totalValue)}
          </span>
        </div>
      </div>
    </div>
  );
};

// ===========================
// Main Component
// ===========================

/**
 * Selection Report Card Component
 * Main dashboard for analyzing selected data
 */
export const SelectionReportCard: React.FC<SelectionReportData> = ({
  selectedRows,
  columns,
  totalRows = 0,
  isFiltered = false,
  isSelected = false,
  allData = [],
  conversionMode = false,
  periods,
  allConversionData,
  selectedKeys,
}) => {
  // Calculate conversion metrics if in conversion mode
  const conversionMetrics = useMemo(() => {
    if (!conversionMode || !periods || !allConversionData || !selectedKeys) {
      return null;
    }

    const result = summarizeConversion(
      allConversionData,
      selectedKeys,
      periods,
      {
        valueKey: 'totalIncurredCost',
        catKey: 'mainCategories',
        keyCols: ['glAccountNo'],
        currency: 'SAR',
        yearCol: 'year',
        qtrCol: 'quarter'
      }
    );

    return result;
  }, [conversionMode, periods, allConversionData, selectedKeys]);

  // Calculate core metrics
  const metrics = useMemo(() => {
    if (!selectedRows || selectedRows.length === 0) return null;

    // Find currency/number columns for aggregation
    const valueColumns = columns.filter(
      col =>
        (col.dataType === 'currency' || col.dataType === 'number') &&
        col.enableAggregation !== false
    );

    // Identify the primary value column (totalIncurredCost or similar)
    const primaryValueColumn = valueColumns.find(col => col.dataType === 'currency') || valueColumns[0];

    // Check if data has quarter and year fields
    const hasQuarterField = selectedRows.length > 0 && 'quarter' in selectedRows[0];
    const hasYearField = selectedRows.length > 0 && 'year' in selectedRows[0];

    // Get unique quarters and years from the data
    const uniqueQuarters = hasQuarterField
      ? [...new Set(selectedRows.map(row => row.quarter))].filter(Boolean).sort()
      : [];

    // Get the fiscal year from data (should be consistent across selected rows)
    const fiscalYear = hasYearField
      ? selectedRows[0].year
      : new Date().getFullYear();

    // Calculate totals based on quarter grouping
    const quarterTotals: { [key: string]: { selected: number; total: number; percentage: number } } = {};
    let totalValue = 0;
    let grandTotal = 0;

    if (hasQuarterField && uniqueQuarters.length > 0 && primaryValueColumn) {
      // Group by actual quarters in the data
      uniqueQuarters.forEach(quarter => {
        // Selected total for this quarter
        const selectedQuarterTotal = selectedRows
          .filter(row => row.quarter === quarter)
          .reduce((sum, row) => {
            return sum + (Number(row[primaryValueColumn.accessorKey]) || 0);
          }, 0);

        // Grand total for this quarter (all data with same quarter)
        const grandQuarterTotal = allData && allData.length > 0
          ? allData
              .filter(row => row.quarter === quarter)
              .reduce((sum, row) => {
                return sum + (Number(row[primaryValueColumn.accessorKey]) || 0);
              }, 0)
          : selectedQuarterTotal;

        // Calculate percentage for this quarter
        const quarterPercentage = grandQuarterTotal > 0
          ? (selectedQuarterTotal / grandQuarterTotal) * 100
          : 100;

        // Format quarter name for display
        const quarterDisplay = String(quarter).toUpperCase();

        quarterTotals[quarterDisplay] = {
          selected: selectedQuarterTotal,
          total: grandQuarterTotal,
          percentage: quarterPercentage
        };

        totalValue += selectedQuarterTotal;
      });

      // Calculate grand total from all data
      grandTotal = allData && allData.length > 0
        ? allData.reduce((sum, row) => {
            return sum + (Number(row[primaryValueColumn.accessorKey]) || 0);
          }, 0)
        : totalValue;
    } else if (primaryValueColumn) {
      // No quarter field - just sum total values
      totalValue = selectedRows.reduce((sum, row) => {
        const value = Number(row[primaryValueColumn.accessorKey]) || 0;
        return sum + value;
      }, 0);

      grandTotal = allData && allData.length > 0
        ? allData.reduce((sum, row) => {
            const value = Number(row[primaryValueColumn.accessorKey]) || 0;
            return sum + value;
          }, 0)
        : totalValue;
    }

    // Calculate overall percentage (all quarters combined)
    const percentageOfValue = grandTotal > 0
      ? AnalyticsService.calculatePercentage(totalValue, grandTotal)
      : 100;

    // Calculate percentage of rows
    const percentageOfTotal = totalRows > 0
      ? AnalyticsService.calculatePercentage(selectedRows.length, totalRows)
      : 100;

    return {
      totalValue,
      grandTotal,
      itemCount: selectedRows.length,
      percentageOfTotal,
      percentageOfValue,
      primaryValueColumn,
      quarterTotals,
      fiscalYear,
    };
  }, [selectedRows, columns, totalRows, allData]);

  // Calculate category aggregations
  const categoryData = useMemo(() => {
    if (!selectedRows || selectedRows.length === 0 || !metrics) return [];

    // Find category columns - prioritize GL Account Name
    const categoryColumn = columns.find(col =>
      col.accessorKey === 'glAccountName' ||
      col.accessorKey.toLowerCase().includes('glaccountname')
    ) || columns.find(col =>
      col.accessorKey.toLowerCase().includes('category') ||
      col.accessorKey.toLowerCase().includes('expense') ||
      col.header.toLowerCase().includes('category') ||
      col.header.toLowerCase().includes('expense')
    ) || columns.find(col => col.dataType === 'text' || col.dataType === 'enum');

    if (!categoryColumn) return [];

    // Group selected data by category
    const grouped = new Map<string, { value: number; count: number }>();

    selectedRows.forEach(row => {
      const category = row[categoryColumn.accessorKey] || 'Uncategorized';

      // Use the primary value column from metrics
      const rowValue = metrics.primaryValueColumn
        ? Number(row[metrics.primaryValueColumn.accessorKey]) || 0
        : 0;

      if (grouped.has(category)) {
        const existing = grouped.get(category)!;
        existing.value += rowValue;
        existing.count += 1;
      } else {
        grouped.set(category, { value: rowValue, count: 1 });
      }
    });

    // Use grandTotal from metrics for percentage calculation
    // This represents the total quarter value for ALL data
    const totalQuarterValue = metrics.grandTotal;

    return Array.from(grouped.entries())
      .map(([name, data]) => ({
        name,
        value: data.value,
        percentage: totalQuarterValue > 0
          ? AnalyticsService.calculatePercentage(data.value, totalQuarterValue)
          : 0,
        count: data.count,
      }))
      .sort((a, b) => b.value - a.value);
  }, [selectedRows, columns, metrics]);

  // Calculate department distribution
  const departmentData = useMemo(() => {
    if (!metrics?.primaryValueColumn) return [];

    // Look for department column
    const deptColumn = columns.find(col =>
      col.header.toLowerCase().includes('department') ||
      col.accessorKey.toLowerCase().includes('department')
    );

    if (!deptColumn) return [];

    const grouped = AnalyticsService.aggregateByCategory(
      selectedRows,
      deptColumn.accessorKey,
      metrics.primaryValueColumn.accessorKey
    );

    return grouped.map(item => ({
      department: item.name,
      value: item.value,
      percentage: item.percentage,
      items: item.count,
    }));
  }, [selectedRows, columns, metrics]);

  // Calculate statistics with GL Account names
  const statistics = useMemo(() => {
    if (!metrics?.primaryValueColumn) return null;

    // Find GL Account column for labels
    const glAccountColumn = columns.find(col =>
      col.accessorKey === 'glAccountName' ||
      col.header.toLowerCase().includes('gl account')
    );

    // Create value-label pairs
    const valueLabels = selectedRows.map(row => ({
      value: Number(row[metrics.primaryValueColumn.accessorKey]) || 0,
      label: glAccountColumn ? row[glAccountColumn.accessorKey] : null
    }));

    // Sort by value to find highest and lowest
    const sorted = [...valueLabels].sort((a, b) => a.value - b.value);
    const values = valueLabels.map(item => item.value);

    // Calculate standard statistics
    const baseStats = AnalyticsService.calculateStatistics(values);

    // Add GL Account names to highest and lowest
    return {
      ...baseStats,
      highest: {
        label: sorted[sorted.length - 1]?.label || 'Unknown',
        value: sorted[sorted.length - 1]?.value || 0
      },
      lowest: {
        label: sorted[0]?.label || 'Unknown',
        value: sorted[0]?.value || 0
      }
    };
  }, [selectedRows, columns, metrics]);

  // Export handler
  const handleExportReport = useCallback(() => {
    if (!selectedRows || selectedRows.length === 0) return;

    // Prepare report data
    const reportData = {
      summary: {
        'Total Quarter Value': AnalyticsService.formatCurrency(metrics.grandTotal),
        'Selected Value': AnalyticsService.formatCurrency(metrics.totalValue),
        'Percentage of Quarter': `${metrics.percentageOfValue.toFixed(1)}%`,
        'Items Selected': metrics.itemCount,
        'Quarter': Object.keys(metrics.quarterTotals).join(', ') || 'Q2'
      },
      categories: categoryData.map(cat => ({
        'Category': cat.name,
        'Value': AnalyticsService.formatCurrency(cat.value),
        'Percentage': `${cat.percentage.toFixed(1)}%`,
        'Item Count': cat.count
      })),
      selectedData: selectedRows
    };

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Add Summary sheet
    const summaryWs = XLSX.utils.json_to_sheet([reportData.summary]);
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

    // Add Categories sheet if available
    if (reportData.categories.length > 0) {
      const categoriesWs = XLSX.utils.json_to_sheet(reportData.categories);
      XLSX.utils.book_append_sheet(wb, categoriesWs, 'Categories');
    }

    // Add Selected Data sheet
    const dataWs = XLSX.utils.json_to_sheet(reportData.selectedData);
    XLSX.utils.book_append_sheet(wb, dataWs, 'Selected Data');

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `selection_report_${timestamp}.xlsx`;

    // Download the file
    XLSX.writeFile(wb, filename);
  }, [selectedRows, metrics, categoryData]);

  // Don't render if no rows selected
  if (!selectedRows || selectedRows.length === 0 || !metrics) {
    return null;
  }

  return (
    <div className="selection-report-dashboard mb-6 animate-fadeIn">
      {/* Header - PROCEED® Brand Identity */}
      <div className="mb-6 p-6 bg-gradient-to-r from-[#9e1f63] to-[#e05e3d] rounded-xl shadow-lg text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold flex items-center gap-3 text-white" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              <div className="p-2 bg-white/15 rounded-lg backdrop-blur-sm">
                <Target className="h-5 w-5" />
              </div>
              PROCEED® ANALYTICS DASHBOARD
            </h2>
            <p className="text-sm mt-2 opacity-95 font-medium">
              Executive Summary • {metrics.itemCount} Items Selected • Quarter {Object.keys(metrics.quarterTotals).join(', ') || 'Q2'} Analysis
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-lg backdrop-blur-sm">
              <Activity className="h-3 w-3" />
              <span className="text-xs font-medium uppercase tracking-wider">Live Data</span>
            </div>
            <span className="text-xs opacity-75">{new Date().toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 auto-rows-auto">
        <MetricCard
          title="Financial Summary"
          value={
            conversionMode && conversionMetrics ? (
              <div className="space-y-3">
                {/* Total Quarter - P2 vs P1 */}
                <div>
                  <div className="text-xs text-[#717171] uppercase tracking-wider mb-1 font-semibold">Total Quarter</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-xs text-gray-500">P2</div>
                      <div className="text-lg font-bold text-[#424046]">
                        {fmtMoney(conversionMetrics.totals.p2.total)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">P1</div>
                      <div className="text-lg font-bold text-[#717171]">
                        {fmtMoney(conversionMetrics.totals.p1.total)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Selected Value - P2 vs P1 */}
                <div>
                  <div className="text-xs text-[#717171] uppercase tracking-wider mb-1 font-semibold">Selected Value</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-xs text-gray-500">P2</div>
                      <div className="text-lg font-bold text-[#9e1f63]">
                        {fmtMoney(conversionMetrics.totals.p2.selected)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">P1</div>
                      <div className="text-lg font-bold text-[#cb5b96]">
                        {fmtMoney(conversionMetrics.totals.p1.selected)}
                      </div>
                    </div>
                  </div>
                  {/* Delta chip */}
                  <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold mt-1 ${
                    toneForCost(conversionMetrics.totals.delta.selected) === 'success'
                      ? 'bg-emerald-100 text-emerald-700'
                      : toneForCost(conversionMetrics.totals.delta.selected) === 'danger'
                      ? 'bg-rose-100 text-rose-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {fmtPct(conversionMetrics.totals.delta.selected.pct)} ({fmtShort(conversionMetrics.totals.delta.selected.abs)})
                  </div>
                </div>

                {/* Coverage - P2 vs P1 */}
                <div className="pt-3 border-t border-[#e2e1e6]">
                  <div className="text-xs text-[#717171] uppercase tracking-wider mb-1 font-semibold" title="Selected ÷ Total">Coverage</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-xs text-gray-500">P2</div>
                      <div className="text-lg font-bold bg-gradient-to-r from-[#9e1f63] to-[#e05e3d] bg-clip-text text-transparent">
                        {conversionMetrics.totals.p2.coverage.toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">P1</div>
                      <div className="text-lg font-bold text-[#717171]">
                        {conversionMetrics.totals.p1.coverage.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  {/* Coverage delta */}
                  <div className="text-xs text-gray-600 mt-1">
                    Δ coverage: {fmtPct(conversionMetrics.totals.delta.coverage.pct)} ({fmtShort(conversionMetrics.totals.delta.coverage.abs)} pp)
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-[#717171] uppercase tracking-wider mb-1 font-semibold">Total Quarter</div>
                  <div className="text-xl font-bold text-[#424046]">
                    {AnalyticsService.formatCurrency(metrics.grandTotal)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[#717171] uppercase tracking-wider mb-1 font-semibold">Selected Value</div>
                  <div className="text-xl font-bold text-[#9e1f63]">
                    {AnalyticsService.formatCurrency(metrics.totalValue)}
                  </div>
                </div>
                <div className="pt-3 border-t border-[#e2e1e6]">
                  <div className="text-xs text-[#717171] uppercase tracking-wider mb-1 font-semibold" title="Selected Value ÷ Total Quarter">Coverage</div>
                  <div className="flex items-baseline gap-2">
                    <div className="text-2xl font-bold bg-gradient-to-r from-[#9e1f63] to-[#e05e3d] bg-clip-text text-transparent">
                      {metrics.percentageOfValue.toFixed(1)}%
                    </div>
                    <span className="text-xs text-[#717171]" title={`${AnalyticsService.formatCurrency(metrics.totalValue)} of ${AnalyticsService.formatCurrency(metrics.grandTotal)}`}>
                      (Selected ÷ Total)
                    </span>
                  </div>
                </div>
              </div>
            )
          }
          icon={<TrendingUp className="h-5 w-5 text-[#9e1f63]" />}
          subtitle={conversionMode && periods
            ? `Quarter Q${periods.p2.qtr} vs Q${periods.p1.qtr} • FY${periods.p2.year}`
            : `Quarter ${Object.keys(metrics.quarterTotals).join(', ') || 'Q2'} • FY${metrics.fiscalYear}`}
          gradient={true}
        />
        <MetricCard
          title={conversionMode ? "Selected Categories — % of Total (P2)" : "Selected Categories — % of Total"}
          value={
            conversionMode && conversionMetrics ? (
              <div className={`space-y-3 ${conversionMetrics.categories.length > 12 ? 'max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100' : ''}`}>
                {conversionMetrics.categories.slice(0, 12).map((category, idx) => (
                  <div key={idx} className="group">
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex-1 min-w-0">
                        <span className="text-xs text-gray-700 font-medium block truncate" title={category.label}>
                          {category.label}
                        </span>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-semibold text-gray-800">
                            {fmtMoney(category.v2, conversionMetrics.currency)}
                          </span>
                          <span className={`font-medium ${
                            toneForCost(category.delta) === 'success'
                              ? 'text-emerald-600'
                              : toneForCost(category.delta) === 'danger'
                              ? 'text-rose-600'
                              : 'text-gray-500'
                          }`}>
                            {category.delta.pct === null
                              ? `NEW (${fmtShort(category.delta.abs)})`
                              : `${fmtPct(category.delta.pct)} (${fmtShort(category.delta.abs)})`}
                          </span>
                        </div>
                      </div>
                      <div className="text-right ml-2">
                        <span className="text-xs font-bold text-[#9e1f63]">
                          {category.pctOfTotalP2.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="absolute left-0 top-0 h-full bg-gradient-to-r from-[#9e1f63] to-[#c2185b] rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(category.pctOfTotalP2, 100)}%`
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : categoryData.length > 0 ? (
              <div className={`space-y-3 ${categoryData.length > 10 ? 'max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100' : ''}`}>
                {categoryData.slice(0, 10).map((category, idx) => (
                  <div key={idx} className="group">
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex-1 min-w-0">
                        <span className="text-xs text-gray-700 font-medium block truncate" title={category.name}>
                          {category.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {AnalyticsService.formatCurrency(category.value)}
                        </span>
                      </div>
                      <div className="text-right ml-2">
                        <span className="text-xs font-bold text-[#9e1f63]">
                          {category.percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="absolute left-0 top-0 h-full bg-gradient-to-r from-[#9e1f63] to-[#c2185b] rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(category.percentage, 100)}%`
                        }}
                        title={`${category.name}: ${AnalyticsService.formatCurrency(category.value)} (${category.percentage.toFixed(1)}% of Total)`}
                      />
                    </div>
                  </div>
                ))}
                {categoryData.length > 10 && (
                  <div className="pt-2 border-t border-gray-200">
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex-1 min-w-0">
                        <span className="text-xs text-gray-600 font-medium italic">
                          Other ({categoryData.length - 10} categories)
                        </span>
                        <span className="text-xs text-gray-500 block">
                          {AnalyticsService.formatCurrency(
                            categoryData.slice(10).reduce((sum, cat) => sum + cat.value, 0)
                          )}
                        </span>
                      </div>
                      <div className="text-right ml-2">
                        <span className="text-xs font-bold text-gray-500">
                          {categoryData.slice(10).reduce((sum, cat) => sum + cat.percentage, 0).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-gray-500">No categories selected</div>
            )
          }
          icon={<BarChart3 className="h-5 w-5 text-[#9e1f63]" />}
          subtitle={`${categoryData.length} categories | ${metrics.itemCount} items`}
          gradient={false}
        />
      </div>

      {/* Additional Insights */}
      {departmentData.length > 0 && (
        <div className="flex justify-center">
          <div className="w-full max-w-2xl">
            <DepartmentDistribution data={departmentData} />
          </div>
        </div>
      )}

      {/* Footer - PROCEED® Brand */}
      <div className="mt-6 p-4 bg-gradient-to-r from-[#f2f2f4] to-[#e2e1e6] rounded-lg border border-[#e2e1e6]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-[#9e1f63]/10 rounded">
              <Activity className="h-4 w-4 text-[#9e1f63]" />
            </div>
            <div>
              <span className="text-xs font-semibold text-[#424046] uppercase tracking-wider">
                Analytics Report
              </span>
              <span className="text-xs text-[#717171] block">
                {metrics.itemCount} items • {isSelected ? 'Selected' : 'Filtered'} data
              </span>
            </div>
          </div>
          <button
            onClick={handleExportReport}
            className="px-4 py-2 bg-gradient-to-r from-[#9e1f63] to-[#e05e3d] text-white text-xs font-semibold rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-300 flex items-center gap-2"
          >
            <Download className="h-3.5 w-3.5" />
            EXPORT REPORT
          </button>
        </div>
      </div>
    </div>
  );
};

// Add CSS animation keyframes
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes slideIn {
    from {
      width: 0;
    }
    to {
      width: inherit;
    }
  }

  .animate-fadeIn {
    animation: fadeIn 0.3s ease-out;
  }
`;
document.head.appendChild(style);

export default SelectionReportCard;