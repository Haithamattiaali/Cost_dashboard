type Row = Record<string, any>;

// Column names - adjust based on your actual data structure
const NUM_KEY = 'totalIncurredCost';     // numeric source column
const KEY_COLS = ['glAccountNo'];        // stable join key(s)
const YEAR_COL = 'year';
const QTR_COL = 'quarter';

const asNumber = (v: any): number => {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    // Remove currency symbols, commas, and other non-numeric chars
    const cleaned = v.replace(/[^\d.-]/g, '');
    return Number(cleaned) || 0;
  }
  return 0;
};

const keyOf = (r: Row) => KEY_COLS.map(k => r[k]).join('␟'); // stable composite key

export type ConvRow = Row & {
  p1: number;
  p2: number;
  deltaAbs: number;                      // p2 - p1
  deltaPct: number | null;               // null if p1 === 0
};

/** Build P1/P2 merged rows filtered by the selected periods */
export function buildConversionRows(
  all: Row[],
  p1: { year: number; quarter: string },
  p2: { year: number; quarter: string }
): ConvRow[] {
  // 1) slice P1 and P2
  const s1 = all.filter(r => {
    const year = Number(r[YEAR_COL]);
    const qtr = String(r[QTR_COL]).toLowerCase();
    return year === p1.year && qtr === p1.quarter.toLowerCase();
  });

  const s2 = all.filter(r => {
    const year = Number(r[YEAR_COL]);
    const qtr = String(r[QTR_COL]).toLowerCase();
    return year === p2.year && qtr === p2.quarter.toLowerCase();
  });

  // 2) aggregate by key in each slice (sum totals)
  const agg = (rows: Row[]) => {
    const m = new Map<string, { sum: number; row: Row }>();
    for (const r of rows) {
      const k = keyOf(r);
      const existing = m.get(k);
      if (existing) {
        m.set(k, {
          sum: existing.sum + asNumber(r[NUM_KEY]),
          row: r // keep last row for display fields
        });
      } else {
        m.set(k, {
          sum: asNumber(r[NUM_KEY]),
          row: r
        });
      }
    }
    return m;
  };

  const m1 = agg(s1);
  const m2 = agg(s2);

  // 3) union keys and produce merged rows
  const keys = new Set<string>([...m1.keys(), ...m2.keys()]);
  const out: ConvRow[] = [];

  for (const k of keys) {
    const p1Data = m1.get(k);
    const p2Data = m2.get(k);

    const p1v = p1Data?.sum ?? 0;
    const p2v = p2Data?.sum ?? 0;
    const deltaAbs = p2v - p1v;
    const deltaPct = p1v === 0 ? null : (deltaAbs / p1v) * 100;

    // Pick representative row (prefer P2, else P1) to carry display fields
    const baseRow = p2Data?.row ?? p1Data?.row ?? {};

    out.push({
      ...baseRow,
      p1: p1v,
      p2: p2v,
      deltaAbs,
      deltaPct,
    });
  }

  return out;
}