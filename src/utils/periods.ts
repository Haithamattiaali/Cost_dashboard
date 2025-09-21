// Period normalization and extraction utilities

export type Granularity = 'quarter' | 'month' | 'year';

export type PeriodKey = string; // e.g., "2025-Q2" | "2025-03" | "2025"

export type Period = {
  key: PeriodKey;
  type: Granularity;
  year: number;
  quarter?: 1 | 2 | 3 | 4;
  month?: number; // 1-12
  start: Date;
  end: Date;
  display: string;
  value: string; // For backward compatibility with existing code
};

// Regular expressions for parsing
const Q_RX = /\bQ([1-4])\b/i;
const Y_RX = /(?:^|\D)(\d{4})\b/;
const YM_ISO_RX = /^(\d{4})[-/](\d{1,2})$/;
const YM_COMPACT_RX = /^(\d{4})(\d{2})$/;
const MON_RX = /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\b/i;

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_MAP: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12
};

// Helper functions to extract year/quarter/month from various formats
export function yearFrom(value: any): number | null {
  if (!value) return null;
  if (typeof value === 'number' && value > 1900 && value < 2100) return value;

  const str = String(value);
  const match = str.match(Y_RX);
  if (match) {
    const year = parseInt(match[1], 10);
    if (year > 1900 && year < 2100) return year;
  }

  // Try parsing as date
  const date = new Date(value);
  if (!isNaN(date.getTime())) {
    const year = date.getFullYear();
    if (year > 1900 && year < 2100) return year;
  }

  return null;
}

export function quarterFrom(value: any): number | null {
  if (!value) return null;

  const str = String(value).toLowerCase();

  // Check for Q# pattern
  const qMatch = str.match(Q_RX);
  if (qMatch) {
    return parseInt(qMatch[1], 10) as 1 | 2 | 3 | 4;
  }

  // Check for q1, q2, q3, q4 values
  if (str === 'q1') return 1;
  if (str === 'q2') return 2;
  if (str === 'q3') return 3;
  if (str === 'q4') return 4;

  // Try parsing as date and derive quarter
  const date = new Date(value);
  if (!isNaN(date.getTime())) {
    const month = date.getMonth() + 1;
    return Math.ceil(month / 3) as 1 | 2 | 3 | 4;
  }

  return null;
}

export function monthFrom(value: any): number | null {
  if (!value) return null;

  if (typeof value === 'number' && value >= 1 && value <= 12) return value;

  const str = String(value);

  // Check ISO format YYYY-MM
  const isoMatch = str.match(YM_ISO_RX);
  if (isoMatch) {
    const month = parseInt(isoMatch[2], 10);
    if (month >= 1 && month <= 12) return month;
  }

  // Check compact format YYYYMM
  const compactMatch = str.match(YM_COMPACT_RX);
  if (compactMatch) {
    const month = parseInt(compactMatch[2], 10);
    if (month >= 1 && month <= 12) return month;
  }

  // Check month name
  const monMatch = str.match(MON_RX);
  if (monMatch) {
    const monthName = monMatch[1].toLowerCase().slice(0, 3);
    return MONTH_MAP[monthName] || null;
  }

  // Try parsing as date
  const date = new Date(value);
  if (!isNaN(date.getTime())) {
    return date.getMonth() + 1;
  }

  return null;
}

// Create Period objects
export function makeQuarter(year: number, quarter: 1 | 2 | 3 | 4): Period {
  const startMonth = (quarter - 1) * 3;
  const endMonth = startMonth + 2;
  const start = new Date(year, startMonth, 1);
  const end = new Date(year, endMonth + 1, 0); // Last day of the quarter

  return {
    key: `${year}-Q${quarter}`,
    type: 'quarter',
    year,
    quarter,
    start,
    end,
    display: `Q${quarter} ${year}`,
    value: `q${quarter}` // For backward compatibility
  };
}

export function makeMonth(year: number, month: number): Period {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0); // Last day of the month

  return {
    key: `${year}-${String(month).padStart(2, '0')}`,
    type: 'month',
    year,
    month,
    start,
    end,
    display: `${MONTH_NAMES[month - 1]} ${year}`,
    value: `${year}-${String(month).padStart(2, '0')}`
  };
}

export function makeYear(year: number): Period {
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);

  return {
    key: `${year}`,
    type: 'year',
    year,
    start,
    end,
    display: `${year}`,
    value: `${year}`
  };
}

