import React, { useState, useMemo, useEffect } from "react";
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
import { fetchDashboardMetrics, fetchFilterOptions } from "../api/costs";
import { formatCurrency, formatPercentage } from "../utils/formatting";
import { DataTable, DataTableColumn } from "../modules/data-table";
import "../modules/data-table/styles.css";
import {
  extractAvailablePeriods,
  pickDefaultComparison,
  Period,
  makeQuarter
} from "../utils/periods";
import { computeDelta, fmtShort, fmtPct, toneForCost, deltaBadgeText, fmtCurrency as fmtCurrencyDelta } from "../utils/delta";
import { usePeriodStore } from "../state/periodScope";
import { buildConversionRows } from "../lib/buildConversionRows";

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

// Delta label helper functions for comparison charts
const arrow = (n: number) => (n < 0 ? '↓' : n > 0 ? '↑' : '→');
const pct = (p: number) => `${Math.abs(p).toFixed(1)}%`;
const fmt = (n: number) => {
  const s = n < 0 ? '-' : '+';
  const a = Math.abs(n);
  const t = (x: number) => Number(x.toFixed(1)).toString();
  if (a < 1_000) return `${s}${t(a)}`;
  if (a < 1_000_000) return `${s}${t(a / 1e3)}K`;
  if (a < 1_000_000_000) return `${s}${t(a / 1e6)}M`;
  return `${s}${t(a / 1e9)}B`;
};

function withDeltaOnLast(points: any[]) {
  if (points.length < 2) return { data: points, delta: null };
  const last = points[points.length - 1];
  const prev = points[points.length - 2];

  // Get the value fields (could be period1/period2 or totalCost)
  const lastValue = last.period2 ?? last.totalCost ?? last.value ?? 0;
  const prevValue = prev.period2 ?? prev.period1 ?? prev.totalCost ?? prev.value ?? 0;

  const dAbs = lastValue - prevValue;
  const dPct = prevValue === 0 ? null : (dAbs / prevValue) * 100;
  const label = dPct === null ? `NEW (${fmt(dAbs)})` : `${arrow(dAbs)} ${pct(dPct)} (${fmt(dAbs)})`;
  const tone = dAbs < 0 ? '#16a34a' : dAbs > 0 ? '#dc2626' : '#6b7280'; // green for decrease, red for increase

  return {
    data: points.map((p, i) => i === points.length - 1 ? { ...p, _deltaLabel: label, _deltaColor: tone } : p),
    delta: { dAbs, dPct, label, tone }
  };
}

// Enterprise Data Grid Component
const EnterpriseDataGrid: React.FC<{
  data: any[],
  showGrowth?: boolean,
  conversionPeriods?: {
    p1: { year: number; qtr: number };
    p2: { year: number; qtr: number };
  },
  allRows?: any[]
}> = ({ data, showGrowth = false, conversionPeriods, allRows }) => {
  // Log the incoming data
  console.log('[EnterpriseDataGrid] Received data:', {
    dataLength: data?.length,
    firstItem: data?.[0],
    dataType: typeof data,
    isArray: Array.isArray(data),
    showGrowth
  });

  // Process data - if in comparison mode, data already has delta values from buildConversionRows
  const processedData = useMemo(() => {
    if (!data) {
      return [];
    }

    // In comparison mode, data already has p1, p2, deltaAbs, deltaPct from buildConversionRows
    if (showGrowth) {
      console.log('[Growth Calculation] Data already processed by buildConversionRows:', {
        dataLength: data?.length,
        sampleRow: data?.[0],
        hasDelta: data?.[0]?.deltaAbs !== undefined
      });
      return data;
    }

    // Normal mode - just return the data as-is
    return data;
  }, [data, showGrowth]);

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
    },
    ...(showGrowth ? [
      {
        id: 'deltaAbs',
        header: 'Δ Value (P2–P1)',
        accessorKey: 'deltaAbs',
        dataType: 'numeric' as const,
        width: 150,
        formatter: (value: any) => {
          // DO NOT treat 0 as empty
          if (!Number.isFinite(value)) {
            return <span className="text-gray-400">—</span>;
          }

          const sign = value < 0 ? '-' : '+';
          const abs = Math.abs(value);
          const short =
            abs < 1_000 ? abs.toFixed(0) :
            abs < 1_000_000 ? (abs/1e3).toFixed(1).replace(/\.0$/,'') + 'K' :
            abs < 1_000_000_000 ? (abs/1e6).toFixed(1).replace(/\.0$/,'') + 'M' :
            (abs/1e9).toFixed(1).replace(/\.0$/,'') + 'B';

          const color = value < 0 ? 'text-emerald-600' : value > 0 ? 'text-rose-600' : 'text-gray-500';
          return <span className={`font-semibold ${color}`}>{`${sign}${short}`}</span>;
        },
        enableSorting: true,
        enableColumnFilter: false,
        sortingFn: 'basic',
        meta: {
          exportHeader: 'Delta Value (numeric)',
          exportValue: (row: any) => row.deltaAbs
        }
      },
      {
        id: 'deltaPct',
        header: 'Growth %',
        accessorKey: 'deltaPct',
        dataType: 'numeric' as const,
        width: 100,
        formatter: (value: any) => {
          // Handle null (which means P1 was 0)
          if (value === null) {
            return <span className="text-purple-600 font-semibold">NEW</span>;
          }

          if (!Number.isFinite(value)) {
            return <span className="text-gray-400">—</span>;
          }

          const isPositive = value >= 0;
          const arrow = isPositive ? '↑' : '↓';
          const color = isPositive ? 'text-rose-600' : 'text-emerald-600';

          return (
            <span className={`font-semibold ${color}`}>
              {arrow} {Math.abs(value).toFixed(1)}%
            </span>
          );
        },
        enableSorting: true,
        sortingFn: 'basic'
      }
    ] : [])
  ], [showGrowth]);

  // Render the enhanced DataTable with all Excel-like features
  return (
    <DataTable
      data={processedData}
      columns={columns}
      pageSize={50}
      enablePagination={true}
      enableColumnVisibility={true}
      enableExport={true}
      enableAggregation={true}
      className="mt-4"
      // Pass conversion mode props
      conversionMode={showGrowth}
      conversionPeriods={conversionPeriods}
      allRows={allRows}
    />
  );
};

