import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from 'recharts';
import { X, Settings, Table, Loader2, Trophy, Medal, Award } from 'lucide-react';
import { GridLayoutControl } from '../modules/grid-layout';
import { formatCurrency } from '../utils/formatting';
import { fetchPlaygroundData } from '../api/playground';
import {
  VisualizationConfig,
  DIMENSIONS,
  MEASURES,
  CHART_TYPES,
} from '../pages/CostPlayground';

interface PlaygroundVisualizationProps {
  config: VisualizationConfig;
  onUpdate: (updates: Partial<VisualizationConfig>) => void;
  onRemove: () => void;
}

// PROCEED Brand Colors (matching Dashboard.tsx)
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

// Chart styling configuration (matching Dashboard.tsx)
const CHART_STYLES = {
  axis: {
    style: { fontWeight: 600 },
    fontSize: 12,
  },
  tooltip: {
    contentStyle: {
      fontWeight: 600,
      backgroundColor: 'white',
      border: '1px solid #e0e0e0',
    },
  },
  grid: {
    strokeDasharray: '3 3',
    stroke: '#e0e0e0',
  },
};

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const measure = MEASURES.find(m => m.value === payload[0].dataKey);
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="text-sm font-semibold text-gray-900">{label}</p>
        <p className="text-sm text-gray-600">
          {measure?.label}: {formatCurrency(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
};

// Custom label renderer for Pie Chart
const RADIAN = Math.PI / 180;
const renderCustomizedPieLabel = ({
  cx, cy, midAngle, innerRadius, outerRadius, percent, value, name, index
}: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  // Determine text color based on background
  const textColor = index % 2 === 0 ? '#ffffff' : '#ffffff';

  if (percent < 0.03) return null; // Hide labels for very small slices

  return (
    <text
      x={x}
      y={y}
      fill={textColor}
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      className="font-bold"
      style={{ fontSize: '11px', fontWeight: 'bold' }}
    >
      <tspan x={x} dy="-0.5em">{name}</tspan>
      <tspan x={x} dy="1.2em">{formatCurrency(value, true)}</tspan>
      <tspan x={x} dy="1.2em">({(percent * 100).toFixed(1)}%)</tspan>
    </text>
  );
};

// Custom label formatter for Bar and Line charts
const renderValueWithPercentage = (value: number, total: number) => {
  const percentage = ((value / total) * 100).toFixed(1);
  return `${formatCurrency(value, true)} (${percentage}%)`;
};

// Get ranking badge component
const getRankingBadge = (rank: number) => {
  switch(rank) {
    case 1:
      return <Trophy className="inline-block w-4 h-4 text-yellow-500 ml-2" />;
    case 2:
      return <Medal className="inline-block w-4 h-4 text-gray-400 ml-2" />;
    case 3:
      return <Award className="inline-block w-4 h-4 text-orange-600 ml-2" />;
    default:
      return null;
  }
};

export default function PlaygroundVisualization({
  config,
  onUpdate,
  onRemove,
}: PlaygroundVisualizationProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [showTable, setShowTable] = useState(config.showTable);

  // Fetch data based on configuration
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['playground', config.dimension, config.measure],
    queryFn: () => fetchPlaygroundData(config.dimension, config.measure),
    enabled: !!config.dimension && !!config.measure,
  });

  // Get labels for display
  const dimensionLabel = DIMENSIONS.find(d => d.value === config.dimension)?.label || config.dimension;
  const measureLabel = MEASURES.find(m => m.value === config.measure)?.label || config.measure;
  const chartTypeLabel = CHART_TYPES.find(c => c.value === config.chartType)?.label || config.chartType;

  // Prepare data for charts
  const chartData = data?.data || [];

  // Calculate total for percentage calculations
  const calculateTotal = () => {
    return chartData.reduce((sum: number, r: any) => sum + r.value, 0);
  };

  // Render the appropriate chart based on type
  const renderChart = () => {
    if (!chartData || chartData.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-500">
          No data available for the selected configuration
        </div>
      );
    }

    const total = calculateTotal();

    switch (config.chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 40, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid {...CHART_STYLES.grid} />
              <XAxis
                dataKey="name"
                {...CHART_STYLES.axis}
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis
                {...CHART_STYLES.axis}
                tickFormatter={(value) => formatCurrency(value, true)}
              />
              <Tooltip content={<CustomTooltip />} {...CHART_STYLES.tooltip} />
              <Bar dataKey="value" name={measureLabel}>
                {chartData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={BRAND_PALETTE[index % BRAND_PALETTE.length]} />
                ))}
                <LabelList
                  dataKey="value"
                  position="top"
                  formatter={(value: number) => renderValueWithPercentage(value, total)}
                  style={{
                    fontSize: 11,
                    fontWeight: 'bold',
                    fill: '#2d2d2d'
                  }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedPieLabel}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
              >
                {chartData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={BRAND_PALETTE[index % BRAND_PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} {...CHART_STYLES.tooltip} />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} margin={{ top: 40, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid {...CHART_STYLES.grid} />
              <XAxis
                dataKey="name"
                {...CHART_STYLES.axis}
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis
                {...CHART_STYLES.axis}
                tickFormatter={(value) => formatCurrency(value, true)}
              />
              <Tooltip content={<CustomTooltip />} {...CHART_STYLES.tooltip} />
              <Line
                type="monotone"
                dataKey="value"
                stroke={BRAND_PALETTE[0]}
                strokeWidth={2}
                dot={{ fill: BRAND_PALETTE[0], r: 4 }}
                activeDot={{ r: 6 }}
                name={measureLabel}
              >
                <LabelList
                  dataKey="value"
                  position="top"
                  offset={10}
                  formatter={(value: number) => renderValueWithPercentage(value, total)}
                  style={{
                    fontSize: 10,
                    fontWeight: 'bold',
                    fill: '#2d2d2d'
                  }}
                />
              </Line>
            </LineChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">
              {dimensionLabel} by {measureLabel}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {chartTypeLabel} Visualization
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {/* Grid Layout Control */}
            <GridLayoutControl
              currentWidth={config.gridWidth || 2}
              onChange={(width) => onUpdate({ gridWidth: width })}
              compact
            />
            <div className="h-4 w-px bg-gray-300" />
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Configure visualization"
            >
              <Settings className="h-5 w-5" />
            </button>
            <button
              onClick={() => setShowTable(!showTable)}
              className={`p-2 rounded-lg transition-colors ${
                showTable
                  ? 'text-[#9e1f63] bg-pink-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
              title="Toggle data table"
            >
              <Table className="h-5 w-5" />
            </button>
            <button
              onClick={onRemove}
              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Remove visualization"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Dimension Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dimension
                </label>
                <select
                  value={config.dimension}
                  onChange={(e) => onUpdate({ dimension: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9e1f63] focus:border-transparent"
                >
                  {DIMENSIONS.map(dim => (
                    <option key={dim.value} value={dim.value}>
                      {dim.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Measure Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Measure
                </label>
                <select
                  value={config.measure}
                  onChange={(e) => onUpdate({ measure: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9e1f63] focus:border-transparent"
                >
                  {MEASURES.map(measure => (
                    <option key={measure.value} value={measure.value}>
                      {measure.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Chart Type Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Chart Type
                </label>
                <select
                  value={config.chartType}
                  onChange={(e) => onUpdate({ chartType: e.target.value as 'bar' | 'pie' | 'line' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9e1f63] focus:border-transparent"
                >
                  {CHART_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Grid Width Control (Full version in settings) */}
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Visualization Width
                </label>
                <GridLayoutControl
                  currentWidth={config.gridWidth || 2}
                  onChange={(width) => onUpdate({ gridWidth: width })}
                  compact={false}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chart Content */}
      <div className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-[#9e1f63]" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-red-600 font-medium">Error loading data</p>
              <p className="text-gray-500 text-sm mt-1">Please try again</p>
              <button
                onClick={() => refetch()}
                className="mt-3 px-4 py-2 bg-[#9e1f63] text-white rounded-lg hover:bg-[#721548] transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        ) : (
          renderChart()
        )}
      </div>

      {/* Data Table */}
      {showTable && chartData && chartData.length > 0 && (
        <div className="border-t border-gray-200">
          <div className="px-6 py-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Data Table</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y-2 divide-gray-200">
                <thead>
                  <tr className="bg-gradient-to-r from-[#9e1f63] to-[#721548]">
                    <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                      {dimensionLabel}
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-white uppercase tracking-wider">
                      {measureLabel}
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-white uppercase tracking-wider">
                      Percentage
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(() => {
                    const total = chartData.reduce((sum: number, r: any) => sum + r.value, 0);
                    // Sort data to determine top 3
                    const sortedData = [...chartData].sort((a: any, b: any) => b.value - a.value);
                    const top3Values = sortedData.slice(0, 3).map((d: any) => d.value);

                    return chartData.map((row: any, index: number) => {
                      const percentage = (row.value / total) * 100;
                      const rank = top3Values.indexOf(row.value) + 1;

                      return (
                        <tr
                          key={index}
                          className={`
                            transition-colors hover:bg-pink-50
                            ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}
                          `}
                        >
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {row.name}
                            {rank > 0 && rank <= 3 && getRankingBadge(rank)}
                          </td>
                          <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">
                            {formatCurrency(row.value)}
                          </td>
                          <td className={`px-4 py-3 text-sm font-semibold text-right ${
                            percentage > 20 ? 'text-red-600' :
                            percentage > 10 ? 'text-orange-600' :
                            'text-gray-600'
                          }`}>
                            {percentage.toFixed(1)}%
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
                <tfoot className="border-t-2 border-gray-300">
                  <tr className="bg-gradient-to-r from-[#9e1f63] to-[#721548]">
                    <td className="px-4 py-3 text-sm font-bold text-white">Total</td>
                    <td className="px-4 py-3 text-sm font-bold text-white text-right">
                      {formatCurrency(chartData.reduce((sum: number, r: any) => sum + r.value, 0))}
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-white text-right">
                      100.0%
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}