import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Area,
  LabelList,
  Treemap,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Package,
  Truck,
  Building2,
  BarChart3,
} from "lucide-react";
import MetricCard from "../components/MetricCard";
import FilterPanel from "../components/FilterPanel";
import { fetchDashboardMetrics } from "../api/costs";
import { formatCurrency, formatPercentage } from "../utils/formatting";
import { DataTable, DataTableColumn } from "../modules/data-table";
import "../modules/data-table/styles.css";

// PROCEED Brand Colors
const PROCEED_COLORS = {
  // Primary colors
  primary: "#9e1f63",
  secondary: "#424046",
  accent: "#e05e3d",
  blue: "#005b8c",
  // Extended palette
  darkRed: "#721548",
  lightPink: "#cb5b96",
  gray: "#6a686f",
  lightGray: "#e2e1e6",
  darkGray: "#2d2d2d",
  mediumGray: "#717171",
  // Functional colors
  success: "#10b981",
  warning: "#f59e0b",
};

// Brand color palette for cycling through charts
const BRAND_PALETTE = [
  "#9e1f63", // primary
  "#424046", // secondary
  "#e05e3d", // accent
  "#005b8c", // blue
  "#721548", // darkRed
  "#cb5b96", // lightPink
  "#6a686f", // gray
  "#2d2d2d", // darkGray
  "#717171", // mediumGray
];

// Intelligent brand color rotation for GL accounts
const getBrandColor = (index: number): string => {
  return BRAND_PALETTE[index % BRAND_PALETTE.length];
};

// Global enhanced bar chart label configuration
const LABEL_CONFIG = {
  // Minimum value to show label (prevents overlapping on small bars)
  minValueThreshold: 0,
  // Global font sizes
  fontSize: {
    value: 13,
    percentage: 10
  },
  // Y-axis offsets for label positioning
  yOffset: {
    value: 15,
    percentage: 3
  },
  // Colors using PROCEED palette
  colors: {
    value: '#2d2d2d',
    percentage: '#424046'
  },
  // Font families
  fonts: {
    value: 'Montserrat, sans-serif',
    percentage: 'Open Sans, sans-serif'
  }
};

// Global bar chart label renderer - cleaner approach without backgrounds
const renderBarLabel = (props: any, options: {
  showPercentage?: boolean;
  percentageTotal?: number;
  minValue?: number;
}) => {
  const { x, y, width, value } = props;

  // Don't show label if value is too small (prevents overlap)
  const minThreshold = options.minValue || LABEL_CONFIG.minValueThreshold;
  if (!value || value < minThreshold) return null;

  const percentage = options.percentageTotal && options.percentageTotal > 0
    ? ((value / options.percentageTotal) * 100).toFixed(1)
    : null;

  return (
    <g>
      {/* Value label with stroke for contrast */}
      <text
        x={x + width / 2}
        y={y - LABEL_CONFIG.yOffset.value}
        fill={LABEL_CONFIG.colors.value}
        textAnchor="middle"
        stroke="white"
        strokeWidth={3}
        paintOrder="stroke"
        style={{
          fontWeight: 'bold',
          fontSize: LABEL_CONFIG.fontSize.value,
          fontFamily: LABEL_CONFIG.fonts.value
        }}
      >
        {formatCurrency(value, true)}
      </text>

      {/* Percentage label if enabled */}
      {options.showPercentage && percentage && (
        <text
          x={x + width / 2}
          y={y - LABEL_CONFIG.yOffset.percentage}
          fill={LABEL_CONFIG.colors.percentage}
          textAnchor="middle"
          stroke="white"
          strokeWidth={2}
          paintOrder="stroke"
          style={{
            fontSize: LABEL_CONFIG.fontSize.percentage,
            fontWeight: 500,
            fontFamily: LABEL_CONFIG.fonts.percentage
          }}
        >
          ({percentage}%)
        </text>
      )}
    </g>
  );
};

// Centralized chart styling configuration - Enhanced for better readability
const CHART_STYLES = {
  axis: {
    style: {
      fontWeight: 600,
      fontFamily: 'Open Sans, sans-serif',
      fill: '#424046' // PROCEED secondary color
    },
    fontSize: 14, // Increased from 12
  },
  axisLabel: {
    style: {
      fontWeight: 600,
      fontFamily: 'Open Sans, sans-serif',
      fill: '#424046'
    },
    fontSize: 13, // Increased from 11
  },
  labelList: {
    style: {
      fontWeight: "bold",
      fontSize: 12, // Increased from 10
      fill: "#2d2d2d", // Darker for better contrast
      fontFamily: 'Montserrat, sans-serif'
    },
  },
  legend: {
    wrapperStyle: {
      fontWeight: 600,
      fontSize: 13, // Added explicit size
      fontFamily: 'Open Sans, sans-serif'
    },
    iconSize: 18, // Standard icon size
  },
  tooltip: {
    contentStyle: {
      fontWeight: 600,
      fontSize: 13, // Added explicit size
      backgroundColor: "white",
      border: "2px solid #9e1f63", // PROCEED primary color
      borderRadius: "8px",
      padding: "12px",
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
      fontFamily: 'Open Sans, sans-serif'
    },
    labelStyle: {
      fontWeight: 700,
      fontSize: 14,
      color: '#9e1f63' // PROCEED primary color
    },
  },
  grid: {
    strokeDasharray: "3 3",
    stroke: "#e2e1e6", // PROCEED light gray
    strokeOpacity: 0.7,
  },
  pieLabel: {
    style: {
      fontWeight: "bold",
      fontSize: 14, // Increased from 12
      fontFamily: 'Montserrat, sans-serif',
      fill: '#2d2d2d' // Darker for contrast
    },
  },
  // New: Bar chart value labels
  barLabel: {
    position: "top",
    style: {
      fontSize: 11,
      fontWeight: "bold",
      fill: "#424046",
      fontFamily: 'Montserrat, sans-serif'
    }
  },
  // New: Custom tick properties
  tick: {
    fontSize: 13,
    fontFamily: 'Open Sans, sans-serif',
    fill: '#424046'
  }
};

// Enterprise Data Grid Component
const EnterpriseDataGrid: React.FC<{ data: any[] }> = ({ data }) => {
  // Log the incoming data
  console.log('[EnterpriseDataGrid] Received data:', {
    dataLength: data?.length,
    firstItem: data?.[0],
    dataType: typeof data,
    isArray: Array.isArray(data)
  });

  // Define columns with simplified configuration
  const columns: DataTableColumn[] = useMemo(() => [
    {
      id: 'glAccountName',
      header: 'GL Account Name',
      accessorKey: 'glAccountName',
      dataType: 'text',
      width: 200,
      formatter: (value) => value || '-'
    },
    {
      id: 'glAccountNo',
      header: 'GL No.',
      accessorKey: 'glAccountNo',
      dataType: 'text',
      width: 100,
      formatter: (value) => value || '-'
    },
    {
      id: 'glAccountsGroup',
      header: 'GL Group',
      accessorKey: 'glAccountsGroup',
      dataType: 'text',
      width: 150,
      formatter: (value) => value || '-'
    },
    {
      id: 'mainCategories',
      header: 'Main Categories',
      accessorKey: 'mainCategories',
      dataType: 'text',
      width: 120,
      formatter: (value) => value || '-'
    },
    {
      id: 'year',
      header: 'Year',
      accessorKey: 'year',
      dataType: 'number',
      width: 80,
      formatter: (value) => value || '-'
    },
    {
      id: 'quarter',
      header: 'Qtr',
      accessorKey: 'quarter',
      dataType: 'text',
      width: 60,
      formatter: (value) => value ? String(value).toUpperCase() : '-'
    },
    {
      id: 'type',
      header: 'Type',
      accessorKey: 'type',
      dataType: 'text',
      width: 100,
      formatter: (value) => value || '-'
    },
    {
      id: 'warehouse',
      header: 'WH',
      accessorKey: 'warehouse',
      dataType: 'text',
      width: 60,
      formatter: (value) => value || '-'
    },
    {
      id: 'costType',
      header: 'Cost Type',
      accessorKey: 'costType',
      dataType: 'text',
      width: 100,
      formatter: (value) => value || '-'
    },
    {
      id: 'tcoModelCategories',
      header: 'TCO Categories',
      accessorKey: 'tcoModelCategories',
      dataType: 'text',
      width: 200,
      formatter: (value) => value || '-'
    },
    {
      id: 'opexCapex',
      header: 'OpEx/CapEx',
      accessorKey: 'opexCapex',
      dataType: 'text',
      width: 100,
      formatter: (value) => value || '-'
    },
    {
      id: 'totalIncurredCost',
      header: 'Total Cost',
      accessorKey: 'totalIncurredCost',
      dataType: 'currency',
      width: 120,
      formatter: (value) => formatCurrency(value),
      enableAggregation: true
    }
  ], []);

  // Render the enhanced DataTable with all Excel-like features
  return (
    <DataTable
      data={data}
      columns={columns}
      pageSize={50}
      enablePagination={true}
      enableColumnVisibility={true}
      enableExport={true}
      enableAggregation={true}
      className="mt-4"
    />
  );
};

