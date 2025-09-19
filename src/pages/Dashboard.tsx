import React, { useState } from "react";
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
  DollarSign,
  Package,
  Truck,
  Building2,
} from "lucide-react";
import MetricCard from "../components/MetricCard";
import FilterPanel from "../components/FilterPanel";
import { fetchDashboardMetrics } from "../api/costs";
import { formatCurrency, formatPercentage } from "../utils/formatting";

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

// Centralized chart styling configuration
const CHART_STYLES = {
  axis: {
    style: { fontWeight: 600 },
    fontSize: 12,
  },
  axisLabel: {
    style: { fontWeight: 600 },
    fontSize: 11,
  },
  labelList: {
    style: { fontWeight: "bold", fontSize: 10, fill: "#333" },
  },
  legend: {
    wrapperStyle: { fontWeight: 600 },
  },
  tooltip: {
    contentStyle: {
      fontWeight: 600,
      backgroundColor: "white",
      border: "1px solid #e0e0e0",
    },
    labelStyle: { fontWeight: 600 },
  },
  grid: {
    strokeDasharray: "3 3",
    stroke: "#e0e0e0",
  },
  pieLabel: {
    style: { fontWeight: "bold", fontSize: 12 },
  },
};

export default function Dashboard() {
  const [filters, setFilters] = useState({});

  const {
    data: metrics,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["dashboard-metrics", filters],
    queryFn: () => fetchDashboardMetrics(filters),
  });

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

  // Get all GL Account data and prepare top 15 + Others
  const allGLAccounts = metrics?.costByGLAccount || [];
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

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          title="Total Cost"
          value={formatCurrency(totalCost || 0)}
          icon={<DollarSign className="h-5 w-5" />}
          color="primary"
          trend={null}
        />
        <MetricCard
          title="OPEX"
          value={formatCurrency(totalOpex || 0)}
          icon={<TrendingUp className="h-5 w-5" />}
          color="blue"
          subtitle={`${formatPercentage((totalOpex || 0) / (totalCost || 1))} of total`}
        />
        <MetricCard
          title="CAPEX"
          value={formatCurrency(totalCapex || 0)}
          icon={<TrendingDown className="h-5 w-5" />}
          color="accent"
          subtitle={`${formatPercentage((totalCapex || 0) / (totalCost || 1))} of total`}
        />
        <MetricCard
          title="DMASCO Operations"
          value={formatCurrency(dmascoTotal || 0)}
          icon={<Building2 className="h-5 w-5" />}
          color="secondary"
          subtitle="Pharmacy, Dist, LM"
        />
        <MetricCard
          title="PROCEED 3PL"
          value={formatCurrency(proceed3PLTotal || 0)}
          icon={<Truck className="h-5 w-5" />}
          color="primary"
          subtitle="WH & Transportation"
        />
      </div>

      {/* Full-Width Charts */}
      <div className="grid grid-cols-1 gap-6">
        {/* Cost by Quarter - Full Width */}
        <div className="chart-container">
          <h3 className="text-lg font-semibold mb-4">Cost Trend by Quarter</h3>
          <ResponsiveContainer width="100%" height={450}>
            <BarChart
              data={costByQuarter}
              margin={{ top: 40, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid {...CHART_STYLES.grid} />
              <XAxis dataKey="value" tick={CHART_STYLES.axis} />
              <YAxis
                tickFormatter={(value) => formatCurrency(value, true)}
                tick={CHART_STYLES.axis}
              />
              <Tooltip
                formatter={(value) => formatCurrency(value as number)}
                contentStyle={CHART_STYLES.tooltip.contentStyle}
                labelStyle={CHART_STYLES.tooltip.labelStyle}
              />
              <Bar
                dataKey="totalCost"
                name="Total Cost"
                fill={PROCEED_COLORS.primary}
              >
                <LabelList
                  dataKey="totalCost"
                  position="top"
                  formatter={(value: number) => formatCurrency(value, true)}
                  {...CHART_STYLES.labelList}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* OPEX vs CAPEX Pie Chart */}
        <div className="chart-container">
          <h3 className="text-lg font-semibold mb-4">
            OPEX vs CAPEX Breakdown
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={[
                  { name: "OPEX", value: totalOpex || 0 },
                  { name: "CAPEX", value: totalCapex || 0 },
                ].filter((item) => item.value > 0)}
                cx="50%"
                cy="50%"
                labelLine={{ stroke: "#666", strokeWidth: 1 }}
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
                      style={{ fontWeight: "bold", fontSize: 13 }}
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
                  { name: "OPEX", value: totalOpex || 0 },
                  { name: "CAPEX", value: totalCapex || 0 },
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
                    value: totalOpex || 0,
                    label: `${formatCurrency(totalOpex || 0, true).replace("SAR ", "")}`,
                  },
                  {
                    name: "CAPEX",
                    value: totalCapex || 0,
                    label: `${formatCurrency(totalCapex || 0, true).replace("SAR ", "")}`,
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
        </div>

        {/* Warehouse vs Transportation Pie Chart */}
        <div className="chart-container">
          <h3 className="text-lg font-semibold mb-4">
            Warehouse vs Transportation Cost
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={(() => {
                  // Aggregate warehouse and transportation costs from all quarters
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
                  return [
                    { name: "Warehouse", value: warehouseTotal },
                    { name: "Transportation", value: transportationTotal },
                  ].filter((item) => item.value > 0);
                })()}
                cx="50%"
                cy="50%"
                labelLine={{ stroke: "#666", strokeWidth: 1 }}
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
                      style={{ fontWeight: "bold", fontSize: 13 }}
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
        </div>
      </div>

      {/* Damasco vs PROCEED 3BL Comparison - Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="chart-container">
          <h3 className="text-lg font-semibold mb-4">
            Damasco Operations vs PROCEED 3PL
          </h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart
              data={(() => {
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

                const proceed3PLWHTotal =
                  costByQuarter?.reduce(
                    (sum, q) => sum + (q.proceed3PLWHCost || 0),
                    0,
                  ) || 0;
                const proceed3PLTRSTotal =
                  costByQuarter?.reduce(
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
              margin={{ top: 30, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid {...CHART_STYLES.grid} />
              <XAxis
                dataKey="name"
                tick={{
                  ...CHART_STYLES.axisLabel,
                  angle: 0,
                  textAnchor: "middle",
                }}
              />
              <YAxis
                tickFormatter={(value) => formatCurrency(value, true)}
                tick={CHART_STYLES.axis}
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

                    return (
                      <g>
                        <text
                          x={x + width / 2}
                          y={y - 15}
                          fill="#333"
                          textAnchor="middle"
                          style={{ fontWeight: "bold", fontSize: 12 }}
                        >
                          {formatCurrency(value, true)}
                        </text>
                        <text
                          x={x + width / 2}
                          y={y - 3}
                          fill="#666"
                          textAnchor="middle"
                          style={{ fontSize: 10 }}
                        >
                          {percentage}%
                        </text>
                      </g>
                    );
                  }}
                />
                <Cell fill={PROCEED_COLORS.darkRed} />
                <Cell fill={PROCEED_COLORS.blue} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 3. Cost Efficiency Metrics - Third Visualization */}
        <div className="chart-container">
          <h3 className="text-lg font-semibold mb-4">Department Cost Trend</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={costByQuarter?.map((q) => ({
                quarter: q.value.toUpperCase(),
                Pharmacies: q.pharmaciesCost || 0,
                Distribution: q.distributionCost || 0,
                "Last Mile": q.lastMileCost || 0,
                "PROCEED 3PL":
                  (q.proceed3PLWHCost || 0) + (q.proceed3PLTRSCost || 0),
              }))}
              margin={{ top: 40, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid {...CHART_STYLES.grid} />
              <XAxis dataKey="quarter" tick={CHART_STYLES.axis} />
              <YAxis
                tickFormatter={(value) => formatCurrency(value, true)}
                tick={CHART_STYLES.axis}
              />
              <Tooltip
                formatter={(value) => formatCurrency(value as number)}
                contentStyle={CHART_STYLES.tooltip.contentStyle}
                labelStyle={CHART_STYLES.tooltip.labelStyle}
              />
              <Legend wrapperStyle={CHART_STYLES.legend.wrapperStyle} />
              <Bar dataKey="Pharmacies" fill={PROCEED_COLORS.primary}>
                <LabelList
                  position="top"
                  content={(props) => {
                    const { x, y, width, value, index } = props;
                    if (!value) return null;

                    // Get the data for this specific bar
                    const dataEntry = costByQuarter?.[index];
                    const quarterTotal = dataEntry
                      ? (dataEntry.pharmaciesCost || 0) +
                        (dataEntry.distributionCost || 0) +
                        (dataEntry.lastMileCost || 0) +
                        (dataEntry.proceed3PLWHCost || 0) +
                        (dataEntry.proceed3PLTRSCost || 0)
                      : 0;
                    const percentage =
                      quarterTotal > 0
                        ? ((value / quarterTotal) * 100).toFixed(1)
                        : "0.0";
                    return (
                      <g>
                        <text
                          x={x + width / 2}
                          y={y - 15}
                          fill="#333"
                          textAnchor="middle"
                          style={{ fontWeight: "bold", fontSize: 9 }}
                        >
                          {formatCurrency(value, true)}
                        </text>
                        <text
                          x={x + width / 2}
                          y={y - 5}
                          fill="#666"
                          textAnchor="middle"
                          style={{ fontSize: 8 }}
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
                    if (!value) return null;

                    // Get the data for this specific bar
                    const dataEntry = costByQuarter?.[index];
                    const quarterTotal = dataEntry
                      ? (dataEntry.pharmaciesCost || 0) +
                        (dataEntry.distributionCost || 0) +
                        (dataEntry.lastMileCost || 0) +
                        (dataEntry.proceed3PLWHCost || 0) +
                        (dataEntry.proceed3PLTRSCost || 0)
                      : 0;
                    const percentage =
                      quarterTotal > 0
                        ? ((value / quarterTotal) * 100).toFixed(1)
                        : "0.0";
                    return (
                      <g>
                        <text
                          x={x + width / 2}
                          y={y - 15}
                          fill="#333"
                          textAnchor="middle"
                          style={{ fontWeight: "bold", fontSize: 9 }}
                        >
                          {formatCurrency(value, true)}
                        </text>
                        <text
                          x={x + width / 2}
                          y={y - 5}
                          fill="#666"
                          textAnchor="middle"
                          style={{ fontSize: 8 }}
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
                    if (!value) return null;

                    // Get the data for this specific bar
                    const dataEntry = costByQuarter?.[index];
                    const quarterTotal = dataEntry
                      ? (dataEntry.pharmaciesCost || 0) +
                        (dataEntry.distributionCost || 0) +
                        (dataEntry.lastMileCost || 0) +
                        (dataEntry.proceed3PLWHCost || 0) +
                        (dataEntry.proceed3PLTRSCost || 0)
                      : 0;
                    const percentage =
                      quarterTotal > 0
                        ? ((value / quarterTotal) * 100).toFixed(1)
                        : "0.0";
                    return (
                      <g>
                        <text
                          x={x + width / 2}
                          y={y - 15}
                          fill="#333"
                          textAnchor="middle"
                          style={{ fontWeight: "bold", fontSize: 9 }}
                        >
                          {formatCurrency(value, true)}
                        </text>
                        <text
                          x={x + width / 2}
                          y={y - 5}
                          fill="#666"
                          textAnchor="middle"
                          style={{ fontSize: 8 }}
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
                    if (!value) return null;

                    // Get the data for this specific bar
                    const dataEntry = costByQuarter?.[index];
                    const quarterTotal = dataEntry
                      ? (dataEntry.pharmaciesCost || 0) +
                        (dataEntry.distributionCost || 0) +
                        (dataEntry.lastMileCost || 0) +
                        (dataEntry.proceed3PLWHCost || 0) +
                        (dataEntry.proceed3PLTRSCost || 0)
                      : 0;
                    const percentage =
                      quarterTotal > 0
                        ? ((value / quarterTotal) * 100).toFixed(1)
                        : "0.0";
                    return (
                      <g>
                        <text
                          x={x + width / 2}
                          y={y - 15}
                          fill="#333"
                          textAnchor="middle"
                          style={{ fontWeight: "bold", fontSize: 9 }}
                        >
                          {formatCurrency(value, true)}
                        </text>
                        <text
                          x={x + width / 2}
                          y={y - 5}
                          fill="#666"
                          textAnchor="middle"
                          style={{ fontSize: 8 }}
                        >
                          ({percentage}%)
                        </text>
                      </g>
                    );
                  }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* TCO Model Categories Treemap - Full Width */}
      <div className="chart-container">
        <h3 className="text-lg font-semibold mb-4">TCO Model Categories</h3>
        <ResponsiveContainer width="100%" height={600}>
          <Treemap
            data={(() => {
              // Aggregate costs by TCO Model Categories
              const tcoCategories: { [key: string]: number } = {};

              metrics?.topExpenses?.forEach((item: any) => {
                const category = item.tcoModelCategories || "Uncategorized";
                const cost = parseFloat(item.totalIncurredCost) || 0;

                if (tcoCategories[category]) {
                  tcoCategories[category] += cost;
                } else {
                  tcoCategories[category] = cost;
                }
              });

              // Calculate total for percentages
              const total = Object.values(tcoCategories).reduce(
                (sum, val) => sum + val,
                0,
              );

              // Convert to treemap data format and sort by value
              const treeData = Object.entries(tcoCategories)
                .map(([name, value], index) => ({
                  name,
                  value,
                  fill: getBrandColor(index),
                  percentage:
                    total > 0 ? ((value / total) * 100).toFixed(1) : "0",
                }))
                .sort((a, b) => b.value - a.value);

              return treeData;
            })()}
            dataKey="value"
            aspectRatio={4 / 3}
            stroke="#fff"
            strokeWidth={3}
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
              // Only render if the box is large enough
              if (width < 50 || height < 40) return null;

              // Calculate font sizes based on box dimensions
              const nameFontSize = Math.min(Math.max(14, width / 8), 20);
              const valueFontSize = Math.min(Math.max(12, width / 10), 16);
              const percentFontSize = Math.min(Math.max(10, width / 12), 14);

              // Determine text color based on background
              const textColor = "#fff";

              return (
                <g>
                  <rect
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    style={{
                      fill: fill,
                      stroke: "#fff",
                      strokeWidth: 3,
                      strokeOpacity: 1,
                    }}
                  />
                  {/* Only show text if box is large enough */}
                  {width > 80 && height > 60 && (
                    <>
                      {/* Category Name */}
                      <text
                        x={x + width / 2}
                        y={y + height / 2 - 15}
                        textAnchor="middle"
                        fill={textColor}
                        fontSize={nameFontSize}
                        fontWeight="bold"
                        fontFamily="system-ui, -apple-system, sans-serif"
                        stroke="rgba(0,0,0,0.5)"
                        strokeWidth="0.5"
                        paintOrder="stroke"
                      >
                        {name}
                      </text>
                      {/* Value */}
                      <text
                        x={x + width / 2}
                        y={y + height / 2 + 5}
                        textAnchor="middle"
                        fill={textColor}
                        fontSize={valueFontSize}
                        fontWeight="600"
                        fontFamily="system-ui, -apple-system, sans-serif"
                        stroke="rgba(0,0,0,0.5)"
                        strokeWidth="0.3"
                        paintOrder="stroke"
                      >
                        {formatCurrency(value, true)}
                      </text>
                      {/* Percentage */}
                      <text
                        x={x + width / 2}
                        y={y + height / 2 + 22}
                        textAnchor="middle"
                        fill={textColor}
                        fontSize={percentFontSize}
                        fontWeight="500"
                        fontFamily="system-ui, -apple-system, sans-serif"
                        stroke="rgba(0,0,0,0.5)"
                        strokeWidth="0.3"
                        paintOrder="stroke"
                      >
                        ({percentage}%)
                      </text>
                    </>
                  )}
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
        </ResponsiveContainer>
        <div className="text-sm text-gray-600 mt-2 text-center">
          Total TCO Categories:{" "}
          {
            Object.keys(
              (() => {
                const categories: { [key: string]: boolean } = {};
                metrics?.topExpenses?.forEach((item: any) => {
                  categories[item.tcoModelCategories || "Uncategorized"] = true;
                });
                return categories;
              })(),
            ).length
          }{" "}
          | Total Items Analyzed: {metrics?.topExpenses?.length || 0}
        </div>
      </div>

      {/* GL Account Cost Analysis - Full Width */}
      <div className="chart-container">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">GL Accounts by Total Cost</h3>
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
          <BarChart
            data={costByGLAccount}
            layout="horizontal"
            margin={{ top: 30, right: 30, left: 20, bottom: 100 }}
          >
            <CartesianGrid {...CHART_STYLES.grid} />
            <XAxis
              dataKey="name"
              angle={-45}
              textAnchor="end"
              height={120}
              interval={0}
              tick={CHART_STYLES.axisLabel}
            />
            <YAxis
              tickFormatter={(value) => formatCurrency(value, true)}
              tick={CHART_STYLES.axis}
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
                  const { x, y, width, value, index } = props;
                  // Use totalAllGLCost for percentage calculation
                  const percentage =
                    totalAllGLCost > 0
                      ? ((value / totalAllGLCost) * 100).toFixed(1)
                      : "0";
                  return (
                    <g>
                      <text
                        x={x + width / 2}
                        y={y - 20}
                        fill="#333"
                        textAnchor="middle"
                        style={{ fontWeight: "bold", fontSize: 10 }}
                      >
                        {formatCurrency(value, true)}
                      </text>
                      <text
                        x={x + width / 2}
                        y={y - 8}
                        fill="#666"
                        textAnchor="middle"
                        style={{ fontSize: 9 }}
                      >
                        {percentage}%
                      </text>
                    </g>
                  );
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
        </ResponsiveContainer>
      </div>

      {/* Data Table */}
      <div className="chart-container">
        <h3 className="text-lg font-semibold mb-4">Top Expenses</h3>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>GL Account</th>
                <th>Description</th>
                <th>Type</th>
                <th>Category</th>
                <th>Warehouse</th>
                <th className="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {metrics?.topExpenses
                ?.slice(0, 10)
                .map((expense: any, index: number) => (
                  <tr key={index}>
                    <td className="font-mono text-sm">{expense.glAccountNo}</td>
                    <td>{expense.glAccountName}</td>
                    <td>
                      <span
                        className={`px-2 py-1 text-xs rounded ${
                          expense.opexCapex === "OPEX"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-orange-100 text-orange-800"
                        }`}
                      >
                        {expense.opexCapex}
                      </span>
                    </td>
                    <td>{expense.tcoModelCategories}</td>
                    <td>{expense.warehouse}</td>
                    <td className="text-right font-semibold">
                      {formatCurrency(expense.totalIncurredCost)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
