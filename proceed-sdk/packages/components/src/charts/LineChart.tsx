/**
 * LineChart Component - Configurable line chart with multiple series support
 */

import React, { useMemo } from 'react';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps,
  LegendProps,
} from 'recharts';
import { formatNumber, formatCurrency, formatPercentage } from '@proceed/core/utils';
import { ChartConfig, DataPoint, LineConfig, AxisConfig } from '../types/charts';

export interface LineChartProps {
  data: DataPoint[];
  lines: LineConfig[];
  config?: ChartConfig;
  xAxis?: AxisConfig;
  yAxis?: AxisConfig;
  width?: number | string;
  height?: number | string;
  className?: string;
  onDataPointClick?: (data: DataPoint, lineKey: string) => void;
  loading?: boolean;
  error?: Error | null;
}

export const LineChart: React.FC<LineChartProps> = ({
  data,
  lines,
  config = {},
  xAxis = {},
  yAxis = {},
  width = '100%',
  height = 400,
  className = '',
  onDataPointClick,
  loading = false,
  error = null,
}) => {
  // Default configuration
  const chartConfig: ChartConfig = useMemo(() => ({
    theme: 'light',
    animate: true,
    showGrid: true,
    showTooltip: true,
    showLegend: true,
    margins: { top: 20, right: 30, bottom: 20, left: 30 },
    colors: [
      '#3B82F6', // Blue
      '#10B981', // Green
      '#F59E0B', // Amber
      '#EF4444', // Red
      '#8B5CF6', // Purple
      '#EC4899', // Pink
      '#06B6D4', // Cyan
      '#F97316', // Orange
    ],
    ...config,
  }), [config]);

  // Format axis tick based on format type
  const formatAxisTick = (value: any, format?: string): string => {
    if (!format) return String(value);

    switch (format) {
      case 'currency':
        return formatCurrency(value, { compact: true });
      case 'percentage':
        return formatPercentage(value);
      case 'number':
        return formatNumber(value, { compact: true });
      case 'date':
        return new Date(value).toLocaleDateString();
      default:
        return String(value);
    }
  };

  // Custom tooltip content
  const CustomTooltip: React.FC<TooltipProps<number, string>> = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
        <p className="font-semibold text-gray-900 mb-2">{label}</p>
        {payload.map((entry, index) => {
          const line = lines.find(l => l.dataKey === entry.dataKey);
          const formattedValue = line?.format
            ? formatAxisTick(entry.value, line.format)
            : entry.value;

          return (
            <div key={index} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-gray-600">{entry.name}:</span>
              <span className="text-sm font-medium text-gray-900">{formattedValue}</span>
            </div>
          );
        })}
      </div>
    );
  };

  // Custom legend content
  const CustomLegend: React.FC<LegendProps> = ({ payload }) => {
    if (!payload) return null;

    return (
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-gray-600">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  };

  // Handle loading state
  if (loading) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height }}>
        <div className="animate-pulse">
          <div className="h-full w-full bg-gray-200 rounded-lg" />
        </div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height }}>
        <div className="text-center">
          <p className="text-red-600 font-medium">Failed to load chart</p>
          <p className="text-gray-500 text-sm mt-1">{error.message}</p>
        </div>
      </div>
    );
  }

  // Handle empty data
  if (!data || data.length === 0) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height }}>
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <ResponsiveContainer width={width} height={height}>
        <RechartsLineChart
          data={data}
          margin={chartConfig.margins}
          onClick={(e) => {
            if (e && e.activePayload && onDataPointClick) {
              const point = e.activePayload[0];
              onDataPointClick(point.payload, point.dataKey as string);
            }
          }}
        >
          {chartConfig.showGrid && (
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#E5E7EB"
              vertical={xAxis.showGridLines !== false}
              horizontal={yAxis.showGridLines !== false}
            />
          )}

          <XAxis
            dataKey={xAxis.dataKey || 'name'}
            tick={{ fontSize: 12, fill: '#6B7280' }}
            tickLine={{ stroke: '#E5E7EB' }}
            axisLine={{ stroke: '#E5E7EB' }}
            tickFormatter={(value) => formatAxisTick(value, xAxis.format)}
            angle={xAxis.angle}
            textAnchor={xAxis.textAnchor || 'middle'}
            height={xAxis.height}
            hide={xAxis.hide}
          />

          <YAxis
            tick={{ fontSize: 12, fill: '#6B7280' }}
            tickLine={{ stroke: '#E5E7EB' }}
            axisLine={{ stroke: '#E5E7EB' }}
            tickFormatter={(value) => formatAxisTick(value, yAxis.format)}
            width={yAxis.width}
            hide={yAxis.hide}
            domain={yAxis.domain}
          />

          {chartConfig.showTooltip && (
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: '#9CA3AF', strokeWidth: 1 }}
            />
          )}

          {chartConfig.showLegend && (
            <Legend content={<CustomLegend />} />
          )}

          {lines.map((line, index) => (
            <Line
              key={line.dataKey}
              type={line.type || 'monotone'}
              dataKey={line.dataKey}
              name={line.name || line.dataKey}
              stroke={line.color || chartConfig.colors![index % chartConfig.colors!.length]}
              strokeWidth={line.strokeWidth || 2}
              dot={line.showDots !== false}
              activeDot={line.showActiveDot !== false ? { r: 6 } : false}
              strokeDasharray={line.dashed ? '5 5' : undefined}
              animationDuration={chartConfig.animate ? 1000 : 0}
              hide={line.hide}
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
};