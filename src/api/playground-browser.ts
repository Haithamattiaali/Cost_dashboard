/**
 * Browser-based playground API for data visualization
 * Uses IndexedDB instead of backend API calls
 */

import { browserDatabase } from '../services/BrowserDatabase';

export interface PlaygroundDataResponse {
  success: boolean;
  data: Array<{
    name: string;
    value?: number; // For backward compatibility with single measure
    [measureKey: string]: string | number | undefined; // Support multiple measure values
  }>;
  dimension: string;
  measure?: string; // For backward compatibility
  measures?: string[]; // New: array of measures
  totalRows: number;
}

// Initialize database on first use
let initialized = false;
async function ensureInitialized() {
  if (!initialized) {
    await browserDatabase.initialize();
    initialized = true;
  }
}

/**
 * Fetch aggregated data for playground visualization
 * @param dimension - The dimension to group by
 * @param measure - The measure to aggregate
 * @returns Aggregated data for visualization
 */
export async function fetchPlaygroundData(
  dimension: string,
  measure: string
): Promise<PlaygroundDataResponse> {
  await ensureInitialized();

  const data = await browserDatabase.loadData();

  // Aggregate data by dimension
  const aggregated = new Map<string, number>();

  data.forEach(row => {
    let key: string = '';
    let value: number = 0;

    // Get dimension value
    switch (dimension) {
      case 'warehouse':
        key = row.warehouse;
        break;
      case 'quarter':
        key = `${row.year} ${row.quarter}`;
        break;
      case 'type':
        key = row.type;
        break;
      case 'tcoModelCategories':
        key = row.tcoModelCategories;
        break;
      case 'glAccountName':
        key = row.glAccountName;
        break;
      case 'opexCapex':
        key = row.opexCapex;
        break;
      default:
        key = (row as any)[dimension] || 'Unknown';
    }

    // Get measure value
    switch (measure) {
      case 'totalCost':
        value = row.totalIncurredCostGlAccountValue || 0;
        break;
      case 'dmscoValue':
        value = row.valueDmsco || 0;
        break;
      case 'proceed3PLValue':
        value = row.valueProceed3PL || 0;
        break;
      default:
        value = (row as any)[measure] || 0;
    }

    if (key) {
      aggregated.set(key, (aggregated.get(key) || 0) + value);
    }
  });

  const result = Array.from(aggregated.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  return {
    success: true,
    data: result,
    dimension,
    measure,
    totalRows: result.length
  };
}

/**
 * Fetch aggregated data for multiple measures
 * @param dimension - The dimension to group by
 * @param measures - Array of measures to aggregate
 * @returns Aggregated data for visualization with multiple measures
 */
export async function fetchMultiMeasureData(
  dimension: string,
  measures: string[]
): Promise<PlaygroundDataResponse> {
  await ensureInitialized();

  const data = await browserDatabase.loadData();

  // Aggregate data by dimension for multiple measures
  const aggregated = new Map<string, Record<string, number>>();

  data.forEach(row => {
    let key: string = '';

    // Get dimension value
    switch (dimension) {
      case 'warehouse':
        key = row.warehouse;
        break;
      case 'quarter':
        key = `${row.year} ${row.quarter}`;
        break;
      case 'type':
        key = row.type;
        break;
      case 'tcoModelCategories':
        key = row.tcoModelCategories;
        break;
      case 'glAccountName':
        key = row.glAccountName;
        break;
      default:
        key = (row as any)[dimension] || 'Unknown';
    }

    if (key) {
      const existing = aggregated.get(key) || {};

      measures.forEach(measure => {
        let value: number = 0;

        switch (measure) {
          case 'totalCost':
            value = row.totalIncurredCostGlAccountValue || 0;
            break;
          case 'dmscoValue':
            value = row.valueDmsco || 0;
            break;
          case 'proceed3PLValue':
            value = row.valueProceed3PL || 0;
            break;
          default:
            value = (row as any)[measure] || 0;
        }

        existing[measure] = (existing[measure] || 0) + value;
      });

      aggregated.set(key, existing);
    }
  });

  const result = Array.from(aggregated.entries())
    .map(([name, values]) => ({ name, ...values }))
    .sort((a, b) => {
      // Sort by first measure value
      const firstMeasure = measures[0];
      const aVal = (a as any)[firstMeasure] || 0;
      const bVal = (b as any)[firstMeasure] || 0;
      return bVal - aVal;
    });

  return {
    success: true,
    data: result,
    dimension,
    measures,
    totalRows: result.length
  };
}

/**
 * Fetch filtered playground data with custom filters
 * @param dimension - The dimension to group by
 * @param measure - The measure to aggregate
 * @param filters - Additional filters to apply
 * @returns Filtered aggregated data
 */
export async function fetchFilteredPlaygroundData(
  dimension: string,
  measure: string,
  filters?: Record<string, any>
): Promise<PlaygroundDataResponse> {
  await ensureInitialized();

  const data = await browserDatabase.queryData(filters || {});

  // Aggregate filtered data
  const aggregated = new Map<string, number>();

  data.forEach(row => {
    let key: string = '';
    let value: number = 0;

    // Get dimension value
    switch (dimension) {
      case 'warehouse':
        key = row.warehouse;
        break;
      case 'quarter':
        key = `${row.year} ${row.quarter}`;
        break;
      case 'type':
        key = row.type;
        break;
      case 'tcoModelCategories':
        key = row.tcoModelCategories;
        break;
      case 'glAccountName':
        key = row.glAccountName;
        break;
      default:
        key = (row as any)[dimension] || 'Unknown';
    }

    // Get measure value
    switch (measure) {
      case 'totalCost':
        value = row.totalIncurredCostGlAccountValue || 0;
        break;
      case 'dmscoValue':
        value = row.valueDmsco || 0;
        break;
      case 'proceed3PLValue':
        value = row.valueProceed3PL || 0;
        break;
      default:
        value = (row as any)[measure] || 0;
    }

    if (key) {
      aggregated.set(key, (aggregated.get(key) || 0) + value);
    }
  });

  const result = Array.from(aggregated.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  return {
    success: true,
    data: result,
    dimension,
    measure,
    totalRows: result.length
  };
}

/**
 * Fetch filtered data for multiple measures
 * @param dimension - The dimension to group by
 * @param measures - Array of measures to aggregate
 * @param filters - Additional filters to apply
 * @returns Filtered aggregated data with multiple measures
 */
export async function fetchFilteredMultiMeasureData(
  dimension: string,
  measures: string[],
  filters?: Record<string, any>
): Promise<PlaygroundDataResponse> {
  await ensureInitialized();

  const data = await browserDatabase.queryData(filters || {});

  // Aggregate filtered data for multiple measures
  const aggregated = new Map<string, Record<string, number>>();

  data.forEach(row => {
    let key: string = '';

    // Get dimension value
    switch (dimension) {
      case 'warehouse':
        key = row.warehouse;
        break;
      case 'quarter':
        key = `${row.year} ${row.quarter}`;
        break;
      case 'type':
        key = row.type;
        break;
      case 'tcoModelCategories':
        key = row.tcoModelCategories;
        break;
      case 'glAccountName':
        key = row.glAccountName;
        break;
      default:
        key = (row as any)[dimension] || 'Unknown';
    }

    if (key) {
      const existing = aggregated.get(key) || {};

      measures.forEach(measure => {
        let value: number = 0;

        switch (measure) {
          case 'totalCost':
            value = row.totalIncurredCostGlAccountValue || 0;
            break;
          case 'dmscoValue':
            value = row.valueDmsco || 0;
            break;
          case 'proceed3PLValue':
            value = row.valueProceed3PL || 0;
            break;
          default:
            value = (row as any)[measure] || 0;
        }

        existing[measure] = (existing[measure] || 0) + value;
      });

      aggregated.set(key, existing);
    }
  });

  const result = Array.from(aggregated.entries())
    .map(([name, values]) => ({ name, ...values }))
    .sort((a, b) => {
      // Sort by first measure value
      const firstMeasure = measures[0];
      const aVal = (a as any)[firstMeasure] || 0;
      const bVal = (b as any)[firstMeasure] || 0;
      return bVal - aVal;
    });

  return {
    success: true,
    data: result,
    dimension,
    measures,
    totalRows: result.length
  };
}