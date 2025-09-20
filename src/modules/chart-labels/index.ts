/**
 * Chart Labels Module - Intelligent label formatting and positioning
 * Following CNS Architecture: Self-contained module with clear contracts
 */

import { formatCurrency } from '../../utils/formatting';

export interface LabelConfig {
  value: number;
  total?: number;
  index?: number;
  dataKey?: string;
  measureIndex?: number;
  totalMeasures?: number;
  showPercentage?: boolean;
  compact?: boolean;
}

export interface PositionConfig {
  measureIndex: number;
  totalMeasures: number;
  chartType: 'bar' | 'line' | 'pie';
  index?: number;
}

/**
 * Formats a value with currency and optional percentage
 */
export const formatValueWithPercentage = (config: LabelConfig): string => {
  const { value, total, showPercentage = true, compact = true } = config;

  if (!value || value === 0) return '';

  const formattedValue = formatCurrency(value, compact);

  if (showPercentage && total && total > 0) {
    const percentage = ((value / total) * 100).toFixed(1);
    return `${formattedValue}\n(${percentage}%)`;
  }

  return formattedValue;
};

/**
 * Multi-measure label formatter for bar and line charts
 * Handles positioning and formatting for multiple measures
 */
export const createMultiMeasureFormatter = (
  totals: Record<string, number>,
  measures: string[],
  compact: boolean = true
) => {
  return (value: number, dataKey?: string) => {
    if (!value || value === 0) return '';

    // Find which measure this label belongs to
    const measureKey = dataKey || measures[0];
    const total = totals[measureKey];

    return formatValueWithPercentage({
      value,
      total,
      showPercentage: true,
      compact
    });
  };
};

/**
 * Calculate intelligent label position to avoid overlaps
 */
export const calculateLabelPosition = (config: PositionConfig): string => {
  const { measureIndex, totalMeasures, chartType } = config;

  if (chartType === 'bar') {
    // For bar charts, always use 'top' for better visibility
    return 'top';
  }

  if (chartType === 'line') {
    // For line charts, alternate positions for multiple measures
    if (totalMeasures === 1) return 'top';

    // Stagger positions for multiple lines to avoid overlap
    const positions = ['top', 'bottom', 'insideTop', 'insideBottom'];
    return positions[measureIndex % positions.length];
  }

  return 'top';
};

/**
 * Calculate label offset to prevent overlaps in multi-measure scenarios
 */
export const calculateLabelOffset = (
  measureIndex: number,
  totalMeasures: number,
  chartType: 'bar' | 'line'
): number => {
  if (totalMeasures === 1) return chartType === 'line' ? 10 : 5;

  // For multiple measures, create spacing between labels
  const baseOffset = chartType === 'line' ? 15 : 8;
  const measureOffset = measureIndex * 12; // Spacing between different measure labels

  return baseOffset + measureOffset;
};

/**
 * Get optimized label styles based on chart type and measure count
 */
export const getLabelStyles = (
  measureIndex: number = 0,
  totalMeasures: number = 1,
  chartType: 'bar' | 'line' = 'bar'
) => {
  const baseFontSize = totalMeasures > 2 ? 9 : totalMeasures > 1 ? 10 : 11;

  return {
    fontSize: baseFontSize,
    fontWeight: 'bold' as const,
    fill: '#2d2d2d',
    textAnchor: 'middle' as const,
    dominantBaseline: 'auto' as const,
    pointerEvents: 'none' as const,
    // Add text shadow for better readability
    filter: 'drop-shadow(0px 0px 2px rgba(255, 255, 255, 0.8))',
  };
};

/**
 * Smart label component props generator for Recharts
 */
export const generateLabelProps = (
  dataKey: string,
  measureIndex: number,
  measures: string[],
  totals: Record<string, number>,
  chartType: 'bar' | 'line' = 'bar'
) => {
  const position = calculateLabelPosition({
    measureIndex,
    totalMeasures: measures.length,
    chartType,
  });

  const offset = calculateLabelOffset(measureIndex, measures.length, chartType);
  const styles = getLabelStyles(measureIndex, measures.length, chartType);

  return {
    dataKey,
    position,
    offset,
    formatter: createMultiMeasureFormatter(totals, measures, true),
    style: styles,
    // Additional props for better rendering
    angle: 0,
    fill: styles.fill,
  };
};

/**
 * Check if labels should be displayed based on data density
 */
export const shouldDisplayLabels = (
  dataPoints: number,
  measures: number,
  chartWidth: number = 800
): boolean => {
  // Calculate available space per label
  const labelsPerDataPoint = measures;
  const totalLabels = dataPoints * labelsPerDataPoint;
  const spacePerLabel = chartWidth / totalLabels;

  // Minimum 40px per label for readability
  return spacePerLabel >= 40;
};

/**
 * Format label for table display with percentage
 */
export const formatTableCellWithPercentage = (
  value: number,
  total: number,
  formatOptions?: { compact?: boolean }
): { value: string; percentage: string; percentageClass: string } => {
  const percentage = total > 0 ? (value / total) * 100 : 0;

  return {
    value: formatCurrency(value, formatOptions?.compact),
    percentage: `${percentage.toFixed(1)}%`,
    percentageClass:
      percentage > 20 ? 'text-red-600' :
      percentage > 10 ? 'text-orange-600' :
      'text-gray-600'
  };
};