export default function Dashboard() {
  const [filters, setFilters] = useState({});

  // Get mode from store
  const { mode, setMode } = usePeriodStore();

  // Local state for comparison periods
  const [firstPeriod, setFirstPeriod] = useState<{ year: number; quarter: string } | null>(null);
  const [secondPeriod, setSecondPeriod] = useState<{ year: number; quarter: string } | null>(null);

  // Fetch available filter options to extract periods
  const { data: filterOptions } = useQuery({
    queryKey: ['filter-options'],
    queryFn: fetchFilterOptions,
    staleTime: 5 * 60 * 1000,
  });

  // Extract available periods from filter options
  const availablePeriods = useMemo(() => {
    if (!filterOptions?.years || !filterOptions?.quarters) return [];

    const periods: Period[] = [];
    const years = filterOptions.years as number[];
    const quarters = filterOptions.quarters as string[];

    // Create periods for each year-quarter combination that exists in data
    for (const year of years) {
      for (const quarter of quarters) {
        const quarterNum = parseInt(quarter.replace(/[^0-9]/g, ''));
        if (quarterNum >= 1 && quarterNum <= 4) {
          periods.push(makeQuarter(year, quarterNum as 1 | 2 | 3 | 4));
        }
      }
    }

    // Sort by date
    return periods.sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [filterOptions]);

  // Auto-select default periods when available periods change
  useEffect(() => {
    if (availablePeriods.length >= 2 && !firstPeriod && !secondPeriod) {
      const defaults = pickDefaultComparison(availablePeriods);
      if (defaults.p1 && defaults.p2) {
        setFirstPeriod({
          year: defaults.p1.year,
          quarter: defaults.p1.value
        });
        setSecondPeriod({
          year: defaults.p2.year,
          quarter: defaults.p2.value
        });
      }
    }

    // Validate current selections
    if (firstPeriod && availablePeriods.length > 0) {
      const isValid = availablePeriods.some(
        p => p.year === firstPeriod.year && p.value === firstPeriod.quarter
      );
      if (!isValid && availablePeriods.length >= 2) {
        const defaults = pickDefaultComparison(availablePeriods);
        if (defaults.p1) {
          setFirstPeriod({
            year: defaults.p1.year,
            quarter: defaults.p1.value
          });
        }
      }
    }

    if (secondPeriod && availablePeriods.length > 0) {
      const isValid = availablePeriods.some(
        p => p.year === secondPeriod.year && p.value === secondPeriod.quarter
      );
      if (!isValid && availablePeriods.length >= 2) {
        const defaults = pickDefaultComparison(availablePeriods);
        if (defaults.p2) {
          setSecondPeriod({
            year: defaults.p2.year,
            quarter: defaults.p2.value
          });
        }
      }
    }

    // Disable comparison mode if less than 2 periods available
    if (availablePeriods.length < 2 && mode === 'comparison') {
      setMode('normal');
    }
  }, [availablePeriods, firstPeriod, secondPeriod, mode, setMode]);

  // Main metrics query - just use the filters directly
  // The FilterPanel already handles quarter selection
  const metricsFilters = filters;

  const {
    data: metrics,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["dashboard-metrics", metricsFilters],
    queryFn: () => fetchDashboardMetrics(metricsFilters),
    staleTime: 30 * 1000, // 30 seconds
    cacheTime: 5 * 60 * 1000, // 5 minutes
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
    enabled: mode === 'comparison' && firstPeriod !== null,
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
    enabled: mode === 'comparison' && secondPeriod !== null,
  });

  // Calculate growth percentage
  const calculateGrowth = (period1Value: number, period2Value: number) => {
    // If both are 0, no change
    if (period1Value === 0 && period2Value === 0) return 0;

    // If period1 is 0 but period2 has value, it's infinite growth - show as 100%
    if (period1Value === 0 && period2Value > 0) return 100;

    // If period2 is 0 but period1 had value, it's -100% (cost eliminated)
    if (period2Value === 0 && period1Value > 0) return -100;

    // Normal calculation
    return ((period2Value - period1Value) / period1Value) * 100;
  };

  // Format number to short scale (K, M, B) with sign
  const formatShortValue = (n: number): string => {
    const sign = n >= 0 ? '+' : '';
    const abs = Math.abs(n);

    // Helper to format with 1 decimal, removing trailing .0
    const format1Decimal = (x: number): string => {
      const formatted = x.toFixed(1);
      return formatted.endsWith('.0') ? formatted.slice(0, -2) : formatted;
    };

    if (abs === 0) return '0';
    if (abs < 1000) return `${sign}${format1Decimal(abs)}`;
    if (abs < 1e6) return `${sign}${format1Decimal(abs / 1e3)}K`;
    if (abs < 1e9) return `${sign}${format1Decimal(abs / 1e6)}M`;
    return `${sign}${format1Decimal(abs / 1e9)}B`;
  };

  // Compute diff data for badges
  type DiffData = {
    label: string;
    v1: number;
    v2: number;
    deltaAbs: number;
    deltaPct: number | null;
    direction: 'up' | 'down' | 'flat' | 'new';
    badgeText: string;
    tone: 'success' | 'danger' | 'neutral';
    tooltip: string;
  };

  const computeDiff = (label: string, v1: number, v2: number): DiffData => {
    const deltaAbs = v2 - v1;
    const deltaPct = v1 === 0 ? null : (deltaAbs / v1) * 100;

    let direction: 'up' | 'down' | 'flat' | 'new';
    if (v1 === 0 && v2 > 0) direction = 'new';
    else if (v1 > 0 && v2 === 0) direction = 'down';
    else if (deltaAbs > 0) direction = 'up';
    else if (deltaAbs < 0) direction = 'down';
    else direction = 'flat';

    // For costs, positive change (increase) is bad (danger), negative is good (success)
    const tone = direction === 'up' || direction === 'new'
      ? 'danger'
      : direction === 'down'
        ? 'success'
        : 'neutral';

    const formatPct = (pct: number) => `${pct >= 0 ? '+' : ''}${Math.abs(pct).toFixed(1)}%`;

    const badgeText = direction === 'new'
      ? `${label}: NEW (${formatShortValue(deltaAbs)})`
      : `${label}: ${formatPct(deltaPct ?? 0)} (${formatShortValue(deltaAbs)})`;

    const tooltip = `${label}: Period 1=${formatCurrency(v1, true)}, Period 2=${formatCurrency(v2, true)}, Δ=${formatShortValue(deltaAbs)} (${deltaPct !== null ? formatPct(deltaPct) : 'n/a'})`;

    return { label, v1, v2, deltaAbs, deltaPct, direction, badgeText, tone, tooltip };
  };

  // Get the most recent quarter from the data
  const getMostRecentQuarter = (quarters: any[]) => {
    if (!quarters?.length) return null;
    // Define quarter order for sorting
    const quarterOrder: { [key: string]: number } = { 'q1': 1, 'q2': 2, 'q3': 3, 'q4': 4 };
    // Sort quarters by their order and return the most recent (highest order)
    return quarters.sort((a, b) => {
      const orderA = quarterOrder[a.value?.toLowerCase()] || 0;
      const orderB = quarterOrder[b.value?.toLowerCase()] || 0;
      return orderB - orderA; // Descending order to get the most recent first
    })[0];
  }

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
  const allGLAccounts = mode === 'comparison' && secondPeriodMetrics
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
                if (availablePeriods.length < 2) return;
                const newMode = mode === 'normal' ? 'comparison' : 'normal';
                setMode(newMode);
                if (newMode === 'comparison' && availablePeriods.length >= 2) {
                  // Initialize with default periods when enabling
                  const defaults = pickDefaultComparison(availablePeriods);
                  if (defaults.p1 && defaults.p2) {
                    setFirstPeriod({ year: defaults.p1.year, quarter: defaults.p1.value });
                    setSecondPeriod({ year: defaults.p2.year, quarter: defaults.p2.value });
                  }
                }
              }}
              disabled={availablePeriods.length < 2}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                availablePeriods.length < 2
                  ? 'bg-gray-100 cursor-not-allowed'
                  : mode === 'comparison'
                    ? 'bg-[#9e1f63]'
                    : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  mode === 'comparison' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className="text-sm text-gray-500">
              {availablePeriods.length < 2
                ? `Disabled (${availablePeriods.length} period${availablePeriods.length !== 1 ? 's' : ''} available)`
                : mode === 'comparison' ? 'Enabled' : 'Disabled'}
            </span>
          </div>

          {/* Period Selectors */}
          {mode === 'comparison' && (
            <div className="flex items-center space-x-6">
              {availablePeriods.length < 2 ? (
                <div className="text-sm text-gray-500 italic">
                  Need at least two periods to compare. Current data has {availablePeriods.length} period{availablePeriods.length !== 1 ? 's' : ''}.
                </div>
              ) : (
                <>
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700">Period 1:</label>
                    <select
                      value={firstPeriod ? `${firstPeriod.year}-${firstPeriod.quarter}` : ''}
                      onChange={(e) => {
                        if (!e.target.value) return;
                        const period = availablePeriods.find(p => p.key === e.target.value);
                        if (period) {
                          setFirstPeriod({ year: period.year, quarter: period.value });
                        }
                      }}
                      className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#9e1f63]"
                    >
                      {availablePeriods.map(period => (
                        <option key={period.key} value={period.key}>
                          {period.display}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700">Period 2:</label>
                    <select
                      value={secondPeriod ? `${secondPeriod.year}-${secondPeriod.quarter}` : ''}
                      onChange={(e) => {
                        if (!e.target.value) return;
                        const period = availablePeriods.find(p => p.key === e.target.value);
                        if (period) {
                          setSecondPeriod({ year: period.year, quarter: period.value });
                        }
                      }}
                      className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#9e1f63]"
                    >
                      {availablePeriods.map(period => (
                        <option key={period.key} value={period.key}>
                          {period.display}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

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
                    {` (${fmtShort(secondPeriodMetrics.totalCost - firstPeriodMetrics.totalCost)})`}
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
            mode === 'comparison' && secondPeriodMetrics
              ? secondPeriodMetrics.totalCost || 0
              : totalCost || 0
          )}
          icon={<BarChart3 className="h-5 w-5" />}
          color="primary"
          trend={mode === 'comparison' && firstPeriodMetrics && secondPeriodMetrics ? {
            value: calculateGrowth(firstPeriodMetrics.totalCost, secondPeriodMetrics.totalCost),
            isPositive: calculateGrowth(firstPeriodMetrics.totalCost, secondPeriodMetrics.totalCost) < 0,
            deltaValue: fmtShort(secondPeriodMetrics.totalCost - firstPeriodMetrics.totalCost)
          } : null}
        />
        <MetricCard
          title="OPEX"
          value={formatCurrency(
            mode === 'comparison' && secondPeriodMetrics
              ? secondPeriodMetrics.totalOpex || 0
              : totalOpex || 0
          )}
          icon={<TrendingUp className="h-5 w-5" />}
          color="blue"
          subtitle={mode === 'comparison' && firstPeriodMetrics && secondPeriodMetrics ? (
            <span className={`font-semibold ${
              calculateGrowth(firstPeriodMetrics.totalOpex, secondPeriodMetrics.totalOpex) >= 0
                ? 'text-red-600'
                : 'text-green-600'
            }`}>
              {calculateGrowth(firstPeriodMetrics.totalOpex, secondPeriodMetrics.totalOpex) >= 0 ? '↑' : '↓'}
              {Math.abs(calculateGrowth(firstPeriodMetrics.totalOpex, secondPeriodMetrics.totalOpex)).toFixed(1)}%
              {` (${fmtShort(secondPeriodMetrics.totalOpex - firstPeriodMetrics.totalOpex)}) vs Period 1`}
            </span>
          ) : `${formatPercentage((totalOpex || 0) / (totalCost || 1))} of total`}
        />
        <MetricCard
          title="CAPEX"
          value={formatCurrency(
            mode === 'comparison' && secondPeriodMetrics
              ? secondPeriodMetrics.totalCapex || 0
              : totalCapex || 0
          )}
          icon={<TrendingDown className="h-5 w-5" />}
          color="accent"
          subtitle={mode === 'comparison' && firstPeriodMetrics && secondPeriodMetrics ? (
            <span className={`font-semibold ${
              calculateGrowth(firstPeriodMetrics.totalCapex, secondPeriodMetrics.totalCapex) >= 0
                ? 'text-red-600'
                : 'text-green-600'
            }`}>
              {calculateGrowth(firstPeriodMetrics.totalCapex, secondPeriodMetrics.totalCapex) >= 0 ? '↑' : '↓'}
              {Math.abs(calculateGrowth(firstPeriodMetrics.totalCapex, secondPeriodMetrics.totalCapex)).toFixed(1)}%
              {` (${fmtShort(secondPeriodMetrics.totalCapex - firstPeriodMetrics.totalCapex)}) vs Period 1`}
            </span>
          ) : `${formatPercentage((totalCapex || 0) / (totalCost || 1))} of total`}
        />
        <MetricCard
          title="DMASCO Operations"
          value={formatCurrency(
            mode === 'comparison' && secondPeriodMetrics
              ? secondPeriodMetrics.dmascoTotal || 0
              : dmascoTotal || 0
          )}
          icon={<Building2 className="h-5 w-5" />}
          color="secondary"
          subtitle={mode === 'comparison' && firstPeriodMetrics && secondPeriodMetrics ? (
            <span className={`font-semibold ${
              calculateGrowth(firstPeriodMetrics.dmascoTotal, secondPeriodMetrics.dmascoTotal) >= 0
                ? 'text-red-600'
                : 'text-green-600'
            }`}>
              {calculateGrowth(firstPeriodMetrics.dmascoTotal, secondPeriodMetrics.dmascoTotal) >= 0 ? '↑' : '↓'}
              {Math.abs(calculateGrowth(firstPeriodMetrics.dmascoTotal, secondPeriodMetrics.dmascoTotal)).toFixed(1)}%
              {` (${fmtShort(secondPeriodMetrics.dmascoTotal - firstPeriodMetrics.dmascoTotal)}) vs Period 1`}
            </span>
          ) : "Pharmacy, Dist, LM"}
        />
        <MetricCard
          title="PROCEED 3PL"
          value={formatCurrency(
            mode === 'comparison' && secondPeriodMetrics
              ? secondPeriodMetrics.proceed3PLTotal || 0
              : proceed3PLTotal || 0
          )}
          icon={<Truck className="h-5 w-5" />}
          color="primary"
          subtitle={mode === 'comparison' && firstPeriodMetrics && secondPeriodMetrics ? (
            <span className={`font-semibold ${
              calculateGrowth(firstPeriodMetrics.proceed3PLTotal, secondPeriodMetrics.proceed3PLTotal) >= 0
                ? 'text-red-600'
                : 'text-green-600'
            }`}>
              {calculateGrowth(firstPeriodMetrics.proceed3PLTotal, secondPeriodMetrics.proceed3PLTotal) >= 0 ? '↑' : '↓'}
              {Math.abs(calculateGrowth(firstPeriodMetrics.proceed3PLTotal, secondPeriodMetrics.proceed3PLTotal)).toFixed(1)}%
              {` (${fmtShort(secondPeriodMetrics.proceed3PLTotal - firstPeriodMetrics.proceed3PLTotal)}) vs Period 1`}
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
            {mode === 'comparison' && firstPeriodMetrics && secondPeriodMetrics && (
              <span className="text-sm font-normal ml-3 text-gray-600">
                (Comparing {firstPeriod?.quarter} vs {secondPeriod?.quarter})
              </span>
            )}
          </h3>
          <ResponsiveContainer width="100%" height={450}>
            <BarChart
              data={mode === 'comparison' && firstPeriodMetrics && secondPeriodMetrics ?
                // Comparison mode: Show each quarter with comparison data
                [...(costByQuarter || [])].sort((a, b) => {
                  const orderA = {'q1':1,'q2':2,'q3':3,'q4':4}[a.value?.toLowerCase()]||0;
                  const orderB = {'q1':1,'q2':2,'q3':3,'q4':4}[b.value?.toLowerCase()]||0;
                  return orderA - orderB;
                }).map(q => {
                  const period1Data = firstPeriodMetrics.costByQuarter?.find((p1q: any) => p1q.value === q.value);
                  const period2Data = secondPeriodMetrics.costByQuarter?.find((p2q: any) => p2q.value === q.value);
                  const period1Cost = period1Data?.totalCost || 0;
                  const period2Cost = period2Data?.totalCost || 0;
                  const growth = calculateGrowth(period1Cost, period2Cost);

                  return {
                    ...q,
                    period1Cost,
                    period2Cost,
                    growth, // Show growth for ALL quarters
                    // Add formatted labels for easy access in LabelList
                    period2Label: period2Cost > 0 ? formatCurrency(period2Cost, true) : null,
                    growthLabel: growth !== null && growth !== undefined ?
                      `${growth > 0 ? '↑' : growth < 0 ? '↓' : ''} ${growth > 0 ? '+' : ''}${growth.toFixed(1)}%` : null
                  };
                }) :
                // Normal mode - create a sorted copy
                [...(costByQuarter || [])].sort((a, b) => {
                  const orderA = {'q1':1,'q2':2,'q3':3,'q4':4}[a.value?.toLowerCase()]||0;
                  const orderB = {'q1':1,'q2':2,'q3':3,'q4':4}[b.value?.toLowerCase()]||0;
                  return orderA - orderB;
                })
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
              {mode === 'comparison' && firstPeriodMetrics && secondPeriodMetrics ? (
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
                      content={(props) => {
                        const { x, y, width, value } = props;
                        if (!value || value === 0) return null;

                        return (
                          <text
                            x={x + width / 2}
                            y={y - 8}
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
                        );
                      }}
                    />
                  </Bar>
                  <Bar
                    dataKey="period2Cost"
                    name={`Period 2 (${secondPeriod?.quarter})`}
                    fill={PROCEED_COLORS.primary}
                  >
                    {/* First LabelList for the value */}
                    <LabelList
                      dataKey="period2Cost"
                      position="top"
                      content={(props) => {
                        const { x, y, width, value } = props;
                        if (!value || value === 0) return null;

                        return (
                          <text
                            x={x + width / 2}
                            y={y - 8}
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
                        );
                      }}
                    />
                    {/* Second LabelList for the growth percentage */}
                    <LabelList
                      dataKey="growth"
                      position="top"
                      content={(props) => {
                        const { x, y, width, index } = props;
                        // Calculate growth based on total period costs, not individual quarters
                        const period1Total = firstPeriodMetrics?.totalCost || 0;
                        const period2Total = secondPeriodMetrics?.totalCost || 0;
                        const overallGrowth = calculateGrowth(period1Total, period2Total);

                        // Apply the same growth to all Period 2 bars
                        const chartData = mode === 'comparison' && firstPeriodMetrics && secondPeriodMetrics ?
                          costByQuarter?.map(q => {
                            const period2Data = secondPeriodMetrics.costByQuarter?.find((p2q: any) => p2q.value === q.value);
                            const period2Cost = period2Data?.totalCost || 0;

                            return {
                              quarter: q.value,
                              period2Cost,
                              growth: period2Cost > 0 ? overallGrowth : null  // Only show growth on quarters that have Period 2 data
                            };
                          }) : [];

                        const dataPoint = chartData?.[index];
                        const growthValue = dataPoint?.growth;

                        // Don't show if period2 has no data
                        if (dataPoint?.period2Cost === 0) return null;

                        // Don't show if no growth value
                        if (growthValue === null || growthValue === undefined) return null;

                        return (
                          <text
                            x={x + width / 2}
                            y={y - 28}
                            fill={growthValue > 0 ? '#dc2626' : growthValue < 0 ? '#16a34a' : '#6b7280'}
                            textAnchor="middle"
                            fontSize={13}
                            fontWeight={800}
                            stroke="white"
                            strokeWidth={3}
                            paintOrder="stroke"
                            style={{
                              textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                              letterSpacing: '-0.02em'
                            }}
                          >
                            {`${growthValue > 0 ? '↑' : growthValue < 0 ? '↓' : ''}${growthValue > 0 ? '+' : ''}${growthValue.toFixed(1)}% (${fmtShort(period2Total - period1Total)})`}
                          </text>
                        );
                      }}
                    />
                  </Bar>

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
            {mode === 'comparison' && (
              <span className="text-sm font-normal ml-3 text-gray-600">
                (Comparison: {firstPeriod?.quarter} vs {secondPeriod?.quarter})
              </span>
            )}
          </h3>
          {mode === 'comparison' && firstPeriodMetrics && secondPeriodMetrics ? (
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
                          <Cell key={`cell-${index}`} fill={index === 0 ? PROCEED_COLORS.blue : PROCEED_COLORS.gray} />
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
                  <div>Period 2: {secondPeriod?.quarter}</div>
                  <div className="flex justify-center gap-4 mt-2">
                    {(() => {
                      const opexDiff = computeDiff('OPEX', firstPeriodMetrics.totalOpex || 0, secondPeriodMetrics.totalOpex || 0);
                      const capexDiff = computeDiff('CAPEX', firstPeriodMetrics.totalCapex || 0, secondPeriodMetrics.totalCapex || 0);

                      return (
                        <>
                          <div
                            className={`text-xs font-medium px-2 py-1 rounded ${
                              opexDiff.tone === 'danger'
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : opexDiff.tone === 'success'
                                  ? 'bg-green-50 text-green-700 border border-green-200'
                                  : 'bg-gray-50 text-gray-700 border border-gray-200'
                            }`}
                            title={opexDiff.tooltip}
                          >
                            {opexDiff.direction === 'up' && '↑'}
                            {opexDiff.direction === 'down' && '↓'}
                            {opexDiff.direction === 'flat' && '→'}
                            {opexDiff.direction === 'new' && '↑'}
                            {' '}{opexDiff.badgeText}
                          </div>
                          <div
                            className={`text-xs font-medium px-2 py-1 rounded ${
                              capexDiff.tone === 'danger'
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : capexDiff.tone === 'success'
                                  ? 'bg-green-50 text-green-700 border border-green-200'
                                  : 'bg-gray-50 text-gray-700 border border-gray-200'
                            }`}
                            title={capexDiff.tooltip}
                          >
                            {capexDiff.direction === 'up' && '↑'}
                            {capexDiff.direction === 'down' && '↓'}
                            {capexDiff.direction === 'flat' && '→'}
                            {capexDiff.direction === 'new' && '↑'}
                            {' '}{capexDiff.badgeText}
                          </div>
                        </>
                      );
                    })()}
                  </div>
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
                          <Cell key={`cell-${index}`} fill={index === 0 ? PROCEED_COLORS.blue : PROCEED_COLORS.gray} />
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
                    value: mode === 'comparison' && secondPeriodMetrics
                      ? secondPeriodMetrics.totalOpex || 0
                      : totalOpex || 0
                  },
                  {
                    name: "CAPEX",
                    value: mode === 'comparison' && secondPeriodMetrics
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

                  // Position for values inside the slice
                  const sliceRadius = innerRadius + (outerRadius - innerRadius) * 0.5;
                  const sliceX = cx + sliceRadius * Math.cos(-midAngle * RADIAN);
                  const sliceY = cy + sliceRadius * Math.sin(-midAngle * RADIAN);

                  // Position for external label
                  const radius = outerRadius + 30;
                  const x = cx + radius * Math.cos(-midAngle * RADIAN);
                  const y = cy + radius * Math.sin(-midAngle * RADIAN);

                  return (
                    <g>
                      {/* Values and percentages inside the slice */}
                      <text x={sliceX} y={sliceY - 8} fill="white" textAnchor="middle" dominantBaseline="central"
                            style={{ fontWeight: 'bold', fontSize: 14 }}>
                        {formatCurrency(value, true).replace('SAR ', '')}
                      </text>
                      <text x={sliceX} y={sliceY + 8} fill="white" textAnchor="middle" dominantBaseline="central"
                            style={{ fontWeight: 'bold', fontSize: 12 }}>
                        ({(percent * 100).toFixed(1)}%)
                      </text>
                      {/* Category name as external label */}
                      <text
                        x={x}
                        y={y}
                        fill={
                          index === 0
                            ? PROCEED_COLORS.blue
                            : PROCEED_COLORS.gray
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
                    </g>
                  );
                }}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {[
                  {
                    name: "OPEX",
                    value: mode === 'comparison' && secondPeriodMetrics
                      ? secondPeriodMetrics.totalOpex || 0
                      : totalOpex || 0
                  },
                  {
                    name: "CAPEX",
                    value: mode === 'comparison' && secondPeriodMetrics
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
                          : "#424046"
                      }
                    />
                  ))}
              </Pie>
              <Pie
                data={[
                  {
                    name: "OPEX",
                    value: mode === 'comparison' && secondPeriodMetrics
                      ? secondPeriodMetrics.totalOpex || 0
                      : totalOpex || 0,
                    label: `${formatCurrency(
                      mode === 'comparison' && secondPeriodMetrics
                        ? secondPeriodMetrics.totalOpex || 0
                        : totalOpex || 0,
                      true
                    ).replace("SAR ", "")}`,
                  },
                  {
                    name: "CAPEX",
                    value: mode === 'comparison' && secondPeriodMetrics
                      ? secondPeriodMetrics.totalCapex || 0
                      : totalCapex || 0,
                    label: `${formatCurrency(
                      mode === 'comparison' && secondPeriodMetrics
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

                  const opexVal = mode === 'comparison' && secondPeriodMetrics
                    ? secondPeriodMetrics.totalOpex || 0
                    : totalOpex || 0;
                  const capexVal = mode === 'comparison' && secondPeriodMetrics
                    ? secondPeriodMetrics.totalCapex || 0
                    : totalCapex || 0;
                  const total = opexVal + capexVal;
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
            {mode === 'comparison' ? (
              <span className="text-sm font-normal ml-3 text-gray-600">
                (Comparison: {firstPeriod?.quarter} vs {secondPeriod?.quarter})
              </span>
            ) : (
              !mode === 'comparison' && costByQuarter?.length > 0 && (
                <span className="text-sm font-normal ml-3 text-gray-600">
                  ({getMostRecentQuarter(costByQuarter)?.value?.toUpperCase() || 'Latest Quarter'})
                </span>
              )
            )}
          </h3>
          {mode === 'comparison' && firstPeriodMetrics && secondPeriodMetrics ? (
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
                  <div>Period 2: {secondPeriod?.quarter}</div>
                  <div className="flex justify-center gap-4 mt-2">
                    {(() => {
                      const p1Warehouse = firstPeriodMetrics.costByQuarter?.reduce(
                        (sum: number, q: any) => sum + (q.warehouseCost || 0) + (q.proceed3PLWHCost || 0), 0) || 0;
                      const p2Warehouse = secondPeriodMetrics.costByQuarter?.reduce(
                        (sum: number, q: any) => sum + (q.warehouseCost || 0) + (q.proceed3PLWHCost || 0), 0) || 0;
                      const p1Transport = firstPeriodMetrics.costByQuarter?.reduce(
                        (sum: number, q: any) => sum + (q.transportationCost || 0) + (q.proceed3PLTRSCost || 0), 0) || 0;
                      const p2Transport = secondPeriodMetrics.costByQuarter?.reduce(
                        (sum: number, q: any) => sum + (q.transportationCost || 0) + (q.proceed3PLTRSCost || 0), 0) || 0;

                      const warehouseDiff = computeDiff('Warehouse', p1Warehouse, p2Warehouse);
                      const transportDiff = computeDiff('Transportation', p1Transport, p2Transport);

                      return (
                        <>
                          <div
                            className={`text-xs font-medium px-2 py-1 rounded ${
                              warehouseDiff.tone === 'danger'
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : warehouseDiff.tone === 'success'
                                  ? 'bg-green-50 text-green-700 border border-green-200'
                                  : 'bg-gray-50 text-gray-700 border border-gray-200'
                            }`}
                            title={warehouseDiff.tooltip}
                          >
                            {warehouseDiff.direction === 'up' && '↑'}
                            {warehouseDiff.direction === 'down' && '↓'}
                            {warehouseDiff.direction === 'flat' && '→'}
                            {warehouseDiff.direction === 'new' && '↑'}
                            {' '}{warehouseDiff.badgeText}
                          </div>
                          <div
                            className={`text-xs font-medium px-2 py-1 rounded ${
                              transportDiff.tone === 'danger'
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : transportDiff.tone === 'success'
                                  ? 'bg-green-50 text-green-700 border border-green-200'
                                  : 'bg-gray-50 text-gray-700 border border-gray-200'
                            }`}
                            title={transportDiff.tooltip}
                          >
                            {transportDiff.direction === 'up' && '↑'}
                            {transportDiff.direction === 'down' && '↓'}
                            {transportDiff.direction === 'flat' && '→'}
                            {transportDiff.direction === 'new' && '↑'}
                            {' '}{transportDiff.badgeText}
                          </div>
                        </>
                      );
                    })()}
                  </div>
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
                  const dataSource = mode === 'comparison' && secondPeriodMetrics
                    ? secondPeriodMetrics.costByQuarter
                    : costByQuarter;

                  // In normal mode, only use the most recent quarter
                  const quartersToProcess = !mode === 'comparison'
                    ? [getMostRecentQuarter(dataSource)].filter(Boolean)
                    : dataSource;

                  // Aggregate warehouse and transportation costs
                  const warehouseTotal =
                    quartersToProcess?.reduce(
                      (sum, q) =>
                        sum +
                        (q.warehouseCost || 0) +
                        (q.proceed3PLWHCost || 0),
                      0,
                    ) || 0;
                  const transportationTotal =
                    quartersToProcess?.reduce(
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

                  // Position for values inside the slice
                  const sliceRadius = innerRadius + (outerRadius - innerRadius) * 0.5;
                  const sliceX = cx + sliceRadius * Math.cos(-midAngle * RADIAN);
                  const sliceY = cy + sliceRadius * Math.sin(-midAngle * RADIAN);

                  // Position for external label
                  const radius = outerRadius + 30;
                  const x = cx + radius * Math.cos(-midAngle * RADIAN);
                  const y = cy + radius * Math.sin(-midAngle * RADIAN);

                  return (
                    <g>
                      {/* Values and percentages inside the slice */}
                      <text x={sliceX} y={sliceY - 8} fill="white" textAnchor="middle" dominantBaseline="central"
                            style={{ fontWeight: 'bold', fontSize: 14 }}>
                        {formatCurrency(value, true).replace('SAR ', '')}
                      </text>
                      <text x={sliceX} y={sliceY + 8} fill="white" textAnchor="middle" dominantBaseline="central"
                            style={{ fontWeight: 'bold', fontSize: 12 }}>
                        ({(percent * 100).toFixed(1)}%)
                      </text>
                      {/* Category name as external label */}
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
                    </g>
                  );
                }}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {(() => {
                  // Use comparison mode data if enabled
                  const dataSource = mode === 'comparison' && secondPeriodMetrics
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
            {mode === 'comparison' ? (
              <span className="text-sm font-normal ml-3 text-gray-600">
                (Comparison: {firstPeriod?.quarter} vs {secondPeriod?.quarter})
              </span>
            ) : (
              !mode === 'comparison' && costByQuarter?.length > 0 && (
                <span className="text-sm font-normal ml-3 text-gray-600">
                  ({getMostRecentQuarter(costByQuarter)?.value?.toUpperCase() || 'Latest Quarter'})
                </span>
              )
            )}
          </h3>
          <ResponsiveContainer width="100%" height={350}>
            <ComposedChart
              data={mode === 'comparison' && firstPeriodMetrics && secondPeriodMetrics ?
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
                // Normal mode - use only most recent quarter
                (() => {
                  const dataSource = costByQuarter;

                  // In normal mode, only use the most recent quarter
                  const recentQuarter = getMostRecentQuarter(dataSource);
                  const quartersToProcess = recentQuarter ? [recentQuarter] : [];

                const pharmaciesTotal =
                  quartersToProcess?.reduce(
                    (sum, q) => sum + (q.pharmaciesCost || 0),
                    0,
                  ) || 0;
                const distributionTotal =
                  quartersToProcess?.reduce(
                    (sum, q) => sum + (q.distributionCost || 0),
                    0,
                  ) || 0;
                const lastMileTotal =
                  quartersToProcess?.reduce(
                    (sum, q) => sum + (q.lastMileCost || 0),
                    0,
                  ) || 0;
                const damascoTotal =
                  pharmaciesTotal + distributionTotal + lastMileTotal;

                const proceed3PLWHTotal =
                  quartersToProcess?.reduce(
                    (sum, q) => sum + (q.proceed3PLWHCost || 0),
                    0,
                  ) || 0;
                const proceed3PLTRSTotal =
                  quartersToProcess?.reduce(
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
              margin={{ top: 60, right: 30, left: 20, bottom: 60 }}
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
              {mode === 'comparison' && firstPeriodMetrics && secondPeriodMetrics ? (
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
                                {arrow(dataPoint.growth)} {pct(dataPoint.growth)} ({fmt(dataPoint.period2 - dataPoint.period1)})
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
              <Legend
                wrapperStyle={CHART_STYLES.legend.wrapperStyle}
                payload={[
                  { value: 'Damasco Operations', type: 'rect', color: PROCEED_COLORS.darkRed },
                  { value: 'PROCEED 3PL', type: 'rect', color: PROCEED_COLORS.blue }
                ]}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* 3. Cost Efficiency Metrics - Third Visualization */}
        <div className="chart-container">
          <h3 className="text-lg font-semibold mb-4">
            Department Cost Trend
            {mode === 'comparison' ? (
              <span className="text-sm font-normal ml-3 text-gray-600">
                (Comparison: {firstPeriod?.quarter} vs {secondPeriod?.quarter})
              </span>
            ) : (
              !mode === 'comparison' && costByQuarter?.length > 0 && (
                <span className="text-sm font-normal ml-3 text-gray-600">
                  ({getMostRecentQuarter(costByQuarter)?.value?.toUpperCase() || 'Latest Quarter'})
                </span>
              )
            )}
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart
              data={mode === 'comparison' && firstPeriodMetrics && secondPeriodMetrics
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
                : // Normal mode - show only most recent quarter
                (() => {
                  const recentQ = getMostRecentQuarter(costByQuarter);
                  return recentQ ? [{
                    quarter: recentQ.value.toUpperCase(),
                    Pharmacies: recentQ.pharmaciesCost || 0,
                    Distribution: recentQ.distributionCost || 0,
                    "Last Mile": recentQ.lastMileCost || 0,
                    "PROCEED 3PL": (recentQ.proceed3PLWHCost || 0) + (recentQ.proceed3PLTRSCost || 0),
                  }] : [];
                })()
              }
              margin={{ top: 60, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid {...CHART_STYLES.grid} />
              <XAxis
                dataKey={mode === 'comparison' && firstPeriodMetrics && secondPeriodMetrics ? "name" : "quarter"}
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
              {mode === 'comparison' && firstPeriodMetrics && secondPeriodMetrics ? (
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
                                {arrow(dataPoint.growth)} {pct(dataPoint.growth)} ({fmt(dataPoint.period2 - dataPoint.period1)})
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
                          y={y - 22}
                          fill="#1a1a1a"
                          textAnchor="middle"
                          fontSize={13}
                          fontWeight="bold"
                          stroke="white"
                          strokeWidth={3}
                          paintOrder="stroke"
                        >
                          {formatCurrency(value, true)}
                        </text>
                        <text
                          x={x + width / 2}
                          y={y - 6}
                          fill="#424046"
                          textAnchor="middle"
                          fontSize={11}
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
                          y={y - 22}
                          fill="#1a1a1a"
                          textAnchor="middle"
                          fontSize={13}
                          fontWeight="bold"
                          stroke="white"
                          strokeWidth={3}
                          paintOrder="stroke"
                        >
                          {formatCurrency(value, true)}
                        </text>
                        <text
                          x={x + width / 2}
                          y={y - 6}
                          fill="#424046"
                          textAnchor="middle"
                          fontSize={11}
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
                          y={y - 22}
                          fill="#1a1a1a"
                          textAnchor="middle"
                          fontSize={13}
                          fontWeight="bold"
                          stroke="white"
                          strokeWidth={3}
                          paintOrder="stroke"
                        >
                          {formatCurrency(value, true)}
                        </text>
                        <text
                          x={x + width / 2}
                          y={y - 6}
                          fill="#424046"
                          textAnchor="middle"
                          fontSize={11}
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
                          y={y - 22}
                          fill="#1a1a1a"
                          textAnchor="middle"
                          fontSize={13}
                          fontWeight="bold"
                          stroke="white"
                          strokeWidth={3}
                          paintOrder="stroke"
                        >
                          {formatCurrency(value, true)}
                        </text>
                        <text
                          x={x + width / 2}
                          y={y - 6}
                          fill="#424046"
                          textAnchor="middle"
                          fontSize={11}
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
          {mode === 'comparison' && (
            <span className="text-sm font-normal ml-3 text-gray-600">
              (Comparison: {firstPeriod?.quarter} vs {secondPeriod?.quarter})
            </span>
          )}
        </h3>
        <ResponsiveContainer width="100%" height={600}>
          {mode === 'comparison' && firstPeriodMetrics && secondPeriodMetrics ? (
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
              margin={{ top: 80, right: 40, left: 20, bottom: 120 }}
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
                dot={{ r: 4, fill: PROCEED_COLORS.secondary }}
                label={{
                  content: (props: any) => {
                    const { x, y, value, index, viewBox, payload } = props;
                    if (!value || value === 0) return null;

                    // Get total number of data points to detect last point
                    const dataLength = 10; // Top 10 categories shown
                    const isFirstPoint = index === 0;
                    const isLastPoint = index === dataLength - 1;

                    // Period 1 is older, so labels go BELOW data points
                    const chartWidth = viewBox?.width || 800;
                    const chartHeight = viewBox?.height || 600;
                    const leftMargin = 90; // Y-axis width
                    const bottomMargin = 120; // X-axis height

                    // Enhanced collision detection
                    const isNearYAxis = x < leftMargin + 30;
                    const isNearRightEdge = x > chartWidth - 120;
                    const isNearXAxis = y > chartHeight - bottomMargin - 60;
                    const isVeryNearXAxis = y > chartHeight - bottomMargin - 40; // Critical proximity

                    // Check for adjacent label proximity (Other and Insurance typically at indices 7-8)
                    const isOtherOrInsurance = index >= 6 && index <= 7;  // Other is 6, Insurance is 7
                    const needsAdjacentOffset = isOtherOrInsurance;

                    // Calculate smart offset positions
                    let offsetX = 0;
                    let textAnchor = "middle";
                    let rotation = 0;

                    // SPECIAL HANDLING FOR EDGE CASES
                    if (isFirstPoint && isNearYAxis) {
                      // Labor Salary (leftmost) - move down-right
                      offsetX = 60;
                      textAnchor = "start";
                      rotation = -30; // Angle down-right
                    } else if (isLastPoint && isNearRightEdge) {
                      // Governmental Fees (rightmost) - move down-left
                      offsetX = -60;
                      textAnchor = "end";
                      rotation = 30; // Angle down-left
                    } else if (index === 1 || index === 2) {
                      // Points near axis labels (e.g., Petrol)
                      offsetX = index === 1 ? 45 : -45;
                      rotation = index === 1 ? -25 : 25;
                    } else if (index >= 3 && index <= 6) {
                      // Middle points that often collide (e.g., Maintenance at index 4-5)
                      // Check for X-axis proximity and adjust accordingly
                      if (isVeryNearXAxis) {
                        // Strong displacement for points very close to X-axis
                        offsetX = index % 2 === 0 ? 50 : -50;
                        rotation = index % 2 === 0 ? -30 : 30; // Angle outward at 30°
                      } else if (isNearXAxis) {
                        // Moderate displacement
                        offsetX = index % 2 === 0 ? 40 : -40;
                        rotation = index % 2 === 0 ? -20 : 20;
                      } else {
                        // Standard alternating pattern
                        offsetX = index % 2 === 0 ? -30 : 30;
                      }
                    } else if (needsAdjacentOffset) {
                      // Special handling for Other and Insurance (indices 6-7)
                      // These labels often collide due to proximity
                      if (index === 6) {
                        // "Other" - displace left and angle
                        offsetX = -45;
                        rotation = 25;
                        textAnchor = "end";
                      } else if (index === 7) {
                        // "Insurance" - displace right and angle
                        offsetX = 45;
                        rotation = -25;
                        textAnchor = "start";
                      }
                    } else {
                      // Standard positioning for remaining points
                      offsetX = index % 3 === 0 ? -25 : index % 3 === 1 ? 0 : 25;
                    }

                    // Period 1 (older) goes BELOW
                    let baseOffsetY = 40;

                    // X-axis label collision detection
                    // X-axis labels are positioned at a 45-degree angle below the chart
                    const xAxisLabelTop = chartHeight - bottomMargin + 5;
                    const labelHeight = 15; // Approximate label height
                    const labelWidth = 50; // Approximate width for value labels
                    const minimumClearance = 16; // Minimum 16px clearance from axis text

                    // Check if label would collide with X-axis category text
                    const labelBottom = y + baseOffsetY + labelHeight/2;
                    const wouldCollideWithXAxisLabel = labelBottom > (xAxisLabelTop - minimumClearance);

                    // For "Other" category specifically, check horizontal collision too
                    const categoryName = payload?.name || '';
                    const isOtherCategory = categoryName === 'Other' || index === 6;  // Other is index 6, before Insurance

                    // Force "Other" category to always be treated as colliding for better placement
                    const otherCategoryNeedsDisplacement = isOtherCategory;

                    // Special Y offset adjustments
                    if (isFirstPoint && isNearYAxis) {
                      baseOffsetY = 35; // Less vertical, more horizontal
                    } else if (isLastPoint && isNearRightEdge) {
                      baseOffsetY = 35;
                    } else if (otherCategoryNeedsDisplacement) {
                      // Special handling for "Other" category - always displace to avoid X-axis text
                      // Apply leftward displacement to avoid the "Other" text on X-axis
                      baseOffsetY = 75; // Move further down to go under "Other" label
                      offsetX = -110; // Extended left shift to position well clear of "Other" text
                      rotation = 0; // Keep horizontal for readability
                      textAnchor = "end"; // Align text to the right of position
                    } else if (needsAdjacentOffset && index !== 6) {
                      // Handle Insurance proximity issues (Other already handled above)
                      if (index === 7) {
                        // Insurance
                        if (wouldCollideWithXAxisLabel) {
                          baseOffsetY = 50;
                          offsetX = 40; // Shift right
                          rotation = -15;
                          textAnchor = "start";
                        } else {
                          baseOffsetY = 48;
                          offsetX = 30;
                          textAnchor = "start";
                        }
                      }
                    } else if (wouldCollideWithXAxisLabel) {
                      // Universal collision prevention with smart directional displacement
                      baseOffsetY = 45; // Moderate vertical displacement

                      // Determine displacement direction based on position in chart
                      // Categories on left half shift left, right half shift right
                      const chartCenterX = chartWidth / 2;
                      const shouldShiftLeft = x < chartCenterX;

                      // Apply horizontal displacement with leader line
                      offsetX = shouldShiftLeft ? -45 : 45;
                      rotation = 0; // Keep text horizontal for readability
                      textAnchor = shouldShiftLeft ? "end" : "start";
                    } else if (isVeryNearXAxis) {
                      // Critical X-axis proximity - reduce vertical, increase horizontal
                      baseOffsetY = 25;
                      offsetX = offsetX * 1.5; // Further increase horizontal spread
                    } else if (isNearXAxis) {
                      baseOffsetY = 30;
                      offsetX = offsetX * 1.3; // Moderate horizontal increase
                    }

                    // Apply standard vertical variation, but skip for Other/Insurance as they have custom offsets
                    const offsetY = needsAdjacentOffset ? baseOffsetY : baseOffsetY + (index % 2 === 0 ? 0 : 15);

                    // Final collision check - if still too close after all adjustments, push down more
                    const finalY = y + offsetY;
                    if (finalY > xAxisLabelTop - 20) {
                      // Emergency displacement - push significantly outward and down
                      baseOffsetY += 25;
                      offsetX = offsetX * 1.5;
                      rotation = rotation === 0 ? 35 : rotation;
                    }

                    const labelX = x + offsetX;
                    const labelY = y + baseOffsetY;

                    // Calculate curved leader line - always show when displaced horizontally
                    const needsLeaderLine = Math.abs(offsetX) > 20 || wouldCollideWithXAxisLabel;
                    // Special curve for "Other" category to ensure it goes under the X-axis label
                    const midX = otherCategoryNeedsDisplacement ? x + offsetX * 0.5 : x + offsetX * 0.6;
                    const midY = otherCategoryNeedsDisplacement ? y + baseOffsetY * 0.6 : y + baseOffsetY * 0.4;

                    return (
                      <g>
                        {/* Curved leader line for Period 1 - show when displaced */}
                        {needsLeaderLine && (
                          <path
                            d={`M ${x} ${y} Q ${midX} ${midY} ${labelX} ${labelY - 8}`}
                            stroke={PROCEED_COLORS.secondary}
                            strokeWidth={1}
                            strokeDasharray="2,2"
                            fill="none"
                            opacity={0.35}
                          />
                        )}
                        {/* Connector dot - only show with leader line */}
                        {needsLeaderLine && (
                          <circle
                            cx={labelX}
                            cy={labelY - 8}
                            r={2}
                            fill={PROCEED_COLORS.secondary}
                            opacity={0.35}
                          />
                        )}
                        {/* Value label - gray for Period 1 */}
                        <text
                          x={labelX}
                          y={labelY}
                          fill={PROCEED_COLORS.secondary}
                          textAnchor={textAnchor}
                          fontSize={11}
                          fontWeight={600}
                          stroke="white"
                          strokeWidth={3}
                          paintOrder="stroke"
                          transform={rotation !== 0 ? `rotate(${rotation} ${labelX} ${labelY})` : undefined}
                        >
                          {formatCurrency(value, true)}
                        </text>
                      </g>
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
                dot={{ r: 4, fill: PROCEED_COLORS.primary }}
                label={{
                  content: (props: any) => {
                    const { x, y, value, index, viewBox } = props;
                    if (!value || value === 0) return null;

                    // Get total number of data points to detect last point
                    const dataLength = 10; // Top 10 categories shown
                    const isFirstPoint = index === 0;
                    const isLastPoint = index === dataLength - 1;

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

                    // Period 2 is most recent, so labels go ABOVE data points
                    // Reuse chart dimensions from outer scope or recalculate
                    const p2ChartWidth = viewBox?.width || 800;
                    const p2ChartHeight = viewBox?.height || 600;
                    const p2LeftMargin = 90; // Y-axis width
                    const p2TopMargin = 80; // Top margin

                    // Enhanced collision detection for Period 2
                    const p2IsNearYAxis = x < p2LeftMargin + 30;
                    const p2IsNearRightEdge = x > p2ChartWidth - 120;
                    const p2IsNearTop = y < p2TopMargin + 40;

                    // Calculate smart offset positions
                    let offsetX = 0;
                    let textAnchor = "middle";
                    let rotation = 0;
                    let growthOffsetX = 0;
                    let growthOffsetY = 16;

                    // SPECIAL HANDLING FOR EDGE CASES
                    if (isFirstPoint && p2IsNearYAxis) {
                      // Labor Salary (leftmost) - move up-left corner
                      offsetX = -45;
                      textAnchor = "end";
                      rotation = 35; // Angle up-left
                      // Growth percentage directly under Period 2 value
                      growthOffsetX = 0;  // Align with Period 2 label
                      growthOffsetY = 18; // Just below Period 2 value
                    } else if (isLastPoint && p2IsNearRightEdge) {
                      // Governmental Fees (rightmost) - move inside chart boundaries
                      offsetX = -65; // Move left to keep inside chart
                      textAnchor = "end";
                      rotation = 30; // Angle up-left
                      // Growth percentage directly under Period 2 value
                      growthOffsetX = 0;  // Align with Period 2 label
                      growthOffsetY = 18; // Just below Period 2 value
                    } else if (index === 1 || index === 2) {
                      // Points near axis labels
                      offsetX = index === 1 ? 45 : -45;
                      rotation = index === 1 ? -25 : 25;
                      growthOffsetX = 0;
                    } else {
                      // Standard positioning
                      offsetX = index % 3 === 0 ? -30 : index % 3 === 1 ? 0 : 30;
                    }

                    // Period 2 (most recent) goes ABOVE
                    let p2BaseOffsetY = -55;

                    // Special Y offset for edge points
                    if (isFirstPoint && p2IsNearYAxis) {
                      p2BaseOffsetY = -45; // Adjust for top-left positioning
                    } else if (isLastPoint && p2IsNearRightEdge) {
                      p2BaseOffsetY = -50; // Increased upward offset to ensure visibility
                    } else if (p2IsNearTop) {
                      p2BaseOffsetY = -38;
                      offsetX = offsetX * 1.5; // Increase horizontal spread
                    }

                    const offsetY = p2BaseOffsetY - (index % 2 === 0 ? 0 : 18);
                    const labelX = x + offsetX;
                    const labelY = y + offsetY;

                    // Calculate curved leader line for better visual flow
                    const midX = x + offsetX * 0.6;
                    const midY = y + offsetY * 0.4;

                    return (
                      <g>
                        {/* Curved leader line for Period 2 */}
                        <path
                          d={`M ${x} ${y} Q ${midX} ${midY} ${labelX} ${labelY + 8}`}
                          stroke={PROCEED_COLORS.primary}
                          strokeWidth={1}
                          strokeDasharray="2,2"
                          fill="none"
                          opacity={0.35}
                        />
                        {/* Connector dot */}
                        <circle
                          cx={labelX}
                          cy={labelY + 8}
                          r={2}
                          fill={PROCEED_COLORS.primary}
                          opacity={0.35}
                        />
                        {/* Value label - reddish for Period 2 */}
                        <text
                          x={labelX}
                          y={labelY}
                          fill={PROCEED_COLORS.primary}
                          textAnchor={textAnchor}
                          fontSize={12}
                          fontWeight={700}
                          stroke="white"
                          strokeWidth={3}
                          paintOrder="stroke"
                          transform={rotation !== 0 ? `rotate(${rotation} ${labelX} ${labelY})` : undefined}
                        >
                          {formatCurrency(value, true)}
                        </text>

                        {/* Growth percentage with smart positioning */}
                        {dataPoint?.growth !== undefined && (
                          <g>
                            {/* For Labor Salary, place growth % directly under Period 2 value */}
                            {isFirstPoint && (
                              <>
                                {/* Small connector line from Period 2 label to growth % */}
                                <line
                                  x1={labelX}
                                  y1={labelY + 8}
                                  x2={labelX}
                                  y2={labelY + 16}
                                  stroke={dataPoint.growth >= 0 ? '#dc2626' : '#16a34a'}
                                  strokeWidth={0.5}
                                  opacity={0.3}
                                />
                                <text
                                  x={labelX}
                                  y={labelY + growthOffsetY}
                                  fill={dataPoint.growth >= 0 ? '#dc2626' : '#16a34a'}
                                  textAnchor={textAnchor}
                                  fontSize={10}
                                  fontWeight={700}
                                  stroke="white"
                                  strokeWidth={2.5}
                                  paintOrder="stroke"
                                  transform={rotation !== 0 ? `rotate(${rotation} ${labelX} ${labelY + growthOffsetY})` : undefined}
                                >
                                  {arrow(dataPoint.growth)} {pct(dataPoint.growth)} ({fmt(dataPoint.period2 - dataPoint.period1)})
                                </text>
                              </>
                            )}

                            {/* For Governmental Fees (last point), keep similar approach */}
                            {isLastPoint && (
                              <>
                                <line
                                  x1={labelX}
                                  y1={labelY + 8}
                                  x2={labelX}
                                  y2={labelY + 16}
                                  stroke={dataPoint.growth >= 0 ? '#dc2626' : '#16a34a'}
                                  strokeWidth={0.5}
                                  opacity={0.3}
                                />
                                <text
                                  x={labelX}
                                  y={labelY + growthOffsetY}
                                  fill={dataPoint.growth >= 0 ? '#dc2626' : '#16a34a'}
                                  textAnchor={textAnchor}
                                  fontSize={10}
                                  fontWeight={700}
                                  stroke="white"
                                  strokeWidth={2.5}
                                  paintOrder="stroke"
                                  transform={rotation !== 0 ? `rotate(${rotation} ${labelX} ${labelY + growthOffsetY})` : undefined}
                                >
                                  {arrow(dataPoint.growth)} {pct(dataPoint.growth)} ({fmt(dataPoint.period2 - dataPoint.period1)})
                                </text>
                              </>
                            )}

                            {/* Standard positioning for middle points */}
                            {!isFirstPoint && !isLastPoint && (
                              <text
                                x={labelX + growthOffsetX}
                                y={labelY + growthOffsetY}
                                fill={dataPoint.growth >= 0 ? '#dc2626' : '#16a34a'}
                                textAnchor={textAnchor}
                                fontSize={10}
                                fontWeight={700}
                                stroke="white"
                                strokeWidth={2.5}
                                paintOrder="stroke"
                              >
                                {arrow(dataPoint.growth)} {pct(dataPoint.growth)} ({fmt(dataPoint.period2 - dataPoint.period1)})
                              </text>
                            )}
                          </g>
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
                const dataSource = mode === 'comparison' && secondPeriodMetrics
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
            mode === 'comparison' && secondPeriodMetrics
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
            {mode === 'comparison' && (
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
          {mode === 'comparison' && firstPeriodMetrics && secondPeriodMetrics ? (
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
                            {dataPoint.growth >= 0 ? '↑' : '↓'}{Math.abs(dataPoint.growth).toFixed(1)}% ({fmtShort(dataPoint.period2 - dataPoint.period1)})
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
          let displayData: any[];
          let allRows: any[] = [];

          if (mode === 'comparison' && firstPeriodMetrics && secondPeriodMetrics && firstPeriod && secondPeriod) {
            // Use buildConversionRows for comparison mode
            allRows = [
              ...(firstPeriodMetrics.topExpenses || []),
              ...(secondPeriodMetrics.topExpenses || [])
            ];

            displayData = buildConversionRows(
              allRows,
              { year: firstPeriod.year, quarter: firstPeriod.quarter },
              { year: secondPeriod.year, quarter: secondPeriod.quarter }
            );

            console.log('[Comparison Mode] Using buildConversionRows:', {
              firstPeriod,
              secondPeriod,
              allRowsCount: allRows.length,
              mergedRowsCount: displayData.length,
              sampleRow: displayData[0]
            });
          } else {
            // Normal mode - just show the data as-is
            displayData = metrics?.topExpenses || [];
          }

          console.log('[Dashboard] Data Grid section:', {
            hasMetrics: !!metrics,
            displayDataLength: displayData?.length || 0,
            firstItem: displayData?.[0],
            willRenderGrid: displayData && displayData.length > 0,
            comparisonMode: mode === 'comparison'
          });

          if (displayData && displayData.length > 0) {
            return (
              <>
                <EnterpriseDataGrid
                  data={displayData}
                  showGrowth={mode === 'comparison'}
                  conversionPeriods={mode === 'comparison' ? {
                    p1: { year: firstPeriod.year, qtr: parseInt(firstPeriod.quarter.substring(1)) },
                    p2: { year: secondPeriod.year, qtr: parseInt(secondPeriod.quarter.substring(1)) }
                  } : undefined}
                  allRows={mode === 'comparison' ? allRows : undefined}
                />
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