export default function Dashboard() {
  const [filters, setFilters] = useState({});

  // Comparison Mode State
  const [comparisonMode, setComparisonMode] = useState(false);
  const [firstPeriod, setFirstPeriod] = useState<{ year: number; quarter: string } | null>(null);
  const [secondPeriod, setSecondPeriod] = useState<{ year: number; quarter: string } | null>(null);

  // Main metrics query
  const {
    data: metrics,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["dashboard-metrics", filters],
    queryFn: () => fetchDashboardMetrics(filters),
  });

  // First period metrics for comparison
  const {
    data: firstPeriodMetrics,
    isLoading: firstPeriodLoading,
  } = useQuery({
    queryKey: ["dashboard-metrics-period1", firstPeriod],
    queryFn: () => fetchDashboardMetrics({
      year: firstPeriod?.year,
      quarter: firstPeriod?.quarter?.toLowerCase() // Convert to lowercase to match database
    }),
    enabled: comparisonMode && firstPeriod !== null,
  });

  // Second period metrics for comparison
  const {
    data: secondPeriodMetrics,
    isLoading: secondPeriodLoading,
  } = useQuery({
    queryKey: ["dashboard-metrics-period2", secondPeriod],
    queryFn: () => fetchDashboardMetrics({
      year: secondPeriod?.year,
      quarter: secondPeriod?.quarter?.toLowerCase() // Convert to lowercase to match database
    }),
    enabled: comparisonMode && secondPeriod !== null,
  });

  // Calculate growth percentage
  const calculateGrowth = (period1Value: number, period2Value: number) => {
    if (period1Value === 0) return 0;
    return ((period2Value - period1Value) / period1Value) * 100;
  };

  // Debug logging for CAPEX issue
  React.useEffect(() => {
    if (metrics) {
      console.log("Dashboard Metrics Debug:", {
        totalCost: metrics.totalCost,
        totalOpex: metrics.totalOpex,
        totalCapex: metrics.totalCapex,
        glAccountCount: metrics.costByGLAccount?.length,
        sampleExpenses: metrics.topExpenses?.slice(0, 3).map((e: any) => ({
          glAccount: e.glAccountNo,
          opexCapex: e.opexCapex,
          amount: e.totalIncurredCost,
        })),
      });
    }
  }, [metrics]);

  // Debug logging for data grid
  React.useEffect(() => {
    console.log('[Dashboard] Component state:', {
      isLoading,
      hasError: !!error,
      hasMetrics: !!metrics,
      hasTopExpenses: !!metrics?.topExpenses,
      topExpensesLength: metrics?.topExpenses?.length || 0,
      firstExpense: metrics?.topExpenses?.[0]
    });
  }, [isLoading, error, metrics]);

  // Get all GL Account data and prepare top 15 + Others
  const allGLAccounts = comparisonMode && secondPeriodMetrics
    ? secondPeriodMetrics.costByGLAccount || []
    : metrics?.costByGLAccount || [];
  const totalAllGLCost = allGLAccounts.reduce(
    (sum, item) => sum + item.totalCost,
    0,
  );

  // Get top 15 GL accounts
  const top15GLAccounts = allGLAccounts.slice(0, 15).map((item: any) => ({
    name: item.value,
    totalCost: item.totalCost,
  }));

  // Calculate "Others" category (all GL accounts beyond top 15)
  const othersTotal = allGLAccounts
    .slice(15)
    .reduce((sum, item) => sum + item.totalCost, 0);

  // Combine top 15 with "Others" category
  const costByGLAccount = [
    ...top15GLAccounts,
    ...(othersTotal > 0
      ? [
          {
            name: "Others",
            totalCost: othersTotal,
          },
        ]
      : []),
  ];

  // Log validation for percentage sum
  React.useEffect(() => {
    if (costByGLAccount.length > 0) {
      const percentageSum = costByGLAccount.reduce((sum, item) => {
        const percentage =
          totalAllGLCost > 0 ? (item.totalCost / totalAllGLCost) * 100 : 0;
        return sum + percentage;
      }, 0);
      console.log("GL Account Percentage Validation:", {
        totalGLAccounts: allGLAccounts.length,
        displayedCategories: costByGLAccount.length,
        totalCostAllGLs: totalAllGLCost,
        top15Cost: top15GLAccounts.reduce(
          (sum, item) => sum + item.totalCost,
          0,
        ),
        othersCost: othersTotal,
        sumOfPercentages: percentageSum.toFixed(2) + "%",
        validation: Math.abs(percentageSum - 100) < 0.01 ? "PASS ✓" : "FAIL ✗",
      });
    }
  }, [costByGLAccount, totalAllGLCost, allGLAccounts.length]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading dashboard data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">Error loading dashboard data</div>
      </div>
    );
  }

  const {
    totalCost,
    totalOpex,
    totalCapex,
    dmascoTotal,
    proceed3PLTotal,
    costByQuarter,
    costByWarehouse,
    costByCategory,
    topExpenses,
  } = metrics || {};

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Cost Dashboard</h1>
        <p className="text-gray-500 mt-1">Total Cost of Ownership Analytics</p>
      </div>

      {/* Filter Panel */}
      <FilterPanel onFiltersChange={setFilters} />

      {/* Comparison Mode Control Panel */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-semibold text-gray-900">Comparison Mode</h3>
            <button
              onClick={() => {
                setComparisonMode(!comparisonMode);
                if (!comparisonMode) {
                  // Initialize with default periods when enabling (Q2 and Q3 have data)
                  setFirstPeriod({ year: 2025, quarter: 'Q2' });
                  setSecondPeriod({ year: 2025, quarter: 'Q3' });
                }
              }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                comparisonMode ? 'bg-[#9e1f63]' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  comparisonMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className="text-sm text-gray-500">
              {comparisonMode ? 'Enabled' : 'Disabled'}
            </span>
          </div>

          {/* Period Selectors */}
          {comparisonMode && (
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Period 1:</label>
                <select
                  value={`${firstPeriod?.year}-${firstPeriod?.quarter}`}
                  onChange={(e) => {
                    const [year, quarter] = e.target.value.split('-');
                    setFirstPeriod({ year: parseInt(year), quarter });
                  }}
                  className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#9e1f63]"
                >
                  <option value="2025-Q1">Q1 2025</option>
                  <option value="2025-Q2">Q2 2025</option>
                  <option value="2025-Q3">Q3 2025</option>
                  <option value="2025-Q4">Q4 2025</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Period 2:</label>
                <select
                  value={`${secondPeriod?.year}-${secondPeriod?.quarter}`}
                  onChange={(e) => {
                    const [year, quarter] = e.target.value.split('-');
                    setSecondPeriod({ year: parseInt(year), quarter });
                  }}
                  className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#9e1f63]"
                >
                  <option value="2025-Q1">Q1 2025</option>
                  <option value="2025-Q2">Q2 2025</option>
                  <option value="2025-Q3">Q3 2025</option>
                  <option value="2025-Q4">Q4 2025</option>
                </select>
              </div>

              {/* Growth Indicator */}
              {firstPeriodMetrics && secondPeriodMetrics && (
                <div className="flex items-center space-x-2 ml-6 px-4 py-2 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Overall Growth:</span>
                  <span className={`text-sm font-bold ${
                    calculateGrowth(firstPeriodMetrics.totalCost, secondPeriodMetrics.totalCost) >= 0
                      ? 'text-red-600'
                      : 'text-green-600'
                  }`}>
                    {calculateGrowth(firstPeriodMetrics.totalCost, secondPeriodMetrics.totalCost) >= 0 ? '+' : ''}
                    {calculateGrowth(firstPeriodMetrics.totalCost, secondPeriodMetrics.totalCost).toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          title="Total Cost"
          value={formatCurrency(
            comparisonMode && secondPeriodMetrics
              ? secondPeriodMetrics.totalCost || 0
              : totalCost || 0
          )}
          icon={<BarChart3 className="h-5 w-5" />}
          color="primary"
          trend={comparisonMode && firstPeriodMetrics && secondPeriodMetrics ? {
            value: calculateGrowth(firstPeriodMetrics.totalCost, secondPeriodMetrics.totalCost),
            isPositive: calculateGrowth(firstPeriodMetrics.totalCost, secondPeriodMetrics.totalCost) < 0
          } : null}
        />
        <MetricCard
          title="OPEX"
          value={formatCurrency(
            comparisonMode && secondPeriodMetrics
              ? secondPeriodMetrics.totalOpex || 0
              : totalOpex || 0
          )}
          icon={<TrendingUp className="h-5 w-5" />}
          color="blue"
          subtitle={comparisonMode && firstPeriodMetrics && secondPeriodMetrics ? (
            <span className={`font-semibold ${
              calculateGrowth(firstPeriodMetrics.totalOpex, secondPeriodMetrics.totalOpex) >= 0
                ? 'text-red-600'
                : 'text-green-600'
            }`}>
              {calculateGrowth(firstPeriodMetrics.totalOpex, secondPeriodMetrics.totalOpex) >= 0 ? '↑' : '↓'}
              {Math.abs(calculateGrowth(firstPeriodMetrics.totalOpex, secondPeriodMetrics.totalOpex)).toFixed(1)}%
              {' vs Period 1'}
            </span>
          ) : `${formatPercentage((totalOpex || 0) / (totalCost || 1))} of total`}
        />
        <MetricCard
          title="CAPEX"
          value={formatCurrency(
            comparisonMode && secondPeriodMetrics
              ? secondPeriodMetrics.totalCapex || 0
              : totalCapex || 0
          )}
          icon={<TrendingDown className="h-5 w-5" />}
          color="accent"
          subtitle={comparisonMode && firstPeriodMetrics && secondPeriodMetrics ? (
            <span className={`font-semibold ${
              calculateGrowth(firstPeriodMetrics.totalCapex, secondPeriodMetrics.totalCapex) >= 0
                ? 'text-red-600'
                : 'text-green-600'
            }`}>
              {calculateGrowth(firstPeriodMetrics.totalCapex, secondPeriodMetrics.totalCapex) >= 0 ? '↑' : '↓'}
              {Math.abs(calculateGrowth(firstPeriodMetrics.totalCapex, secondPeriodMetrics.totalCapex)).toFixed(1)}%
              {' vs Period 1'}
            </span>
          ) : `${formatPercentage((totalCapex || 0) / (totalCost || 1))} of total`}
        />
        <MetricCard
          title="DMASCO Operations"
          value={formatCurrency(
            comparisonMode && secondPeriodMetrics
              ? secondPeriodMetrics.dmascoTotal || 0
              : dmascoTotal || 0
          )}
          icon={<Building2 className="h-5 w-5" />}
          color="secondary"
          subtitle={comparisonMode && firstPeriodMetrics && secondPeriodMetrics ? (
            <span className={`font-semibold ${
              calculateGrowth(firstPeriodMetrics.dmascoTotal, secondPeriodMetrics.dmascoTotal) >= 0
                ? 'text-red-600'
                : 'text-green-600'
            }`}>
              {calculateGrowth(firstPeriodMetrics.dmascoTotal, secondPeriodMetrics.dmascoTotal) >= 0 ? '↑' : '↓'}
              {Math.abs(calculateGrowth(firstPeriodMetrics.dmascoTotal, secondPeriodMetrics.dmascoTotal)).toFixed(1)}%
              {' vs Period 1'}
            </span>
          ) : "Pharmacy, Dist, LM"}
        />
        <MetricCard
          title="PROCEED 3PL"
          value={formatCurrency(
            comparisonMode && secondPeriodMetrics
              ? secondPeriodMetrics.proceed3PLTotal || 0
              : proceed3PLTotal || 0
          )}
          icon={<Truck className="h-5 w-5" />}
          color="primary"
          subtitle={comparisonMode && firstPeriodMetrics && secondPeriodMetrics ? (
            <span className={`font-semibold ${
              calculateGrowth(firstPeriodMetrics.proceed3PLTotal, secondPeriodMetrics.proceed3PLTotal) >= 0
                ? 'text-red-600'
                : 'text-green-600'
            }`}>
              {calculateGrowth(firstPeriodMetrics.proceed3PLTotal, secondPeriodMetrics.proceed3PLTotal) >= 0 ? '↑' : '↓'}
              {Math.abs(calculateGrowth(firstPeriodMetrics.proceed3PLTotal, secondPeriodMetrics.proceed3PLTotal)).toFixed(1)}%
              {' vs Period 1'}
            </span>
          ) : "WH & Transportation"}
        />
      </div>

      {/* Full-Width Charts */}
      <div className="grid grid-cols-1 gap-6">
        {/* Cost by Quarter - Full Width */}
        <div className="chart-container">
          <h3 className="text-lg font-semibold mb-4">
            Cost Trend by Quarter
            {comparisonMode && firstPeriodMetrics && secondPeriodMetrics && (
              <span className="text-sm font-normal ml-3 text-gray-600">
                (Comparing {firstPeriod?.quarter} vs {secondPeriod?.quarter})
              </span>
            )}
          </h3>
          <ResponsiveContainer width="100%" height={450}>
            <BarChart
              data={comparisonMode && firstPeriodMetrics && secondPeriodMetrics ?
                // Comparison mode: Show each quarter with comparison data
                costByQuarter?.map(q => {
                  const period1Data = firstPeriodMetrics.costByQuarter?.find((p1q: any) => p1q.value === q.value);
                  const period2Data = secondPeriodMetrics.costByQuarter?.find((p2q: any) => p2q.value === q.value);
                  const period1Cost = period1Data?.totalCost || 0;
                  const period2Cost = period2Data?.totalCost || 0;

                  return {
                    ...q,
                    period1Cost,
                    period2Cost,
                    growth: calculateGrowth(period1Cost, period2Cost) // Show growth for ALL quarters
                  };
                }) :
                // Normal mode
                costByQuarter
              }
              margin={{ top: 50, right: 30, left: 20, bottom: 80 }}
            >
              <CartesianGrid {...CHART_STYLES.grid} />
              <XAxis
                dataKey="value"
                tick={{
                  ...CHART_STYLES.tick,
                  fontWeight: 600
                }}
                angle={0}
                textAnchor="middle"
                height={60}
              />
              <YAxis
                tickFormatter={(value) => formatCurrency(value, true)}
                tick={{
                  ...CHART_STYLES.tick,
                  fontWeight: 500
                }}
                width={80}
              />
              <Tooltip
                formatter={(value) => formatCurrency(value as number)}
                contentStyle={CHART_STYLES.tooltip.contentStyle}
                labelStyle={CHART_STYLES.tooltip.labelStyle}
              />
              {comparisonMode && firstPeriodMetrics && secondPeriodMetrics ? (
                <>
                  <Legend
                    wrapperStyle={CHART_STYLES.legend.wrapperStyle}
                    iconSize={CHART_STYLES.legend.iconSize}
                  />
                  <Bar
                    dataKey="period1Cost"
                    name={`Period 1 (${firstPeriod?.quarter})`}
                    fill={PROCEED_COLORS.secondary}
                  >
                    <LabelList
                      position="top"
                      content={(props) => renderBarLabel(props, { showPercentage: false })}
                    />
                  </Bar>
                  <Bar
                    dataKey="period2Cost"
                    name={`Period 2 (${secondPeriod?.quarter})`}
                    fill={PROCEED_COLORS.primary}
                  >
                    <LabelList
                      position="top"
                      content={(props) => {
                        const { x, y, width, height, value, index } = props;
                        const dataPoint = props.payload;
                        if (!value || value === 0) return null;

                        const growth = dataPoint?.growth;

                        return (
                          <g>
                            <text
                              x={x + width / 2}
                              y={y - 15}
                              fill={LABEL_CONFIG.colors.value}
                              textAnchor="middle"
                              stroke="white"
                              strokeWidth={3}
                              paintOrder="stroke"
                              style={{
                                fontWeight: 'bold',
                                fontSize: LABEL_CONFIG.fontSize.value,
                                fontFamily: LABEL_CONFIG.fonts.value
                              }}
                            >
                              {formatCurrency(value, true)}
                            </text>
                            {growth !== null && growth !== undefined && (
                              <text
                                x={x + width / 2}
                                y={y - 2}
                                fill={growth >= 0 ? '#e05e3d' : '#10b981'}
                                textAnchor="middle"
                                stroke="white"
                                strokeWidth={2}
                                paintOrder="stroke"
                                style={{
                                  fontSize: 10,
                                  fontWeight: 600,
                                  fontFamily: LABEL_CONFIG.fonts.percentage
                                }}
                              >
                                {growth >= 0 ? '↑' : '↓'}{Math.abs(growth).toFixed(1)}%
                              </text>
                            )}
                          </g>
                        );
                      }}
                    />
                  </Bar>

                  {/* Overall growth percentage display */}
                  {firstPeriod && secondPeriod && (
                    <text
                      x="50%"
                      y={420}
                      textAnchor="middle"
                      style={{
                        fontSize: 14,
                        fontWeight: 'bold',
                        fill: PROCEED_COLORS.primary
                      }}
                    >
                      Overall Growth: {calculateGrowth(
                        firstPeriodMetrics.totalCost,
                        secondPeriodMetrics.totalCost
                      ) >= 0 ? '↑' : '↓'}
                      {Math.abs(calculateGrowth(
                        firstPeriodMetrics.totalCost,
                        secondPeriodMetrics.totalCost
                      )).toFixed(1)}%
                    </text>
                  )}
                </>
              ) : (
                <Bar
                  dataKey="totalCost"
                  name="Total Cost"
                  fill={PROCEED_COLORS.primary}
                >
                  <LabelList
                    position="top"
                    content={(props) => {
                      const total = costByQuarter?.reduce((sum, item) => sum + (item.totalCost || 0), 0) || 0;
                      return renderBarLabel(props, {
                        showPercentage: true,
                        percentageTotal: total
                      });
                    }}
                  />
                </Bar>
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* OPEX vs CAPEX Pie Chart */}
        <div className="chart-container">
          <h3 className="text-lg font-semibold mb-4">
            OPEX vs CAPEX Breakdown
            {comparisonMode && (
              <span className="text-sm font-normal ml-3 text-gray-600">
                (Comparison: {firstPeriod?.quarter} vs {secondPeriod?.quarter})
              </span>
            )}
          </h3>
          {comparisonMode && firstPeriodMetrics && secondPeriodMetrics ? (
            <div className="grid grid-cols-2 gap-4">
              {/* Period 1 Pie */}
              <div>
                <h4 className="text-center text-sm font-semibold mb-2">Period 1: {firstPeriod?.quarter}</h4>
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: "OPEX", value: firstPeriodMetrics.totalOpex || 0 },
                        { name: "CAPEX", value: firstPeriodMetrics.totalCapex || 0 },
                      ].filter((item) => item.value > 0)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(props) => {
                        const { cx, cy, midAngle, innerRadius, outerRadius, percent, value } = props;
                        const RADIAN = Math.PI / 180;
                        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                        const y = cy + radius * Math.sin(-midAngle * RADIAN);

                        return (
                          <g>
                            <text
                              x={x}
                              y={y - 8}
                              fill="white"
                              textAnchor="middle"
                              dominantBaseline="central"
                              style={{ fontWeight: 'bold', fontSize: 14 }}
                            >
                              {formatCurrency(value, true).replace('SAR ', '')}
                            </text>
                            <text
                              x={x}
                              y={y + 8}
                              fill="white"
                              textAnchor="middle"
                              dominantBaseline="central"
                              style={{ fontWeight: 'bold', fontSize: 12 }}
                            >
                              ({(percent * 100).toFixed(1)}%)
                            </text>
                          </g>
                        );
                      }}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[
                        { name: "OPEX", value: firstPeriodMetrics.totalOpex || 0 },
                        { name: "CAPEX", value: firstPeriodMetrics.totalCapex || 0 },
                      ].filter((item) => item.value > 0)
                        .map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? PROCEED_COLORS.blue : PROCEED_COLORS.accent} />
                        ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Period 2 Pie */}
              <div>
                <h4 className="text-center text-sm font-semibold mb-2">
                  Period 2: {secondPeriod?.quarter}
                  <span className={`ml-2 ${
                    calculateGrowth(firstPeriodMetrics.totalOpex + firstPeriodMetrics.totalCapex,
                                   secondPeriodMetrics.totalOpex + secondPeriodMetrics.totalCapex) >= 0
                      ? 'text-red-600' : 'text-green-600'
                  }`}>
                    ({calculateGrowth(firstPeriodMetrics.totalOpex + firstPeriodMetrics.totalCapex,
                                    secondPeriodMetrics.totalOpex + secondPeriodMetrics.totalCapex) >= 0 ? '↑' : '↓'}
                    {Math.abs(calculateGrowth(firstPeriodMetrics.totalOpex + firstPeriodMetrics.totalCapex,
                                            secondPeriodMetrics.totalOpex + secondPeriodMetrics.totalCapex)).toFixed(1)}%)
                  </span>
                </h4>
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: "OPEX", value: secondPeriodMetrics.totalOpex || 0 },
                        { name: "CAPEX", value: secondPeriodMetrics.totalCapex || 0 },
                      ].filter((item) => item.value > 0)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(props) => {
                        const { cx, cy, midAngle, innerRadius, outerRadius, percent, value } = props;
                        const RADIAN = Math.PI / 180;
                        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                        const y = cy + radius * Math.sin(-midAngle * RADIAN);

                        return (
                          <g>
                            <text
                              x={x}
                              y={y - 8}
                              fill="white"
                              textAnchor="middle"
                              dominantBaseline="central"
                              style={{ fontWeight: 'bold', fontSize: 14 }}
                            >
                              {formatCurrency(value, true).replace('SAR ', '')}
                            </text>
                            <text
                              x={x}
                              y={y + 8}
                              fill="white"
                              textAnchor="middle"
                              dominantBaseline="central"
                              style={{ fontWeight: 'bold', fontSize: 12 }}
                            >
                              ({(percent * 100).toFixed(1)}%)
                            </text>
                          </g>
                        );
                      }}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[
                        { name: "OPEX", value: secondPeriodMetrics.totalOpex || 0 },
                        { name: "CAPEX", value: secondPeriodMetrics.totalCapex || 0 },
                      ].filter((item) => item.value > 0)
                        .map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? PROCEED_COLORS.blue : PROCEED_COLORS.accent} />
                        ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={[
                  {
                    name: "OPEX",
                    value: comparisonMode && secondPeriodMetrics
                      ? secondPeriodMetrics.totalOpex || 0
                      : totalOpex || 0
                  },
                  {
                    name: "CAPEX",
                    value: comparisonMode && secondPeriodMetrics
                      ? secondPeriodMetrics.totalCapex || 0
                      : totalCapex || 0
                  },
                ].filter((item) => item.value > 0)}
                cx="50%"
                cy="50%"
                labelLine={{ stroke: "#424046", strokeWidth: 2 }}
                label={(props) => {
                  const {
                    cx,
                    cy,
                    midAngle,
                    innerRadius,
                    outerRadius,
                    percent,
                    value,
                    index,
                    name,
                  } = props;
                  const RADIAN = Math.PI / 180;
                  const radius = outerRadius + 30;
                  const x = cx + radius * Math.cos(-midAngle * RADIAN);
                  const y = cy + radius * Math.sin(-midAngle * RADIAN);

                  return (
                    <text
                      x={x}
                      y={y}
                      fill={
                        index === 0
                          ? PROCEED_COLORS.blue
                          : PROCEED_COLORS.accent
                      }
                      textAnchor={x > cx ? "start" : "end"}
                      dominantBaseline="central"
                      style={{
                        fontWeight: "bold",
                        fontSize: 15,
                        fontFamily: 'Montserrat, sans-serif'
                      }}
                    >
                      {name}
                    </text>
                  );
                }}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {[
                  {
                    name: "OPEX",
                    value: comparisonMode && secondPeriodMetrics
                      ? secondPeriodMetrics.totalOpex || 0
                      : totalOpex || 0
                  },
                  {
                    name: "CAPEX",
                    value: comparisonMode && secondPeriodMetrics
                      ? secondPeriodMetrics.totalCapex || 0
                      : totalCapex || 0
                  },
                ]
                  .filter((item) => item.value > 0)
                  .map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        index === 0
                          ? PROCEED_COLORS.blue
                          : PROCEED_COLORS.accent
                      }
                    />
                  ))}
              </Pie>
              <Pie
                data={[
                  {
                    name: "OPEX",
                    value: comparisonMode && secondPeriodMetrics
                      ? secondPeriodMetrics.totalOpex || 0
                      : totalOpex || 0,
                    label: `${formatCurrency(
                      comparisonMode && secondPeriodMetrics
                        ? secondPeriodMetrics.totalOpex || 0
                        : totalOpex || 0,
                      true
                    ).replace("SAR ", "")}`,
                  },
                  {
                    name: "CAPEX",
                    value: comparisonMode && secondPeriodMetrics
                      ? secondPeriodMetrics.totalCapex || 0
                      : totalCapex || 0,
                    label: `${formatCurrency(
                      comparisonMode && secondPeriodMetrics
                        ? secondPeriodMetrics.totalCapex || 0
                        : totalCapex || 0,
                      true
                    ).replace("SAR ", "")}`,
                  },
                ].filter((item) => item.value > 0)}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(props) => {
                  const {
                    cx,
                    cy,
                    midAngle,
                    innerRadius,
                    outerRadius,
                    percent,
                    value,
                  } = props;
                  const RADIAN = Math.PI / 180;
                  const radius =
                    innerRadius + (outerRadius - innerRadius) * 0.5;
                  const x = cx + radius * Math.cos(-midAngle * RADIAN);
                  const y = cy + radius * Math.sin(-midAngle * RADIAN);

                  const total = (totalOpex || 0) + (totalCapex || 0);
                  const percentage =
                    total > 0 ? ((value / total) * 100).toFixed(1) : "0";
                  const formattedValue = formatCurrency(value, true).replace(
                    "SAR ",
                    "",
                  );

                  return (
                    <g>
                      <text
                        x={x}
                        y={y - 8}
                        fill="white"
                        textAnchor="middle"
                        dominantBaseline="central"
                        style={{ fontWeight: "bold", fontSize: 14 }}
                      >
                        {formattedValue}
                      </text>
                      <text
                        x={x}
                        y={y + 8}
                        fill="white"
                        textAnchor="middle"
                        dominantBaseline="central"
                        style={{ fontWeight: "bold", fontSize: 12 }}
                      >
                        {`${percentage}%`}
                      </text>
                    </g>
                  );
                }}
                innerRadius={0}
                outerRadius={100}
                fill="transparent"
                dataKey="value"
                isAnimationActive={false}
              />
              <Tooltip
                formatter={(value) => formatCurrency(value as number)}
                contentStyle={CHART_STYLES.tooltip.contentStyle}
                labelStyle={CHART_STYLES.tooltip.labelStyle}
              />
              <Legend
                wrapperStyle={{
                  ...CHART_STYLES.legend.wrapperStyle,
                  textAlign: "center",
                  width: "100%",
                }}
                formatter={(value, entry) =>
                  `${value}: ${formatCurrency(entry.payload.value, true)}`
                }
                align="center"
                verticalAlign="bottom"
              />
            </PieChart>
          </ResponsiveContainer>
          )}
        </div>

        {/* Warehouse vs Transportation Pie Chart */}
        <div className="chart-container">
          <h3 className="text-lg font-semibold mb-4">
            Warehouse vs Transportation Cost
            {comparisonMode && (
              <span className="text-sm font-normal ml-3 text-gray-600">
                (Comparison: {firstPeriod?.quarter} vs {secondPeriod?.quarter})
              </span>
            )}
          </h3>
          {comparisonMode && firstPeriodMetrics && secondPeriodMetrics ? (
            <div className="grid grid-cols-2 gap-4">
              {/* Period 1 Pie */}
              <div>
                <h4 className="text-center text-sm font-semibold mb-2">Period 1: {firstPeriod?.quarter}</h4>
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={(() => {
                        const warehouseTotal = firstPeriodMetrics.costByQuarter?.reduce(
                          (sum: number, q: any) => sum + (q.warehouseCost || 0) + (q.proceed3PLWHCost || 0), 0) || 0;
                        const transportationTotal = firstPeriodMetrics.costByQuarter?.reduce(
                          (sum: number, q: any) => sum + (q.transportationCost || 0) + (q.proceed3PLTRSCost || 0), 0) || 0;
                        return [
                          { name: "Warehouse", value: warehouseTotal },
                          { name: "Transportation", value: transportationTotal },
                        ].filter((item) => item.value > 0);
                      })()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(props) => {
                        const { cx, cy, midAngle, innerRadius, outerRadius, percent, value } = props;
                        const RADIAN = Math.PI / 180;
                        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                        const y = cy + radius * Math.sin(-midAngle * RADIAN);
                        return (
                          <g>
                            <text x={x} y={y - 8} fill="white" textAnchor="middle" dominantBaseline="central"
                                  style={{ fontWeight: 'bold', fontSize: 14 }}>
                              {formatCurrency(value, true).replace('SAR ', '')}
                            </text>
                            <text x={x} y={y + 8} fill="white" textAnchor="middle" dominantBaseline="central"
                                  style={{ fontWeight: 'bold', fontSize: 12 }}>
                              ({(percent * 100).toFixed(1)}%)
                            </text>
                          </g>
                        );
                      }}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {(() => {
                        const warehouseTotal = firstPeriodMetrics.costByQuarter?.reduce(
                          (sum: number, q: any) => sum + (q.warehouseCost || 0) + (q.proceed3PLWHCost || 0), 0) || 0;
                        const transportationTotal = firstPeriodMetrics.costByQuarter?.reduce(
                          (sum: number, q: any) => sum + (q.transportationCost || 0) + (q.proceed3PLTRSCost || 0), 0) || 0;
                        return [
                          { name: "Warehouse", value: warehouseTotal },
                          { name: "Transportation", value: transportationTotal },
                        ];
                      })().filter((item) => item.value > 0)
                        .map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? PROCEED_COLORS.primary : PROCEED_COLORS.secondary} />
                        ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Period 2 Pie */}
              <div>
                <h4 className="text-center text-sm font-semibold mb-2">
                  Period 2: {secondPeriod?.quarter}
                  <span className={`ml-2 ${(() => {
                    const p1Total = (firstPeriodMetrics.costByQuarter?.reduce(
                      (sum: number, q: any) => sum + (q.warehouseCost || 0) + (q.proceed3PLWHCost || 0) +
                      (q.transportationCost || 0) + (q.proceed3PLTRSCost || 0), 0) || 0);
                    const p2Total = (secondPeriodMetrics.costByQuarter?.reduce(
                      (sum: number, q: any) => sum + (q.warehouseCost || 0) + (q.proceed3PLWHCost || 0) +
                      (q.transportationCost || 0) + (q.proceed3PLTRSCost || 0), 0) || 0);
                    return calculateGrowth(p1Total, p2Total) >= 0 ? 'text-red-600' : 'text-green-600';
                  })()}`}>
                    ({(() => {
                      const p1Total = (firstPeriodMetrics.costByQuarter?.reduce(
                        (sum: number, q: any) => sum + (q.warehouseCost || 0) + (q.proceed3PLWHCost || 0) +
                        (q.transportationCost || 0) + (q.proceed3PLTRSCost || 0), 0) || 0);
                      const p2Total = (secondPeriodMetrics.costByQuarter?.reduce(
                        (sum: number, q: any) => sum + (q.warehouseCost || 0) + (q.proceed3PLWHCost || 0) +
                        (q.transportationCost || 0) + (q.proceed3PLTRSCost || 0), 0) || 0);
                      const growth = calculateGrowth(p1Total, p2Total);
                      return (growth >= 0 ? '↑' : '↓') + Math.abs(growth).toFixed(1) + '%';
                    })()})
                  </span>
                </h4>
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={(() => {
                        const warehouseTotal = secondPeriodMetrics.costByQuarter?.reduce(
                          (sum: number, q: any) => sum + (q.warehouseCost || 0) + (q.proceed3PLWHCost || 0), 0) || 0;
                        const transportationTotal = secondPeriodMetrics.costByQuarter?.reduce(
                          (sum: number, q: any) => sum + (q.transportationCost || 0) + (q.proceed3PLTRSCost || 0), 0) || 0;
                        return [
                          { name: "Warehouse", value: warehouseTotal },
                          { name: "Transportation", value: transportationTotal },
                        ].filter((item) => item.value > 0);
                      })()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(props) => {
                        const { cx, cy, midAngle, innerRadius, outerRadius, percent, value } = props;
                        const RADIAN = Math.PI / 180;
                        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                        const y = cy + radius * Math.sin(-midAngle * RADIAN);
                        return (
                          <g>
                            <text x={x} y={y - 8} fill="white" textAnchor="middle" dominantBaseline="central"
                                  style={{ fontWeight: 'bold', fontSize: 14 }}>
                              {formatCurrency(value, true).replace('SAR ', '')}
                            </text>
                            <text x={x} y={y + 8} fill="white" textAnchor="middle" dominantBaseline="central"
                                  style={{ fontWeight: 'bold', fontSize: 12 }}>
                              ({(percent * 100).toFixed(1)}%)
                            </text>
                          </g>
                        );
                      }}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {(() => {
                        const warehouseTotal = secondPeriodMetrics.costByQuarter?.reduce(
                          (sum: number, q: any) => sum + (q.warehouseCost || 0) + (q.proceed3PLWHCost || 0), 0) || 0;
                        const transportationTotal = secondPeriodMetrics.costByQuarter?.reduce(
                          (sum: number, q: any) => sum + (q.transportationCost || 0) + (q.proceed3PLTRSCost || 0), 0) || 0;
                        return [
                          { name: "Warehouse", value: warehouseTotal },
                          { name: "Transportation", value: transportationTotal },
                        ];
                      })().filter((item) => item.value > 0)
                        .map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? PROCEED_COLORS.primary : PROCEED_COLORS.secondary} />
                        ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={(() => {
                  // Use comparison mode data if enabled
                  const dataSource = comparisonMode && secondPeriodMetrics
                    ? secondPeriodMetrics.costByQuarter
                    : costByQuarter;

                  // Aggregate warehouse and transportation costs from all quarters
                  const warehouseTotal =
                    dataSource?.reduce(
                      (sum, q) =>
                        sum +
                        (q.warehouseCost || 0) +
                        (q.proceed3PLWHCost || 0),
                      0,
                    ) || 0;
                  const transportationTotal =
                    dataSource?.reduce(
                      (sum, q) =>
                        sum +
                        (q.transportationCost || 0) +
                        (q.proceed3PLTRSCost || 0),
                      0,
                    ) || 0;
                  return [
                    { name: "Warehouse", value: warehouseTotal },
                    { name: "Transportation", value: transportationTotal },
                  ].filter((item) => item.value > 0);
                })()}
                cx="50%"
                cy="50%"
                labelLine={{ stroke: "#424046", strokeWidth: 2 }}
                label={(props) => {
                  const {
                    cx,
                    cy,
                    midAngle,
                    innerRadius,
                    outerRadius,
                    percent,
                    value,
                    index,
                    name,
                  } = props;
                  const RADIAN = Math.PI / 180;
                  const radius = outerRadius + 30;
                  const x = cx + radius * Math.cos(-midAngle * RADIAN);
                  const y = cy + radius * Math.sin(-midAngle * RADIAN);

                  return (
                    <text
                      x={x}
                      y={y}
                      fill={
                        index === 0
                          ? PROCEED_COLORS.primary
                          : PROCEED_COLORS.secondary
                      }
                      textAnchor={x > cx ? "start" : "end"}
                      dominantBaseline="central"
                      style={{
                        fontWeight: "bold",
                        fontSize: 15,
                        fontFamily: 'Montserrat, sans-serif'
                      }}
                    >
                      {name}
                    </text>
                  );
                }}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {(() => {
                  // Use comparison mode data if enabled
                  const dataSource = comparisonMode && secondPeriodMetrics
                    ? secondPeriodMetrics.costByQuarter
                    : costByQuarter;

                  const warehouseTotal =
                    dataSource?.reduce(
                      (sum, q) =>
                        sum +
                        (q.warehouseCost || 0) +
                        (q.proceed3PLWHCost || 0),
                      0,
                    ) || 0;
                  const transportationTotal =
                    dataSource?.reduce(
                      (sum, q) =>
                        sum +
                        (q.transportationCost || 0) +
                        (q.proceed3PLTRSCost || 0),
                      0,
                    ) || 0;
                  return [
                    { name: "Warehouse", value: warehouseTotal },
                    { name: "Transportation", value: transportationTotal },
                  ]
                    .filter((item) => item.value > 0)
                    .map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          index === 0
                            ? PROCEED_COLORS.primary
                            : PROCEED_COLORS.secondary
                        }
                      />
                    ));
                })()}
              </Pie>
              <Pie
                data={(() => {
                  // Use comparison mode data if enabled
                  const dataSource = comparisonMode && secondPeriodMetrics
                    ? secondPeriodMetrics.costByQuarter
                    : costByQuarter;

                  const warehouseTotal =
                    dataSource?.reduce(
                      (sum, q) =>
                        sum +
                        (q.warehouseCost || 0) +
                        (q.proceed3PLWHCost || 0),
                      0,
                    ) || 0;
                  const transportationTotal =
                    dataSource?.reduce(
                      (sum, q) =>
                        sum +
                        (q.transportationCost || 0) +
                        (q.proceed3PLTRSCost || 0),
                      0,
                    ) || 0;
                  return [
                    { name: "Warehouse", value: warehouseTotal },
                    { name: "Transportation", value: transportationTotal },
                  ].filter((item) => item.value > 0);
                })()}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(props) => {
                  const {
                    cx,
                    cy,
                    midAngle,
                    innerRadius,
                    outerRadius,
                    percent,
                    value,
                  } = props;
                  const RADIAN = Math.PI / 180;
                  const radius =
                    innerRadius + (outerRadius - innerRadius) * 0.5;
                  const x = cx + radius * Math.cos(-midAngle * RADIAN);
                  const y = cy + radius * Math.sin(-midAngle * RADIAN);

                  const warehouseTotal =
                    costByQuarter?.reduce(
                      (sum, q) =>
                        sum +
                        (q.warehouseCost || 0) +
                        (q.proceed3PLWHCost || 0),
                      0,
                    ) || 0;
                  const transportationTotal =
                    costByQuarter?.reduce(
                      (sum, q) =>
                        sum +
                        (q.transportationCost || 0) +
                        (q.proceed3PLTRSCost || 0),
                      0,
                    ) || 0;
                  const total = warehouseTotal + transportationTotal;
                  const percentage =
                    total > 0 ? ((value / total) * 100).toFixed(1) : "0";
                  const formattedValue = formatCurrency(value, true).replace(
                    "SAR ",
                    "",
                  );

                  return (
                    <g>
                      <text
                        x={x}
                        y={y - 8}
                        fill="white"
                        textAnchor="middle"
                        dominantBaseline="central"
                        style={{ fontWeight: "bold", fontSize: 14 }}
                      >
                        {formattedValue}
                      </text>
                      <text
                        x={x}
                        y={y + 8}
                        fill="white"
                        textAnchor="middle"
                        dominantBaseline="central"
                        style={{ fontWeight: "bold", fontSize: 12 }}
                      >
                        {`${percentage}%`}
                      </text>
                    </g>
                  );
                }}
                innerRadius={0}
                outerRadius={100}
                fill="transparent"
                dataKey="value"
                isAnimationActive={false}
              />
              <Tooltip
                formatter={(value) => formatCurrency(value as number)}
                contentStyle={CHART_STYLES.tooltip.contentStyle}
                labelStyle={CHART_STYLES.tooltip.labelStyle}
              />
              <Legend
                wrapperStyle={{
                  ...CHART_STYLES.legend.wrapperStyle,
                  textAlign: "center",
                  width: "100%",
                }}
                formatter={(value, entry) =>
                  `${value}: ${formatCurrency(entry.payload.value, true)}`
                }
                align="center"
                verticalAlign="bottom"
              />
            </PieChart>
          </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Damasco vs PROCEED 3BL Comparison - Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="chart-container">
          <h3 className="text-lg font-semibold mb-4">
            Damasco Operations vs PROCEED 3PL
            {comparisonMode && (
              <span className="text-sm font-normal ml-3 text-gray-600">
                (Comparison: {firstPeriod?.quarter} vs {secondPeriod?.quarter})
              </span>
            )}
          </h3>
          <ResponsiveContainer width="100%" height={350}>
            <ComposedChart
              data={comparisonMode && firstPeriodMetrics && secondPeriodMetrics ?
                // Comparison mode: side-by-side columns for P1 and P2
                (() => {
                  const comparisonData = [
                    {
                      name: "Damasco Operations",
                      period1: firstPeriodMetrics.dmascoTotal || 0,
                      period2: secondPeriodMetrics.dmascoTotal || 0,
                      growth: calculateGrowth(firstPeriodMetrics.dmascoTotal, secondPeriodMetrics.dmascoTotal)
                    },
                    {
                      name: "PROCEED 3PL",
                      period1: firstPeriodMetrics.proceed3PLTotal || 0,
                      period2: secondPeriodMetrics.proceed3PLTotal || 0,
                      growth: calculateGrowth(firstPeriodMetrics.proceed3PLTotal, secondPeriodMetrics.proceed3PLTotal)
                    }
                  ];
                  return comparisonData;
                })() :
                // Normal mode
                (() => {
                  const dataSource = costByQuarter;

                const pharmaciesTotal =
                  dataSource?.reduce(
                    (sum, q) => sum + (q.pharmaciesCost || 0),
                    0,
                  ) || 0;
                const distributionTotal =
                  dataSource?.reduce(
                    (sum, q) => sum + (q.distributionCost || 0),
                    0,
                  ) || 0;
                const lastMileTotal =
                  dataSource?.reduce(
                    (sum, q) => sum + (q.lastMileCost || 0),
                    0,
                  ) || 0;
                const damascoTotal =
                  pharmaciesTotal + distributionTotal + lastMileTotal;

                const proceed3PLWHTotal =
                  dataSource?.reduce(
                    (sum, q) => sum + (q.proceed3PLWHCost || 0),
                    0,
                  ) || 0;
                const proceed3PLTRSTotal =
                  dataSource?.reduce(
                    (sum, q) => sum + (q.proceed3PLTRSCost || 0),
                    0,
                  ) || 0;
                const proceed3PLTotal = proceed3PLWHTotal + proceed3PLTRSTotal;

                return [
                  {
                    name: "Damasco Operations",
                    total: damascoTotal,
                    pharmacies: pharmaciesTotal,
                    distribution: distributionTotal,
                    lastMile: lastMileTotal,
                  },
                  {
                    name: "PROCEED 3PL",
                    total: proceed3PLTotal,
                    warehouse: proceed3PLWHTotal,
                    transportation: proceed3PLTRSTotal,
                  },
                ];
              })()}
              margin={{ top: 50, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid {...CHART_STYLES.grid} />
              <XAxis
                dataKey="name"
                tick={{
                  ...CHART_STYLES.tick,
                  fontSize: 13,
                  angle: 0,
                  textAnchor: "middle",
                  fontWeight: 600
                }}
                height={60}
              />
              <YAxis
                tickFormatter={(value) => formatCurrency(value, true)}
                tick={{
                  ...CHART_STYLES.tick,
                  fontWeight: 500
                }}
                width={85}
              />
              <Tooltip
                content={(props) => {
                  const { active, payload } = props;
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div
                        style={{
                          ...CHART_STYLES.tooltip.contentStyle,
                          padding: "10px",
                        }}
                      >
                        <p style={{ fontWeight: "bold", marginBottom: "5px" }}>
                          {data.name}
                        </p>
                        <p style={{ fontSize: "14px", marginBottom: "8px" }}>
                          Total: {formatCurrency(data.total)}
                        </p>
                        {data.name === "Damasco Operations" ? (
                          <>
                            <p style={{ fontSize: "12px" }}>
                              Pharmacies: {formatCurrency(data.pharmacies)}
                            </p>
                            <p style={{ fontSize: "12px" }}>
                              Distribution: {formatCurrency(data.distribution)}
                            </p>
                            <p style={{ fontSize: "12px" }}>
                              Last Mile: {formatCurrency(data.lastMile)}
                            </p>
                          </>
                        ) : (
                          <>
                            <p style={{ fontSize: "12px" }}>
                              Warehouse: {formatCurrency(data.warehouse)}
                            </p>
                            <p style={{ fontSize: "12px" }}>
                              Transportation:{" "}
                              {formatCurrency(data.transportation)}
                            </p>
                          </>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              {comparisonMode && firstPeriodMetrics && secondPeriodMetrics ? (
                <>
                  <Legend wrapperStyle={CHART_STYLES.legend.wrapperStyle} />
                  <Bar dataKey="period1" name={`Period 1 (${firstPeriod?.quarter})`} fill={PROCEED_COLORS.secondary}>
                    <LabelList
                      position="top"
                      content={(props) => {
                        const { x, y, width, value } = props;
                        if (!value || value === 0) return null;

                        return (
                          <text
                            x={x + width / 2}
                            y={y - 8}
                            fill="#1a1a1a"
                            textAnchor="middle"
                            stroke="white"
                            strokeWidth={3}
                            paintOrder="stroke"
                            style={{
                              fontWeight: 700,
                              fontSize: 12,
                              fontFamily: LABEL_CONFIG.fonts.value,
                              letterSpacing: '-0.02em'
                            }}
                          >
                            {formatCurrency(value, true)}
                          </text>
                        );
                      }}
                    />
                  </Bar>
                  <Bar dataKey="period2" name={`Period 2 (${secondPeriod?.quarter})`} fill={PROCEED_COLORS.primary}>
                    <LabelList
                      position="top"
                      content={(props) => {
                        const { x, y, width, value, index } = props;
                        if (!value || value === 0) return null;

                        // Get the full data object using the index
                        const chartData = [
                          {
                            name: "Damasco Operations",
                            period1: firstPeriodMetrics.dmascoTotal || 0,
                            period2: secondPeriodMetrics.dmascoTotal || 0,
                            growth: calculateGrowth(firstPeriodMetrics.dmascoTotal, secondPeriodMetrics.dmascoTotal)
                          },
                          {
                            name: "PROCEED 3PL",
                            period1: firstPeriodMetrics.proceed3PLTotal || 0,
                            period2: secondPeriodMetrics.proceed3PLTotal || 0,
                            growth: calculateGrowth(firstPeriodMetrics.proceed3PLTotal, secondPeriodMetrics.proceed3PLTotal)
                          }
                        ];
                        const dataPoint = chartData[index];

                        return (
                          <g>
                            {/* Value label */}
                            <text
                              x={x + width / 2}
                              y={y - 18}
                              fill="#1a1a1a"
                              textAnchor="middle"
                              stroke="white"
                              strokeWidth={3}
                              paintOrder="stroke"
                              style={{
                                fontWeight: 700,
                                fontSize: 12,
                                fontFamily: LABEL_CONFIG.fonts.value,
                                letterSpacing: '-0.02em'
                              }}
                            >
                              {formatCurrency(value, true)}
                            </text>
                            {/* Growth percentage */}
                            {dataPoint?.growth !== null && dataPoint?.growth !== undefined && (
                              <text
                                x={x + width / 2}
                                y={y - 5}
                                fill={dataPoint.growth >= 0 ? '#dc2626' : '#16a34a'}
                                textAnchor="middle"
                                stroke="white"
                                strokeWidth={2.5}
                                paintOrder="stroke"
                                style={{
                                  fontSize: 11,
                                  fontWeight: 700,
                                  fontFamily: LABEL_CONFIG.fonts.percentage,
                                  letterSpacing: '-0.01em'
                                }}
                              >
                                {dataPoint.growth >= 0 ? '↑' : '↓'}{Math.abs(dataPoint.growth).toFixed(1)}%
                              </text>
                            )}
                          </g>
                        );
                      }}
                    />
                  </Bar>
                </>
              ) : (
                <Bar dataKey="total" name="Total Cost">
                <LabelList
                  position="top"
                  content={(props) => {
                    const { x, y, width, value } = props;
                    const pharmaciesTotal =
                      costByQuarter?.reduce(
                        (sum, q) => sum + (q.pharmaciesCost || 0),
                        0,
                      ) || 0;
                    const distributionTotal =
                      costByQuarter?.reduce(
                        (sum, q) => sum + (q.distributionCost || 0),
                        0,
                      ) || 0;
                    const lastMileTotal =
                      costByQuarter?.reduce(
                        (sum, q) => sum + (q.lastMileCost || 0),
                        0,
                      ) || 0;
                    const damascoTotal =
                      pharmaciesTotal + distributionTotal + lastMileTotal;
                    const proceed3PLTotal =
                      costByQuarter?.reduce(
                        (sum, q) =>
                          sum +
                          (q.proceed3PLWHCost || 0) +
                          (q.proceed3PLTRSCost || 0),
                        0,
                      ) || 0;
                    const grandTotal = damascoTotal + proceed3PLTotal;
                    const percentage =
                      grandTotal > 0
                        ? ((value / grandTotal) * 100).toFixed(1)
                        : "0";

                    return renderBarLabel(props, {
                      showPercentage: true,
                      percentageTotal: grandTotal
                    });
                  }}
                />
                <Cell fill={PROCEED_COLORS.darkRed} />
                <Cell fill={PROCEED_COLORS.blue} />
              </Bar>
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* 3. Cost Efficiency Metrics - Third Visualization */}
        <div className="chart-container">
          <h3 className="text-lg font-semibold mb-4">
            Department Cost Trend
            {comparisonMode && (
              <span className="text-sm font-normal ml-3 text-gray-600">
                (Comparison: {firstPeriod?.quarter} vs {secondPeriod?.quarter})
              </span>
            )}
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart
              data={comparisonMode && firstPeriodMetrics && secondPeriodMetrics
                ? // Comparison mode: side-by-side columns for each department
                [
                  {
                    name: "Pharmacies",
                    period1: firstPeriodMetrics.costByQuarter?.reduce((sum: number, q: any) => sum + (q.pharmaciesCost || 0), 0) || 0,
                    period2: secondPeriodMetrics.costByQuarter?.reduce((sum: number, q: any) => sum + (q.pharmaciesCost || 0), 0) || 0,
                    growth: calculateGrowth(
                      firstPeriodMetrics.costByQuarter?.reduce((sum: number, q: any) => sum + (q.pharmaciesCost || 0), 0) || 0,
                      secondPeriodMetrics.costByQuarter?.reduce((sum: number, q: any) => sum + (q.pharmaciesCost || 0), 0) || 0
                    )
                  },
                  {
                    name: "Distribution",
                    period1: firstPeriodMetrics.costByQuarter?.reduce((sum: number, q: any) => sum + (q.distributionCost || 0), 0) || 0,
                    period2: secondPeriodMetrics.costByQuarter?.reduce((sum: number, q: any) => sum + (q.distributionCost || 0), 0) || 0,
                    growth: calculateGrowth(
                      firstPeriodMetrics.costByQuarter?.reduce((sum: number, q: any) => sum + (q.distributionCost || 0), 0) || 0,
                      secondPeriodMetrics.costByQuarter?.reduce((sum: number, q: any) => sum + (q.distributionCost || 0), 0) || 0
                    )
                  },
                  {
                    name: "Last Mile",
                    period1: firstPeriodMetrics.costByQuarter?.reduce((sum: number, q: any) => sum + (q.lastMileCost || 0), 0) || 0,
                    period2: secondPeriodMetrics.costByQuarter?.reduce((sum: number, q: any) => sum + (q.lastMileCost || 0), 0) || 0,
                    growth: calculateGrowth(
                      firstPeriodMetrics.costByQuarter?.reduce((sum: number, q: any) => sum + (q.lastMileCost || 0), 0) || 0,
                      secondPeriodMetrics.costByQuarter?.reduce((sum: number, q: any) => sum + (q.lastMileCost || 0), 0) || 0
                    )
                  },
                  {
                    name: "PROCEED 3PL",
                    period1: firstPeriodMetrics.costByQuarter?.reduce((sum: number, q: any) => sum + (q.proceed3PLWHCost || 0) + (q.proceed3PLTRSCost || 0), 0) || 0,
                    period2: secondPeriodMetrics.costByQuarter?.reduce((sum: number, q: any) => sum + (q.proceed3PLWHCost || 0) + (q.proceed3PLTRSCost || 0), 0) || 0,
                    growth: calculateGrowth(
                      firstPeriodMetrics.costByQuarter?.reduce((sum: number, q: any) => sum + (q.proceed3PLWHCost || 0) + (q.proceed3PLTRSCost || 0), 0) || 0,
                      secondPeriodMetrics.costByQuarter?.reduce((sum: number, q: any) => sum + (q.proceed3PLWHCost || 0) + (q.proceed3PLTRSCost || 0), 0) || 0
                    )
                  }
                ]
                : // Normal mode
                costByQuarter?.map((q) => ({
                  quarter: q.value.toUpperCase(),
                  Pharmacies: q.pharmaciesCost || 0,
                  Distribution: q.distributionCost || 0,
                  "Last Mile": q.lastMileCost || 0,
                  "PROCEED 3PL": (q.proceed3PLWHCost || 0) + (q.proceed3PLTRSCost || 0),
                }))
              }
              margin={{ top: 50, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid {...CHART_STYLES.grid} />
              <XAxis
                dataKey={comparisonMode && firstPeriodMetrics && secondPeriodMetrics ? "name" : "quarter"}
                tick={{
                  ...CHART_STYLES.tick,
                  fontWeight: 600
                }}
                height={60}
              />
              <YAxis
                tickFormatter={(value) => formatCurrency(value, true)}
                tick={{
                  ...CHART_STYLES.tick,
                  fontWeight: 500
                }}
                width={85}
              />
              <Tooltip
                formatter={(value) => formatCurrency(value as number)}
                contentStyle={CHART_STYLES.tooltip.contentStyle}
                labelStyle={CHART_STYLES.tooltip.labelStyle}
              />
              <Legend wrapperStyle={CHART_STYLES.legend.wrapperStyle} />
              {comparisonMode && firstPeriodMetrics && secondPeriodMetrics ? (
                <>
                  <Bar dataKey="period1" name={`Period 1 (${firstPeriod?.quarter})`} fill={PROCEED_COLORS.secondary}>
                    <LabelList
                      position="top"
                      content={(props) => {
                        const { x, y, width, value } = props;
                        if (!value || value === 0) return null;
                        return (
                          <text
                            x={x + width / 2}
                            y={y - 8}
                            fill="#1a1a1a"
                            textAnchor="middle"
                            stroke="white"
                            strokeWidth={3}
                            paintOrder="stroke"
                            style={{
                              fontWeight: 700,
                              fontSize: 12,
                              fontFamily: LABEL_CONFIG.fonts.value,
                              letterSpacing: '-0.02em'
                            }}
                          >
                            {formatCurrency(value, true)}
                          </text>
                        );
                      }}
                    />
                  </Bar>
                  <Bar dataKey="period2" name={`Period 2 (${secondPeriod?.quarter})`} fill={PROCEED_COLORS.primary}>
                    <LabelList
                      position="top"
                      content={(props) => {
                        const { x, y, width, value, index } = props;
                        if (!value || value === 0) return null;

                        // Get the full data object using the index to access growth
                        const departmentData = [
                          {
                            name: "Pharmacies",
                            period1: firstPeriodMetrics.costByQuarter?.reduce((sum: number, q: any) => sum + (q.pharmaciesCost || 0), 0) || 0,
                            period2: secondPeriodMetrics.costByQuarter?.reduce((sum: number, q: any) => sum + (q.pharmaciesCost || 0), 0) || 0,
                            growth: calculateGrowth(
                              firstPeriodMetrics.costByQuarter?.reduce((sum: number, q: any) => sum + (q.pharmaciesCost || 0), 0) || 0,
                              secondPeriodMetrics.costByQuarter?.reduce((sum: number, q: any) => sum + (q.pharmaciesCost || 0), 0) || 0
                            )
                          },
                          {
                            name: "Distribution",
                            period1: firstPeriodMetrics.costByQuarter?.reduce((sum: number, q: any) => sum + (q.distributionCost || 0), 0) || 0,
                            period2: secondPeriodMetrics.costByQuarter?.reduce((sum: number, q: any) => sum + (q.distributionCost || 0), 0) || 0,
                            growth: calculateGrowth(
                              firstPeriodMetrics.costByQuarter?.reduce((sum: number, q: any) => sum + (q.distributionCost || 0), 0) || 0,
                              secondPeriodMetrics.costByQuarter?.reduce((sum: number, q: any) => sum + (q.distributionCost || 0), 0) || 0
                            )
                          },
                          {
                            name: "Last Mile",
                            period1: firstPeriodMetrics.costByQuarter?.reduce((sum: number, q: any) => sum + (q.lastMileCost || 0), 0) || 0,
                            period2: secondPeriodMetrics.costByQuarter?.reduce((sum: number, q: any) => sum + (q.lastMileCost || 0), 0) || 0,
                            growth: calculateGrowth(
                              firstPeriodMetrics.costByQuarter?.reduce((sum: number, q: any) => sum + (q.lastMileCost || 0), 0) || 0,
                              secondPeriodMetrics.costByQuarter?.reduce((sum: number, q: any) => sum + (q.lastMileCost || 0), 0) || 0
                            )
                          },
                          {
                            name: "PROCEED 3PL",
                            period1: firstPeriodMetrics.costByQuarter?.reduce((sum: number, q: any) => sum + (q.proceed3PLWHCost || 0) + (q.proceed3PLTRSCost || 0), 0) || 0,
                            period2: secondPeriodMetrics.costByQuarter?.reduce((sum: number, q: any) => sum + (q.proceed3PLWHCost || 0) + (q.proceed3PLTRSCost || 0), 0) || 0,
                            growth: calculateGrowth(
                              firstPeriodMetrics.costByQuarter?.reduce((sum: number, q: any) => sum + (q.proceed3PLWHCost || 0) + (q.proceed3PLTRSCost || 0), 0) || 0,
                              secondPeriodMetrics.costByQuarter?.reduce((sum: number, q: any) => sum + (q.proceed3PLWHCost || 0) + (q.proceed3PLTRSCost || 0), 0) || 0
                            )
                          }
                        ];
                        const dataPoint = departmentData[index];

                        return (
                          <g>
                            {/* Value label */}
                            <text
                              x={x + width / 2}
                              y={y - 18}
                              fill="#1a1a1a"
                              textAnchor="middle"
                              stroke="white"
                              strokeWidth={3}
                              paintOrder="stroke"
                              style={{
                                fontWeight: 700,
                                fontSize: 12,
                                fontFamily: LABEL_CONFIG.fonts.value,
                                letterSpacing: '-0.02em'
                              }}
                            >
                              {formatCurrency(value, true)}
                            </text>
                            {/* Growth percentage */}
                            {dataPoint?.growth !== null && dataPoint?.growth !== undefined && (
                              <text
                                x={x + width / 2}
                                y={y - 5}
                                fill={dataPoint.growth >= 0 ? '#dc2626' : '#16a34a'}
                                textAnchor="middle"
                                stroke="white"
                                strokeWidth={2.5}
                                paintOrder="stroke"
                                style={{
                                  fontSize: 11,
                                  fontWeight: 700,
                                  fontFamily: LABEL_CONFIG.fonts.percentage,
                                  letterSpacing: '-0.01em'
                                }}
                              >
                                {dataPoint.growth >= 0 ? '↑' : '↓'}{Math.abs(dataPoint.growth).toFixed(1)}%
                              </text>
                            )}
                          </g>
                        );
                      }}
                    />
                  </Bar>
                </>
              ) : (
              <>
              <Bar dataKey="Pharmacies" fill={PROCEED_COLORS.primary}>
                <LabelList
                  position="top"
                  content={(props) => {
                    const { x, y, width, value, index } = props;
                    if (!value || value === 0) return null;
                    const dataEntry = costByQuarter?.[index];
                    const quarterTotal = dataEntry
                      ? (dataEntry.pharmaciesCost || 0) +
                        (dataEntry.distributionCost || 0) +
                        (dataEntry.lastMileCost || 0) +
                        (dataEntry.proceed3PLWHCost || 0) +
                        (dataEntry.proceed3PLTRSCost || 0)
                      : 0;
                    const percentage = quarterTotal > 0 ? (value / quarterTotal * 100).toFixed(1) : '0.0';
                    return (
                      <g>
                        <text
                          x={x + width / 2}
                          y={y - 18}
                          fill="#333"
                          textAnchor="middle"
                          fontSize={10}
                          fontWeight="bold"
                        >
                          {formatCurrency(value, true)}
                        </text>
                        <text
                          x={x + width / 2}
                          y={y - 5}
                          fill="#666"
                          textAnchor="middle"
                          fontSize={9}
                        >
                          ({percentage}%)
                        </text>
                      </g>
                    );
                  }}
                />
              </Bar>
              <Bar dataKey="Distribution" fill={PROCEED_COLORS.secondary}>
                <LabelList
                  position="top"
                  content={(props) => {
                    const { x, y, width, value, index } = props;
                    if (!value || value === 0) return null;
                    const dataEntry = costByQuarter?.[index];
                    const quarterTotal = dataEntry
                      ? (dataEntry.pharmaciesCost || 0) +
                        (dataEntry.distributionCost || 0) +
                        (dataEntry.lastMileCost || 0) +
                        (dataEntry.proceed3PLWHCost || 0) +
                        (dataEntry.proceed3PLTRSCost || 0)
                      : 0;
                    const percentage = quarterTotal > 0 ? (value / quarterTotal * 100).toFixed(1) : '0.0';
                    return (
                      <g>
                        <text
                          x={x + width / 2}
                          y={y - 18}
                          fill="#333"
                          textAnchor="middle"
                          fontSize={10}
                          fontWeight="bold"
                        >
                          {formatCurrency(value, true)}
                        </text>
                        <text
                          x={x + width / 2}
                          y={y - 5}
                          fill="#666"
                          textAnchor="middle"
                          fontSize={9}
                        >
                          ({percentage}%)
                        </text>
                      </g>
                    );
                  }}
                />
              </Bar>
              <Bar dataKey="Last Mile" fill={PROCEED_COLORS.accent}>
                <LabelList
                  position="top"
                  content={(props) => {
                    const { x, y, width, value, index } = props;
                    if (!value || value === 0) return null;
                    const dataEntry = costByQuarter?.[index];
                    const quarterTotal = dataEntry
                      ? (dataEntry.pharmaciesCost || 0) +
                        (dataEntry.distributionCost || 0) +
                        (dataEntry.lastMileCost || 0) +
                        (dataEntry.proceed3PLWHCost || 0) +
                        (dataEntry.proceed3PLTRSCost || 0)
                      : 0;
                    const percentage = quarterTotal > 0 ? (value / quarterTotal * 100).toFixed(1) : '0.0';
                    return (
                      <g>
                        <text
                          x={x + width / 2}
                          y={y - 18}
                          fill="#333"
                          textAnchor="middle"
                          fontSize={10}
                          fontWeight="bold"
                        >
                          {formatCurrency(value, true)}
                        </text>
                        <text
                          x={x + width / 2}
                          y={y - 5}
                          fill="#666"
                          textAnchor="middle"
                          fontSize={9}
                        >
                          ({percentage}%)
                        </text>
                      </g>
                    );
                  }}
                />
              </Bar>
              <Bar dataKey="PROCEED 3PL" fill={PROCEED_COLORS.blue}>
                <LabelList
                  position="top"
                  content={(props) => {
                    const { x, y, width, value, index } = props;
                    if (!value || value === 0) return null;
                    const dataEntry = costByQuarter?.[index];
                    const quarterTotal = dataEntry
                      ? (dataEntry.pharmaciesCost || 0) +
                        (dataEntry.distributionCost || 0) +
                        (dataEntry.lastMileCost || 0) +
                        (dataEntry.proceed3PLWHCost || 0) +
                        (dataEntry.proceed3PLTRSCost || 0)
                      : 0;
                    const percentage = quarterTotal > 0 ? (value / quarterTotal * 100).toFixed(1) : '0.0';
                    return (
                      <g>
                        <text
                          x={x + width / 2}
                          y={y - 18}
                          fill="#333"
                          textAnchor="middle"
                          fontSize={10}
                          fontWeight="bold"
                        >
                          {formatCurrency(value, true)}
                        </text>
                        <text
                          x={x + width / 2}
                          y={y - 5}
                          fill="#666"
                          textAnchor="middle"
                          fontSize={9}
                        >
                          ({percentage}%)
                        </text>
                      </g>
                    );
                  }}
                />
              </Bar>
              </>
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* TCO Model Categories - Full Width */}
      <div className="chart-container">
        <h3 className="text-lg font-semibold mb-4">
          TCO Model Categories
          {comparisonMode && (
            <span className="text-sm font-normal ml-3 text-gray-600">
              (Comparison: {firstPeriod?.quarter} vs {secondPeriod?.quarter})
            </span>
          )}
        </h3>
        <ResponsiveContainer width="100%" height={600}>
          {comparisonMode && firstPeriodMetrics && secondPeriodMetrics ? (
            <LineChart
              data={(() => {
                // Get TCO categories from both periods
                const categoriesP1: { [key: string]: number } = {};
                const categoriesP2: { [key: string]: number } = {};

                // Aggregate Period 1 data
                firstPeriodMetrics.topExpenses?.forEach((item: any) => {
                  const category = item.tcoModelCategories || "Uncategorized";
                  const cost = parseFloat(item.totalIncurredCost) || 0;
                  categoriesP1[category] = (categoriesP1[category] || 0) + cost;
                });

                // Aggregate Period 2 data
                secondPeriodMetrics.topExpenses?.forEach((item: any) => {
                  const category = item.tcoModelCategories || "Uncategorized";
                  const cost = parseFloat(item.totalIncurredCost) || 0;
                  categoriesP2[category] = (categoriesP2[category] || 0) + cost;
                });

                // Get all unique categories
                const allCategories = [...new Set([...Object.keys(categoriesP1), ...Object.keys(categoriesP2)])];

                // Create line chart data with both periods
                return allCategories
                  .map(category => ({
                    name: category,
                    period1: categoriesP1[category] || 0,
                    period2: categoriesP2[category] || 0,
                    growth: calculateGrowth(categoriesP1[category] || 0, categoriesP2[category] || 0)
                  }))
                  .sort((a, b) => b.period2 - a.period2) // Sort by Period 2 values
                  .slice(0, 10); // Show top 10 categories
              })()}
              margin={{ top: 50, right: 30, left: 20, bottom: 100 }}
            >
              <CartesianGrid {...CHART_STYLES.grid} />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={140}
                interval={0}
                tick={{
                  ...CHART_STYLES.tick,
                  fontSize: 11,
                  fontWeight: 600
                }}
              />
              <YAxis
                tickFormatter={(value) => formatCurrency(value, true)}
                tick={{
                  ...CHART_STYLES.tick,
                  fontWeight: 500
                }}
                width={90}
              />
              <Tooltip
                formatter={(value) => formatCurrency(value as number)}
                contentStyle={CHART_STYLES.tooltip.contentStyle}
                labelStyle={CHART_STYLES.tooltip.labelStyle}
              />
              <Legend wrapperStyle={CHART_STYLES.legend.wrapperStyle} />
              <Line
                type="monotone"
                dataKey="period1"
                name={`Period 1 (${firstPeriod?.quarter})`}
                stroke={PROCEED_COLORS.secondary}
                strokeWidth={2}
                dot={{ r: 4 }}
                label={{
                  position: 'bottom',
                  content: (props: any) => {
                    const { x, y, value } = props;
                    return (
                      <text
                        x={x}
                        y={y + 15}
                        fill="#1a1a1a"
                        textAnchor="middle"
                        fontSize={11}
                        fontWeight={600}
                        stroke="white"
                        strokeWidth={2}
                        paintOrder="stroke"
                      >
                        {formatCurrency(value, true)}
                      </text>
                    );
                  }
                }}
              />
              <Line
                type="monotone"
                dataKey="period2"
                name={`Period 2 (${secondPeriod?.quarter})`}
                stroke={PROCEED_COLORS.primary}
                strokeWidth={2}
                dot={{ r: 4 }}
                label={{
                  position: 'top',
                  content: (props: any) => {
                    const { x, y, value, index } = props;

                    // Reconstruct the data to access growth values
                    const categoriesP1: { [key: string]: number } = {};
                    const categoriesP2: { [key: string]: number } = {};

                    firstPeriodMetrics.topExpenses?.forEach((item: any) => {
                      const category = item.tcoModelCategories || "Uncategorized";
                      const cost = parseFloat(item.totalIncurredCost) || 0;
                      categoriesP1[category] = (categoriesP1[category] || 0) + cost;
                    });

                    secondPeriodMetrics.topExpenses?.forEach((item: any) => {
                      const category = item.tcoModelCategories || "Uncategorized";
                      const cost = parseFloat(item.totalIncurredCost) || 0;
                      categoriesP2[category] = (categoriesP2[category] || 0) + cost;
                    });

                    const allCategories = [...new Set([...Object.keys(categoriesP1), ...Object.keys(categoriesP2)])];
                    const chartData = allCategories
                      .map(category => ({
                        name: category,
                        period1: categoriesP1[category] || 0,
                        period2: categoriesP2[category] || 0,
                        growth: calculateGrowth(categoriesP1[category] || 0, categoriesP2[category] || 0)
                      }))
                      .sort((a, b) => b.period2 - a.period2)
                      .slice(0, 10);

                    const dataPoint = chartData[index];

                    return (
                      <g>
                        <text
                          x={x}
                          y={y - 18}
                          fill="#1a1a1a"
                          textAnchor="middle"
                          fontSize={12}
                          fontWeight={700}
                          stroke="white"
                          strokeWidth={2.5}
                          paintOrder="stroke"
                        >
                          {formatCurrency(value, true)}
                        </text>
                        {dataPoint?.growth !== undefined && (
                          <text
                            x={x}
                            y={y - 5}
                            fill={dataPoint.growth >= 0 ? '#dc2626' : '#16a34a'}
                            textAnchor="middle"
                            fontSize={11}
                            fontWeight={700}
                            stroke="white"
                            strokeWidth={2}
                            paintOrder="stroke"
                          >
                            {dataPoint.growth >= 0 ? '↑' : '↓'}{Math.abs(dataPoint.growth).toFixed(1)}%
                          </text>
                        )}
                      </g>
                    );
                  }
                }}
              />
            </LineChart>
          ) : (
            <Treemap
              data={(() => {
                // Normal mode - use Treemap
                const dataSource = metrics?.topExpenses;
                const tcoCategories: { [key: string]: number } = {};

                dataSource?.forEach((item: any) => {
                  const category = item.tcoModelCategories || "Uncategorized";
                  const cost = parseFloat(item.totalIncurredCost) || 0;
                  tcoCategories[category] = (tcoCategories[category] || 0) + cost;
                });

                const total = Object.values(tcoCategories).reduce((sum, val) => sum + val, 0);
                return Object.entries(tcoCategories)
                  .map(([name, value], index) => ({
                    name,
                    value,
                    fill: getBrandColor(index),
                    percentage: total > 0 ? ((value / total) * 100).toFixed(1) : "0",
                  }))
                  .sort((a, b) => b.value - a.value);
              })()}
              dataKey="value"
              aspectRatio={4 / 3}
              stroke="#fff"
              strokeWidth={2}
              content={({
              x,
              y,
              width,
              height,
              value,
              name,
              fill,
              percentage,
            }) => {
              // Always render the rectangle
              const rect = (
                <rect
                  x={x}
                  y={y}
                  width={width}
                  height={height}
                  style={{
                    fill: fill,
                    stroke: "#fff",
                    strokeWidth: 2,
                    strokeOpacity: 1,
                  }}
                />
              );

              // Calculate available space with padding
              const padding = 5;
              const availableWidth = width - (padding * 2);
              const availableHeight = height - (padding * 2);

              // Determine box size category
              const isTinyBox = width < 60 || height < 50;
              const isSmallBox = width < 100 || height < 80;
              const isMediumBox = width < 150 || height < 120;

              // Don't render text if box is too tiny
              if (isTinyBox) {
                return <g>{rect}</g>;
              }

              // Calculate optimal font sizes based on available space
              const maxNameSize = Math.min(availableWidth / 6, availableHeight / 4, 16);
              const maxValueSize = Math.min(availableWidth / 8, availableHeight / 5, 14);
              const maxPercentSize = Math.min(availableWidth / 10, availableHeight / 6, 11);

              const nameFontSize = Math.max(8, maxNameSize);
              const valueFontSize = Math.max(7, maxValueSize);
              const percentFontSize = Math.max(6, maxPercentSize);

              // Text color with better contrast
              const textColor = "#fff";

              // Split long text into multiple lines if needed
              const wrapText = (text: string | undefined, maxChars: number) => {
                if (!text) return [''];
                if (text.length <= maxChars) return [text];

                const words = text.split(' ');
                const lines: string[] = [];
                let currentLine = '';

                words.forEach(word => {
                  if ((currentLine + word).length <= maxChars) {
                    currentLine += (currentLine ? ' ' : '') + word;
                  } else {
                    if (currentLine) lines.push(currentLine);
                    currentLine = word;
                  }
                });
                if (currentLine) lines.push(currentLine);

                return lines.length > 2 ? [text.substring(0, maxChars - 3) + '...'] : lines;
              };

              // Calculate max characters based on width
              const maxCharsPerLine = Math.floor(availableWidth / (nameFontSize * 0.6));
              const displayName = name || 'Unknown';
              const nameLines = wrapText(displayName, maxCharsPerLine);

              // Determine what to show based on available space
              const showValue = !isSmallBox || height > 60;
              const showPercent = !isSmallBox || height > 70;

              // Calculate vertical positions
              const totalTextHeight = nameLines.length * nameFontSize +
                                    (showValue ? valueFontSize + 5 : 0) +
                                    (showPercent ? percentFontSize + 3 : 0);
              const startY = y + (height - totalTextHeight) / 2;

              return (
                <g>
                  {rect}
                  <clipPath id={`clip-${x}-${y}`}>
                    <rect x={x + padding} y={y + padding} width={availableWidth} height={availableHeight} />
                  </clipPath>
                  <g clipPath={`url(#clip-${x}-${y})`}>
                    {/* Category Name (possibly multi-line) */}
                    {nameLines.map((line, index) => (
                      <text
                        key={index}
                        x={x + width / 2}
                        y={startY + nameFontSize * (index + 0.8)}
                        textAnchor="middle"
                        fill={textColor}
                        fontSize={nameFontSize}
                        fontWeight="bold"
                        fontFamily="system-ui, -apple-system, sans-serif"
                        stroke="rgba(0,0,0,0.4)"
                        strokeWidth="0.3"
                        paintOrder="stroke"
                      >
                        {line}
                      </text>
                    ))}
                    {/* Value */}
                    {showValue && (
                      <text
                        x={x + width / 2}
                        y={startY + nameLines.length * nameFontSize + valueFontSize + 2}
                        textAnchor="middle"
                        fill={textColor}
                        fontSize={valueFontSize}
                        fontWeight="600"
                        fontFamily="system-ui, -apple-system, sans-serif"
                        stroke="rgba(0,0,0,0.3)"
                        strokeWidth="0.2"
                        paintOrder="stroke"
                      >
                        {formatCurrency(value || 0, true)}
                      </text>
                    )}
                    {/* Percentage */}
                    {showPercent && (
                      <text
                        x={x + width / 2}
                        y={startY + nameLines.length * nameFontSize +
                           (showValue ? valueFontSize + 5 : 0) + percentFontSize + 2}
                        textAnchor="middle"
                        fill={textColor}
                        fontSize={percentFontSize}
                        fontWeight="500"
                        fontFamily="system-ui, -apple-system, sans-serif"
                        stroke="rgba(0,0,0,0.3)"
                        strokeWidth="0.2"
                        paintOrder="stroke"
                      >
                        ({percentage || '0'}%)
                      </text>
                    )}
                  </g>
                </g>
              );
            }}
          >
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  // Create a contrasting background color
                  const bgColor = "rgba(255, 255, 255, 0.98)";
                  const borderColor = data.fill || "#333";

                  return (
                    <div
                      style={{
                        backgroundColor: bgColor,
                        border: `2px solid ${borderColor}`,
                        borderRadius: "8px",
                        padding: "12px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                        minWidth: "180px",
                      }}
                    >
                      <p
                        style={{
                          fontWeight: "600",
                          fontSize: "14px",
                          color: "#333",
                          marginBottom: "8px",
                          borderBottom: `1px solid ${borderColor}`,
                          paddingBottom: "4px",
                        }}
                      >
                        {data.name}
                      </p>
                      <p
                        style={{
                          fontSize: "13px",
                          color: "#555",
                          marginBottom: "4px",
                        }}
                      >
                        <strong>Value:</strong> {formatCurrency(data.value)}
                      </p>
                      <p
                        style={{
                          fontSize: "13px",
                          color: "#555",
                          marginBottom: "0",
                        }}
                      >
                        <strong>Share:</strong> {data.percentage}%
                      </p>
                    </div>
                  );
                }
                return null;
              }}
              wrapperStyle={{ zIndex: 1000 }}
            />
          </Treemap>
          )}
        </ResponsiveContainer>
        <div className="text-sm text-gray-600 mt-2 text-center">
          Total TCO Categories:{" "}
          {
            Object.keys(
              (() => {
                const categories: { [key: string]: boolean } = {};
                const dataSource = comparisonMode && secondPeriodMetrics
                  ? secondPeriodMetrics.topExpenses
                  : metrics?.topExpenses;
                dataSource?.forEach((item: any) => {
                  categories[item.tcoModelCategories || "Uncategorized"] = true;
                });
                return categories;
              })(),
            ).length
          }{" "}
          | Total Items Analyzed: {
            comparisonMode && secondPeriodMetrics
              ? secondPeriodMetrics.topExpenses?.length || 0
              : metrics?.topExpenses?.length || 0
          }
        </div>
      </div>

      {/* GL Account Cost Analysis - Full Width */}
      <div className="chart-container">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">
            GL Accounts by Total Cost
            {comparisonMode && (
              <span className="text-sm font-normal ml-3 text-gray-600">
                (Comparison: {firstPeriod?.quarter} vs {secondPeriod?.quarter})
              </span>
            )}
          </h3>
          <div className="text-sm text-gray-600">
            <span className="mr-4">
              <span className="font-medium">Total GLs:</span>{" "}
              {allGLAccounts.length}
            </span>
            <span className="mr-4">
              <span className="font-medium">Top 15 Displayed</span>
            </span>
            {othersTotal > 0 && (
              <span>
                <span className="font-medium">Others:</span>{" "}
                {allGLAccounts.length - 15} GLs
              </span>
            )}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={500}>
          {comparisonMode && firstPeriodMetrics && secondPeriodMetrics ? (
            <LineChart
              data={(() => {
                // Get GL accounts from both periods
                const glAccountsP1: { [key: string]: number } = {};
                const glAccountsP2: { [key: string]: number } = {};

                // Aggregate Period 1 data
                firstPeriodMetrics.costByGLAccount?.forEach((item: any) => {
                  glAccountsP1[item.value] = item.totalCost;
                });

                // Aggregate Period 2 data
                secondPeriodMetrics.costByGLAccount?.forEach((item: any) => {
                  glAccountsP2[item.value] = item.totalCost;
                });

                // Get all unique GL accounts
                const allAccounts = [...new Set([...Object.keys(glAccountsP1), ...Object.keys(glAccountsP2)])];

                // Create line chart data with both periods
                return allAccounts
                  .map(account => ({
                    name: account,
                    period1: glAccountsP1[account] || 0,
                    period2: glAccountsP2[account] || 0,
                    growth: calculateGrowth(glAccountsP1[account] || 0, glAccountsP2[account] || 0)
                  }))
                  .sort((a, b) => b.period2 - a.period2) // Sort by Period 2 values
                  .slice(0, 15); // Show top 15 accounts
              })()}
              margin={{ top: 50, right: 30, left: 20, bottom: 100 }}
            >
              <CartesianGrid {...CHART_STYLES.grid} />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={140}
                interval={0}
                tick={{
                  ...CHART_STYLES.tick,
                  fontSize: 11,
                  fontWeight: 600
                }}
              />
              <YAxis
                tickFormatter={(value) => formatCurrency(value, true)}
                tick={{
                  ...CHART_STYLES.tick,
                  fontWeight: 500
                }}
                width={90}
              />
              <Tooltip
                formatter={(value) => formatCurrency(value as number)}
                contentStyle={CHART_STYLES.tooltip.contentStyle}
                labelStyle={CHART_STYLES.tooltip.labelStyle}
              />
              <Legend wrapperStyle={CHART_STYLES.legend.wrapperStyle} />
              <Line
                type="monotone"
                dataKey="period1"
                name={`Period 1 (${firstPeriod?.quarter})`}
                stroke={PROCEED_COLORS.secondary}
                strokeWidth={2}
                dot={{ r: 4 }}
                label={{
                  position: 'bottom',
                  content: (props: any) => {
                    const { x, y, value } = props;
                    return (
                      <text
                        x={x}
                        y={y + 15}
                        fill="#1a1a1a"
                        textAnchor="middle"
                        fontSize={11}
                        fontWeight={600}
                        stroke="white"
                        strokeWidth={2}
                        paintOrder="stroke"
                      >
                        {formatCurrency(value, true)}
                      </text>
                    );
                  }
                }}
              />
              <Line
                type="monotone"
                dataKey="period2"
                name={`Period 2 (${secondPeriod?.quarter})`}
                stroke={PROCEED_COLORS.primary}
                strokeWidth={2}
                dot={{ r: 4 }}
                label={{
                  position: 'top',
                  content: (props: any) => {
                    const { x, y, value, index } = props;

                    // Reconstruct the GL accounts data to access growth values
                    const glAccountsP1: { [key: string]: number } = {};
                    const glAccountsP2: { [key: string]: number } = {};

                    // Aggregate Period 1 data
                    firstPeriodMetrics.costByGLAccount?.forEach((item: any) => {
                      glAccountsP1[item.value] = item.totalCost;
                    });

                    // Aggregate Period 2 data
                    secondPeriodMetrics.costByGLAccount?.forEach((item: any) => {
                      glAccountsP2[item.value] = item.totalCost;
                    });

                    // Get all unique GL accounts
                    const allAccounts = [...new Set([...Object.keys(glAccountsP1), ...Object.keys(glAccountsP2)])];

                    // Create line chart data with both periods
                    const chartData = allAccounts
                      .map(account => ({
                        name: account,
                        period1: glAccountsP1[account] || 0,
                        period2: glAccountsP2[account] || 0,
                        growth: calculateGrowth(glAccountsP1[account] || 0, glAccountsP2[account] || 0)
                      }))
                      .sort((a, b) => b.period2 - a.period2)
                      .slice(0, 15);

                    const dataPoint = chartData[index];

                    return (
                      <g>
                        <text
                          x={x}
                          y={y - 18}
                          fill="#1a1a1a"
                          textAnchor="middle"
                          fontSize={12}
                          fontWeight={700}
                          stroke="white"
                          strokeWidth={2.5}
                          paintOrder="stroke"
                        >
                          {formatCurrency(value, true)}
                        </text>
                        {dataPoint?.growth !== undefined && (
                          <text
                            x={x}
                            y={y - 5}
                            fill={dataPoint.growth >= 0 ? '#dc2626' : '#16a34a'}
                            textAnchor="middle"
                            fontSize={11}
                            fontWeight={700}
                            stroke="white"
                            strokeWidth={2}
                            paintOrder="stroke"
                          >
                            {dataPoint.growth >= 0 ? '↑' : '↓'}{Math.abs(dataPoint.growth).toFixed(1)}%
                          </text>
                        )}
                      </g>
                    );
                  }
                }}
              />
            </LineChart>
          ) : (
            <BarChart
              data={costByGLAccount}
              layout="horizontal"
              margin={{ top: 50, right: 30, left: 20, bottom: 100 }}
            >
              <CartesianGrid {...CHART_STYLES.grid} />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={140}
                interval={0}
                tick={{
                  ...CHART_STYLES.tick,
                  fontSize: 12,
                  fontWeight: 600
                }}
              />
              <YAxis
                tickFormatter={(value) => formatCurrency(value, true)}
                tick={{
                  ...CHART_STYLES.tick,
                  fontWeight: 500
                }}
                width={90}
              />
              <Tooltip
                formatter={(value) => formatCurrency(value as number)}
                contentStyle={CHART_STYLES.tooltip.contentStyle}
                labelStyle={CHART_STYLES.tooltip.labelStyle}
              />
              <Bar dataKey="totalCost" name="Total Cost">
              <LabelList
                position="top"
                content={(props) => {
                  return renderBarLabel(props, {
                    showPercentage: true,
                    percentageTotal: totalAllGLCost
                  });
                }}
              />
              {costByGLAccount.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    entry.name === "Others" ? "#808080" : getBrandColor(index)
                  }
                />
              ))}
            </Bar>
          </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* GL Accounts Detailed View - Enterprise Data Grid */}
      <div className="chart-container">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">GL Accounts Detailed View</h3>
          <div className="text-sm text-gray-600">
            <span className="font-medium">Advanced Data Grid</span>
          </div>
        </div>
        {(() => {
          const gridData = comparisonMode && secondPeriodMetrics
            ? secondPeriodMetrics.topExpenses
            : metrics?.topExpenses;

          console.log('[Dashboard] Data Grid section:', {
            hasMetrics: !!metrics,
            hasTopExpenses: !!gridData,
            topExpensesLength: gridData?.length || 0,
            firstItem: gridData?.[0],
            willRenderGrid: gridData && gridData.length > 0
          });

          if (gridData && gridData.length > 0) {
            return (
              <>
                <EnterpriseDataGrid data={gridData} />
              </>
            );
          } else {
            return (
              <div className="text-center py-8 text-gray-500">
                No data available
              </div>
            );
          }
        })()}
      </div>
    </div>
  );
}
