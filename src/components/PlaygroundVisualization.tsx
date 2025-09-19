import React, { useState, useMemo, Fragment } from 'react';
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
  Legend,
} from 'recharts';
import { X, Settings, Table, Loader2, GripVertical } from 'lucide-react';
import { GridLayoutControl } from '../modules/grid-layout';
import { formatCurrency } from '../utils/formatting';
import { fetchPlaygroundData, fetchMultiMeasureData } from '../api/playground';
import {
  VisualizationConfig,
  DIMENSIONS,
  MEASURES,
  CHART_TYPES,
} from '../pages/CostPlayground';
import MultiSelect from './MultiSelect';

interface PlaygroundVisualizationProps {
  config: VisualizationConfig;
  onUpdate: (updates: Partial<VisualizationConfig>) => void;
  onRemove: () => void;
  dragHandleProps?: {
    attributes?: any;
    listeners?: any;
  };
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

// Custom tooltip component for multiple measures
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="text-sm font-semibold text-gray-900 mb-1">{label}</p>
        {payload.map((entry: any, index: number) => {
          const measure = MEASURES.find(m => m.value === entry.dataKey);
          return (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              <span className="font-medium">{measure?.label || entry.dataKey}:</span> {formatCurrency(entry.value)}
            </p>
          );
        })}
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


export default function PlaygroundVisualization({
  config,
  onUpdate,
  onRemove,
  dragHandleProps,
}: PlaygroundVisualizationProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [showTable, setShowTable] = useState(config.showTable);

  // Ensure backward compatibility - convert old single measure to measures array
  const measures = useMemo(() => {
    if (config.measures && config.measures.length > 0) {
      return config.measures;
    }
    if (config.measure) {
      return [config.measure];
    }
    return [MEASURES[0].value];
  }, [config.measures, config.measure]);

  // Fetch data based on configuration - use multi-measure API if multiple measures
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['playground', config.dimension, measures],
    queryFn: () => {
      if (measures.length === 1) {
        // Use single measure API for backward compatibility
        return fetchPlaygroundData(config.dimension, measures[0]);
      } else {
        // Use multi-measure API
        return fetchMultiMeasureData(config.dimension, measures);
      }
    },
    enabled: !!config.dimension && measures.length > 0,
  });

  // Get labels for display
  const dimensionLabel = DIMENSIONS.find(d => d.value === config.dimension)?.label || config.dimension;
  const measureLabels = measures.map(m =>
    MEASURES.find(measure => measure.value === m)?.label || m
  );
  const chartTypeLabel = CHART_TYPES.find(c => c.value === config.chartType)?.label || config.chartType;

  // Prepare data for charts
  const chartData = useMemo(() => {
    if (!data?.data) return [];

    // For backward compatibility, ensure single measure data has proper structure
    if (measures.length === 1 && data.data[0]?.value !== undefined) {
      return data.data.map((item: any) => ({
        ...item,
        [measures[0]]: item.value,
      }));
    }

    return data.data;
  }, [data, measures]);

  // Calculate totals for percentage calculations
  const calculateTotals = () => {
    const totals: Record<string, number> = {};
    measures.forEach(measure => {
      totals[measure] = chartData.reduce((sum: number, r: any) =>
        sum + (r[measure] || 0), 0
      );
    });
    return totals;
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

    const totals = calculateTotals();

    switch (config.chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={450}>
            <BarChart data={chartData} margin={{ top: 50, right: 40, left: 30, bottom: 80 }}>
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
              {measures.length > 1 && <Legend />}
              {measures.map((measure, measureIndex) => {
                const measureLabel = MEASURES.find(m => m.value === measure)?.label || measure;
                const color = BRAND_PALETTE[measureIndex % BRAND_PALETTE.length];
                const total = totals[measure];

                return (
                  <Bar key={measure} dataKey={measure} name={measureLabel} fill={color}>
                    {measures.length === 1 && (
                      <LabelList
                        dataKey={measure}
                        position="top"
                        formatter={(value: number) => renderValueWithPercentage(value, total)}
                        style={{
                          fontSize: 11,
                          fontWeight: 'bold',
                          fill: '#2d2d2d'
                        }}
                      />
                    )}
                  </Bar>
                );
              })}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'pie':
        // For pie charts, use first measure or sum all measures
        const pieDataKey = measures[0];
        const pieData = measures.length === 1 ? chartData : chartData.map((item: any) => ({
          ...item,
          total: measures.reduce((sum, m) => sum + (item[m] || 0), 0),
        }));
        const dataKey = measures.length === 1 ? pieDataKey : 'total';

        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedPieLabel}
                outerRadius={120}
                fill="#8884d8"
                dataKey={dataKey}
                nameKey="name"
              >
                {pieData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={BRAND_PALETTE[index % BRAND_PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} {...CHART_STYLES.tooltip} />
              {measures.length > 1 && (
                <Legend
                  formatter={() => 'Total (Sum of all measures)'}
                  wrapperStyle={{ paddingTop: 20 }}
                />
              )}
            </PieChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={450}>
            <LineChart data={chartData} margin={{ top: 50, right: 40, left: 30, bottom: 80 }}>
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
              {measures.length > 1 && <Legend />}
              {measures.map((measure, measureIndex) => {
                const measureLabel = MEASURES.find(m => m.value === measure)?.label || measure;
                const color = BRAND_PALETTE[measureIndex % BRAND_PALETTE.length];
                const total = totals[measure];

                return (
                  <Line
                    key={measure}
                    type="monotone"
                    dataKey={measure}
                    stroke={color}
                    strokeWidth={2}
                    dot={{ fill: color, r: 4 }}
                    activeDot={{ r: 6 }}
                    name={measureLabel}
                  >
                    {measures.length === 1 && (
                      <LabelList
                        dataKey={measure}
                        position="top"
                        offset={10}
                        formatter={(value: number) => renderValueWithPercentage(value, total)}
                        style={{
                          fontSize: 10,
                          fontWeight: 'bold',
                          fill: '#2d2d2d'
                        }}
                      />
                    )}
                  </Line>
                );
              })}
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
              {dimensionLabel} by {measureLabels.length > 1 ? 'Multiple Measures' : measureLabels[0]}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {chartTypeLabel} Visualization{measures.length > 1 && ` (${measures.length} measures)`}
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
            {/* Drag Handle (if provided) */}
            {dragHandleProps && (
              <button
                {...dragHandleProps.attributes}
                {...dragHandleProps.listeners}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100"
                title="Drag to reorder"
              >
                <GripVertical className="h-5 w-5" />
              </button>
            )}
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

              {/* Measure Selector - MultiSelect */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Measures (Max 4)
                </label>
                <MultiSelect
                  options={MEASURES}
                  value={measures}
                  onChange={(newMeasures) => onUpdate({ measures: newMeasures })}
                  placeholder="Select measures..."
                  maxItems={4}
                  className="w-full"
                />
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
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="medium-column">
                      {dimensionLabel}
                    </th>
                    {measures.map((measure) => {
                      const label = MEASURES.find(m => m.value === measure)?.label || measure;
                      return (
                        <Fragment key={measure}>
                          <th className="text-right">
                            {label}
                          </th>
                          <th className="narrow-column text-right">
                            %
                          </th>
                        </Fragment>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const totals = calculateTotals();

                    return chartData.map((row: any, index: number) => {
                      return (
                        <tr key={index}>
                          <td className="medium-column font-medium">
                            {row.name}
                          </td>
                          {measures.map((measure) => {
                            const value = row[measure] || 0;
                            const total = totals[measure];
                            const percentage = total > 0 ? (value / total) * 100 : 0;

                            return (
                              <Fragment key={measure}>
                                <td className="text-right font-bold">
                                  {formatCurrency(value)}
                                </td>
                                <td className={`narrow-column text-right font-semibold ${
                                  percentage > 20 ? 'text-red-600' :
                                  percentage > 10 ? 'text-orange-600' :
                                  'text-gray-600'
                                }`}>
                                  {percentage.toFixed(1)}%
                                </td>
                              </Fragment>
                            );
                          })}
                        </tr>
                      );
                    });
                  })()}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-100">
                    <td className="font-bold text-gray-900">Total</td>
                    {measures.map((measure) => {
                      const total = calculateTotals()[measure];
                      return (
                        <Fragment key={measure}>
                          <td className="font-bold text-gray-900 text-right">
                            {formatCurrency(total)}
                          </td>
                          <td className="font-bold text-gray-900 text-right">
                            100.0%
                          </td>
                        </Fragment>
                      );
                    })}
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