// Detect schema from data
export function detectSchema(
  rows: any[],
  opts: { preferredGranularity?: 'auto' | Granularity } = {}
): Granularity {
  if (!rows || rows.length === 0) return 'quarter';

  const firstRow = rows[0];
  const has = (key: string) => firstRow && Object.prototype.hasOwnProperty.call(firstRow, key);
  const pref = opts.preferredGranularity ?? 'auto';

  // Check for explicit year + quarter columns
  if (has('year') && has('quarter')) return 'quarter';

  // Check for explicit year + month columns
  if (has('year') && has('month')) return 'month';

  // Check for period column and infer from its content
  if (has('period') || has('Period')) {
    return inferFromPeriodColumn(rows.map(r => r.period || r.Period));
  }

  // Check for date columns
  if (has('date') || has('Date')) {
    return pref === 'month' ? 'month' : 'quarter';
  }

  // Default to quarter
  return 'quarter';
}

// Infer granularity from period values
export function inferFromPeriodColumn(values: any[]): Granularity {
  const samples = values.filter(v => v != null).slice(0, 10);
  if (samples.length === 0) return 'quarter';

  let hasQuarter = false;
  let hasMonth = false;

  for (const val of samples) {
    const str = String(val);
    if (Q_RX.test(str)) hasQuarter = true;
    if (MON_RX.test(str) || YM_ISO_RX.test(str) || YM_COMPACT_RX.test(str)) hasMonth = true;
  }

  // Prefer month if found, otherwise quarter
  if (hasMonth) return 'month';
  if (hasQuarter) return 'quarter';
  return 'quarter';
}

// Normalize a row to a Period
export function normalizeRowToPeriod(row: any, gran: Granularity): Period | null {
  if (gran === 'quarter') {
    const y = row.year ?? yearFrom(row.date ?? row.Date ?? row.period ?? row.Period);
    const q = row.quarter ?? quarterFrom(row.date ?? row.Date ?? row.period ?? row.Period ?? row.quarter);
    if (!y || !q) return null;
    return makeQuarter(y, q as 1 | 2 | 3 | 4);
  }

  if (gran === 'month') {
    const y = row.year ?? yearFrom(row.date ?? row.Date ?? row.period ?? row.Period);
    const m = row.month ?? monthFrom(row.date ?? row.Date ?? row.period ?? row.Period);
    if (!y || !m) return null;
    return makeMonth(y, m);
  }

  const y = row.year ?? yearFrom(row.date ?? row.Date ?? row.period ?? row.Period);
  return y ? makeYear(y) : null;
}

// Extract available periods from dataset
export function extractAvailablePeriods(
  rows: any[],
  opts: { preferredGranularity?: 'auto' | Granularity } = {}
): Period[] {
  if (!rows || rows.length === 0) return [];

  // Detect schema
  const schema = detectSchema(rows, opts);

  // Map rows to normalized periods
  const seen = new Map<string, Period>();

  for (const row of rows) {
    const period = normalizeRowToPeriod(row, schema);
    if (!period) continue;
    if (!seen.has(period.key)) {
      seen.set(period.key, period);
    }
  }

  // Sort by start date ascending
  return Array.from(seen.values()).sort((a, b) => a.start.getTime() - b.start.getTime());
}

// Pick default comparison periods
export function pickDefaultComparison(periods: Period[]): {
  p1: Period | null;
  p2: Period | null;
} {
  const n = periods.length;
  if (n >= 2) {
    return { p2: periods[n - 1], p1: periods[n - 2] };
  }
  if (n === 1) {
    return { p2: periods[0], p1: periods[0] };
  }
  return { p1: null, p2: null };
}

// Validate if a period key exists in the available periods
export function isPeriodValid(key: PeriodKey | null, periods: Period[]): boolean {
  if (!key) return false;
  return periods.some(p => p.key === key);
}

// Find a period by its key
export function findPeriodByKey(key: PeriodKey, periods: Period[]): Period | null {
  return periods.find(p => p.key === key) || null;
}

// Convert legacy quarter format to Period
export function convertLegacyQuarter(quarter: string | null, year: number | null): Period | null {
  if (!quarter || !year) return null;

  const q = quarterFrom(quarter);
  if (!q) return null;

  return makeQuarter(year, q as 1 | 2 | 3 | 4);
}