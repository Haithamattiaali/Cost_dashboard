/**
 * Browser-based API replacements for cost data operations
 * Uses IndexedDB instead of backend API calls
 */

import { browserDatabase } from '../services/BrowserDatabase';
import { dataProcessor } from '../services/DataProcessor';
import { CostDataRow } from '../services/BrowserDatabase';

// Initialize database on first use
let initialized = false;
async function ensureInitialized() {
  if (!initialized) {
    await browserDatabase.initialize();
    initialized = true;
  }
}

export async function fetchDashboardMetrics(filters?: any) {
  await ensureInitialized();

  // Enhanced logging for filter debugging
  console.log('[API] Fetching dashboard metrics with filters:', filters);
  if (filters) {
    console.log('[API] Filter types - year:', typeof filters.year, 'quarter:', typeof filters.quarter);
    console.log('[API] Filter values - year:', filters.year, 'quarter:', filters.quarter);
  }

  // Get filtered data from IndexedDB
  const data = await browserDatabase.queryData(filters || {});
  console.log('[API] Retrieved data from IndexedDB:', data.length, 'rows');

  if (data.length === 0 && filters && (filters.year || filters.quarter)) {
    console.warn('[API] Warning: Filters resulted in no data. Check filter types and values.');
  }

  // Calculate metrics using DataProcessor
  const metrics = dataProcessor.calculateMetrics(data);
  console.log('[API] Calculated metrics:', metrics);

  return metrics;
}

export async function fetchFilterOptions() {
  await ensureInitialized();

  // Get filter options from IndexedDB
  const options = await browserDatabase.getFilterOptions();

  return options;
}

export async function fetchCostData(filters?: any) {
  await ensureInitialized();

  // Get filtered data from IndexedDB
  const data = await browserDatabase.queryData(filters || {});

  return { data, total: data.length };
}

export async function fetchAggregatedData(dimension: string) {
  await ensureInitialized();

  const data = await browserDatabase.loadData();

  // Aggregate by dimension
  const aggregated = new Map<string, number>();

  data.forEach(row => {
    let key: string = '';

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
      case 'category':
        key = row.tcoModelCategories;
        break;
      case 'glAccount':
        key = row.glAccountName || row.glAccountNo;
        break;
      default:
        key = 'Unknown';
    }

    if (key) {
      aggregated.set(key, (aggregated.get(key) || 0) + (row.totalIncurredCostGlAccountValue || 0));
    }
  });

  return Array.from(aggregated.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export async function compareQuarters(params: {
  currentYear: number;
  currentQuarter: string;
  previousYear: number;
  previousQuarter: string;
}) {
  await ensureInitialized();

  // Normalize quarters to uppercase to ensure consistent matching
  const normalizedCurrentQuarter = params.currentQuarter?.toUpperCase();
  const normalizedPreviousQuarter = params.previousQuarter?.toUpperCase();

  // Get data for both quarters
  const currentData = await browserDatabase.queryData({
    year: params.currentYear,
    quarter: normalizedCurrentQuarter
  });

  const previousData = await browserDatabase.queryData({
    year: params.previousYear,
    quarter: normalizedPreviousQuarter
  });

  // Use DataProcessor to compare
  const comparison = dataProcessor.compareQuarters(currentData, previousData);

  return comparison;
}

export async function compareYearOverYear(currentYear: number, previousYear?: number) {
  await ensureInitialized();

  const currentData = await browserDatabase.queryData({ year: currentYear });
  const prevYear = previousYear || currentYear - 1;
  const previousData = await browserDatabase.queryData({ year: prevYear });

  const currentMetrics = dataProcessor.calculateMetrics(currentData);
  const previousMetrics = dataProcessor.calculateMetrics(previousData);

  const calculateDelta = (current: number, previous: number) => {
    const value = current - previous;
    const percentage = previous > 0 ? (value / previous) * 100 : 0;
    return { value, percentage };
  };

  return {
    current: {
      year: currentYear,
      metrics: currentMetrics
    },
    previous: {
      year: prevYear,
      metrics: previousMetrics
    },
    deltas: {
      totalCost: calculateDelta(currentMetrics.totalCost, previousMetrics.totalCost),
      totalOpex: calculateDelta(currentMetrics.totalOpex, previousMetrics.totalOpex),
      totalCapex: calculateDelta(currentMetrics.totalCapex, previousMetrics.totalCapex),
      dmscoTotal: calculateDelta(currentMetrics.dmscoTotal, previousMetrics.dmscoTotal),
      proceed3PLTotal: calculateDelta(currentMetrics.proceed3PLTotal, previousMetrics.proceed3PLTotal),
    }
  };
}

// Upload functions are now handled directly in Upload.tsx using DataProcessor
// These are kept for compatibility but redirect to browser-based processing
export async function uploadExcelFile(file: File, clearExisting: boolean = false) {
  // This is now handled in Upload.tsx directly
  throw new Error('Upload is now handled client-side. Use DataProcessor.parseExcel() directly.');
}

export async function getUploadStatus() {
  await ensureInitialized();

  const data = await browserDatabase.loadData();

  return {
    hasData: data.length > 0,
    rowCount: data.length,
    lastUpload: data.length > 0 ? new Date() : null
  };
}