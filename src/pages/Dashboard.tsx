import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ComposedChart, Area, LabelList
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Package, Truck, Building2 } from 'lucide-react';
import MetricCard from '../components/MetricCard';
import FilterPanel from '../components/FilterPanel';
import { fetchDashboardMetrics } from '../api/costs';
import { formatCurrency, formatPercentage } from '../utils/formatting';

// PROCEED Brand Colors
const PROCEED_COLORS = {
  // Primary colors
  primary: '#9e1f63',
  secondary: '#424046',
  accent: '#e05e3d',
  blue: '#005b8c',
  // Extended palette
  darkRed: '#721548',
  lightPink: '#cb5b96',
  gray: '#6a686f',
  lightGray: '#e2e1e6',
  darkGray: '#2d2d2d',
  mediumGray: '#717171',
  // Functional colors
  success: '#10b981',
  warning: '#f59e0b',
};

// Brand color palette for cycling through charts
const BRAND_PALETTE = [
  '#9e1f63', // primary
  '#424046', // secondary
  '#e05e3d', // accent
  '#005b8c', // blue
  '#721548', // darkRed
  '#cb5b96', // lightPink
  '#6a686f', // gray
  '#2d2d2d', // darkGray
  '#717171', // mediumGray
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
    style: { fontWeight: 'bold', fontSize: 10, fill: '#333' },
  },
  legend: {
    wrapperStyle: { fontWeight: 600 },
  },
  tooltip: {
    contentStyle: { fontWeight: 600, backgroundColor: 'white', border: '1px solid #e0e0e0' },
    labelStyle: { fontWeight: 600 },
  },
  grid: {
    strokeDasharray: '3 3',
    stroke: '#e0e0e0',
  },
  pieLabel: {
    style: { fontWeight: 'bold', fontSize: 12 },
  },
};

export default function Dashboard() {
  const [filters, setFilters] = useState({});

  const { data: metrics, isLoading, error } = useQuery({
    queryKey: ['dashboard-metrics', filters],
    queryFn: () => fetchDashboardMetrics(filters),
  });

  // Debug logging for CAPEX issue
  React.useEffect(() => {
    if (metrics) {
      console.log('Dashboard Metrics Debug:', {
        totalCost: metrics.totalCost,
        totalOpex: metrics.totalOpex,
        totalCapex: metrics.totalCapex,
        glAccountCount: metrics.costByGLAccount?.length,
        sampleExpenses: metrics.topExpenses?.slice(0, 3).map((e: any) => ({
          glAccount: e.glAccountNo,
          opexCapex: e.opexCapex,
          amount: e.totalIncurredCost
        }))
      });
    }
  }, [metrics]);

  // Get GL Account data from metrics - limit to top 15 for readability
  const costByGLAccount = metrics?.costByGLAccount
    ?.slice(0, 15)  // Take only top 15 GL accounts
    ?.map((item: any) => ({
      name: item.value,
      totalCost: item.totalCost,
    })) || [];

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

  const { totalCost, totalOpex, totalCapex, dmascoTotal, proceed3PLTotal, costByQuarter, costByWarehouse, costByCategory, topExpenses } = metrics || {};

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
          <ResponsiveContainer width="100%" height={350}>
            <ComposedChart data={costByQuarter}>
              <CartesianGrid {...CHART_STYLES.grid} />
              <XAxis
                dataKey="value"
                tick={CHART_STYLES.axis}
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
              <Legend wrapperStyle={CHART_STYLES.legend.wrapperStyle} />
              <Bar dataKey="totalCost" name="Total Cost" fill={PROCEED_COLORS.primary}>
                <LabelList
                  dataKey="totalCost"
                  position="top"
                  formatter={(value: number) => formatCurrency(value, true)}
                  {...CHART_STYLES.labelList}
                />
              </Bar>
              <Line
                type="monotone"
                dataKey="opexAmount"
                name="OPEX"
                stroke={PROCEED_COLORS.blue}
                strokeWidth={3}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* GL Account Cost Analysis - Full Width */}
        <div className="chart-container">
          <h3 className="text-lg font-semibold mb-4">GL Accounts by Total Cost</h3>
          <ResponsiveContainer width="100%" height={500}>
            <BarChart data={costByGLAccount} layout="horizontal" margin={{ top: 30, right: 30, left: 20, bottom: 100 }}>
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
                    const totalGLCost = costByGLAccount.reduce((sum, item) => sum + item.totalCost, 0);
                    const percentage = totalGLCost > 0 ? (value / totalGLCost * 100).toFixed(1) : '0';
                    return (
                      <g>
                        <text
                          x={x + width / 2}
                          y={y - 20}
                          fill="#333"
                          textAnchor="middle"
                          style={{ fontWeight: 'bold', fontSize: 10 }}
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
                  <Cell key={`cell-${index}`} fill={getBrandColor(index)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* New Pie Charts Section - Two columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* OPEX vs CAPEX Pie Chart */}
          <div className="chart-container">
            <h3 className="text-lg font-semibold mb-4">OPEX vs CAPEX Breakdown</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'OPEX', value: totalOpex || 0 },
                    { name: 'CAPEX', value: totalCapex || 0 },
                  ].filter(item => item.value > 0)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(props) => {
                    const { cx, cy, midAngle, innerRadius, outerRadius, percent, name } = props;
                    const RADIAN = Math.PI / 180;
                    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                    const y = cy + radius * Math.sin(-midAngle * RADIAN);

                    return (
                      <text
                        x={x}
                        y={y}
                        fill="white"
                        textAnchor={x > cx ? 'start' : 'end'}
                        dominantBaseline="central"
                        style={{ fontWeight: 'bold', fontSize: 14 }}
                      >
                        {`${name}: ${(percent * 100).toFixed(1)}%`}
                      </text>
                    );
                  }}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  <Cell fill={PROCEED_COLORS.blue} />
                  <Cell fill={PROCEED_COLORS.accent} />
                </Pie>
                <Tooltip
                  formatter={(value) => formatCurrency(value as number)}
                  contentStyle={CHART_STYLES.tooltip.contentStyle}
                  labelStyle={CHART_STYLES.tooltip.labelStyle}
                />
                <Legend
                  wrapperStyle={CHART_STYLES.legend.wrapperStyle}
                  formatter={(value, entry) => `${value}: ${formatCurrency(entry.payload.value)}`}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Warehouse vs Transportation Pie Chart */}
          <div className="chart-container">
            <h3 className="text-lg font-semibold mb-4">Warehouse vs Transportation Cost</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={(() => {
                    // Aggregate warehouse and transportation costs from all quarters
                    const warehouseTotal = costByQuarter?.reduce((sum, q) => sum + (q.warehouseCost || 0) + (q.proceed3PLWHCost || 0), 0) || 0;
                    const transportationTotal = costByQuarter?.reduce((sum, q) => sum + (q.transportationCost || 0) + (q.proceed3PLTRSCost || 0), 0) || 0;
                    return [
                      { name: 'Warehouse', value: warehouseTotal },
                      { name: 'Transportation', value: transportationTotal },
                    ].filter(item => item.value > 0);
                  })()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(props) => {
                    const { cx, cy, midAngle, innerRadius, outerRadius, percent, name } = props;
                    const RADIAN = Math.PI / 180;
                    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                    const y = cy + radius * Math.sin(-midAngle * RADIAN);

                    return (
                      <text
                        x={x}
                        y={y}
                        fill="white"
                        textAnchor={x > cx ? 'start' : 'end'}
                        dominantBaseline="central"
                        style={{ fontWeight: 'bold', fontSize: 14 }}
                      >
                        {`${name}: ${(percent * 100).toFixed(1)}%`}
                      </text>
                    );
                  }}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  <Cell fill={PROCEED_COLORS.primary} />
                  <Cell fill={PROCEED_COLORS.secondary} />
                </Pie>
                <Tooltip
                  formatter={(value) => formatCurrency(value as number)}
                  contentStyle={CHART_STYLES.tooltip.contentStyle}
                  labelStyle={CHART_STYLES.tooltip.labelStyle}
                />
                <Legend
                  wrapperStyle={CHART_STYLES.legend.wrapperStyle}
                  formatter={(value, entry) => `${value}: ${formatCurrency(entry.payload.value)}`}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cost by Warehouse and Category - Two columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cost by Warehouse */}
          <div className="chart-container">
            <h3 className="text-lg font-semibold mb-4">Cost by Warehouse</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={costByWarehouse?.slice(0, 8)} layout="vertical">
                <CartesianGrid {...CHART_STYLES.grid} />
                <XAxis
                  type="number"
                  tickFormatter={(value) => formatCurrency(value, true)}
                  tick={CHART_STYLES.axis}
                />
                <YAxis
                  dataKey="value"
                  type="category"
                  width={100}
                  tick={CHART_STYLES.axis}
                />
                <Tooltip
                  formatter={(value) => formatCurrency(value as number)}
                  contentStyle={CHART_STYLES.tooltip.contentStyle}
                  labelStyle={CHART_STYLES.tooltip.labelStyle}
                />
                <Bar dataKey="totalCost" name="Total Cost" fill={PROCEED_COLORS.primary}>
                  <LabelList
                    position="right"
                    content={(props) => {
                      const { x, y, height, value } = props;
                      const totalWHCost = costByWarehouse?.reduce((sum, item) => sum + item.totalCost, 0) || 0;
                      const percentage = totalWHCost > 0 ? (value / totalWHCost * 100).toFixed(1) : '0';
                      return (
                        <g>
                          <text
                            x={x + 5}
                            y={y + height / 2 - 5}
                            fill="#333"
                            textAnchor="start"
                            style={{ fontWeight: 'bold', fontSize: 10 }}
                          >
                            {formatCurrency(value, true)}
                          </text>
                          <text
                            x={x + 5}
                            y={y + height / 2 + 5}
                            fill="#666"
                            textAnchor="start"
                            style={{ fontSize: 9 }}
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

          {/* Cost by Category */}
          <div className="chart-container">
            <h3 className="text-lg font-semibold mb-4">Cost by TCO Category</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={costByCategory?.slice(0, 8)}>
                <CartesianGrid {...CHART_STYLES.grid} />
                <XAxis
                  dataKey="value"
                  angle={-45}
                  textAnchor="end"
                  height={100}
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
                <Bar dataKey="totalCost" name="Total Cost" fill={PROCEED_COLORS.accent}>
                  <LabelList
                    position="top"
                    content={(props) => {
                      const { x, y, width, value } = props;
                      const totalCatCost = costByCategory?.reduce((sum, item) => sum + item.totalCost, 0) || 0;
                      const percentage = totalCatCost > 0 ? (value / totalCatCost * 100).toFixed(1) : '0';
                      return (
                        <g>
                          <text
                            x={x + width / 2}
                            y={y - 15}
                            fill="#333"
                            textAnchor="middle"
                            style={{ fontWeight: 'bold', fontSize: 10 }}
                          >
                            {formatCurrency(value, true)}
                          </text>
                          <text
                            x={x + width / 2}
                            y={y - 5}
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
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cost Distribution Pie Chart - Full Width for better visibility */}
        <div className="chart-container">
          <h3 className="text-lg font-semibold mb-4">Cost Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Warehouse', value: costByQuarter?.[0]?.warehouseCost || 0 },
                  { name: 'Transportation', value: costByQuarter?.[0]?.transportationCost || 0 },
                  { name: 'Distribution', value: costByQuarter?.[0]?.distributionCost || 0 },
                  { name: 'Last Mile', value: costByQuarter?.[0]?.lastMileCost || 0 },
                ]}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(props) => {
                  const { name, percent } = props;
                  return (
                    <text
                      x={props.x}
                      y={props.y}
                      fill={props.fill}
                      textAnchor={props.textAnchor}
                      dominantBaseline="central"
                      style={{ fontWeight: 'bold', fontSize: 12 }}
                    >
                      {`${name}: ${formatPercentage(percent)}`}
                    </text>
                  );
                }}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                <Cell fill={PROCEED_COLORS.primary} />
                <Cell fill={PROCEED_COLORS.secondary} />
                <Cell fill={PROCEED_COLORS.accent} />
                <Cell fill={PROCEED_COLORS.blue} />
              </Pie>
              <Tooltip
                formatter={(value) => formatCurrency(value as number)}
                contentStyle={CHART_STYLES.tooltip.contentStyle}
                labelStyle={CHART_STYLES.tooltip.labelStyle}
              />
              <Legend wrapperStyle={CHART_STYLES.legend.wrapperStyle} />
            </PieChart>
          </ResponsiveContainer>
        </div>
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
              {metrics?.topExpenses?.slice(0, 10).map((expense: any, index: number) => (
                <tr key={index}>
                  <td className="font-mono text-sm">{expense.glAccountNo}</td>
                  <td>{expense.glAccountName}</td>
                  <td>
                    <span className={`px-2 py-1 text-xs rounded ${
                      expense.opexCapex === 'OPEX'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-orange-100 text-orange-800'
                    }`}>
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