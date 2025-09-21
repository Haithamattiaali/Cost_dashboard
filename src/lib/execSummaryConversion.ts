import { computeDelta, asNum } from '../utils/delta';

type Row = Record<string, any>;

export function summarizeConversion(
  rowsAll: Row[],                 // filtered rows for BOTH periods
  selectedKeys: Set<string | number>,  // keys of selected rows (table checkboxes)
  periods: { p1: { year: number, qtr: number }, p2: { year: number, qtr: number } },
  cfg = {
    valueKey: 'totalIncurredCost',
    catKey: 'mainCategories',
    keyCols: ['glAccountNo'],
    currency: 'SAR',
    yearCol: 'year',
    qtrCol: 'quarter'
  }
) {
  const { valueKey, catKey, keyCols, currency, yearCol, qtrCol } = cfg;
  const keyOf = (r: Row) => keyCols.map(k => r[k]).join('␟');

  const inP = (r: Row, p: { year: number, qtr: number }) => {
    const year = Number(r[yearCol]);
    const qtr = String(r[qtrCol]).toLowerCase();
    return year === p.year && qtr === `q${p.qtr}`;
  };

  // slice by period
  const rowsP1 = rowsAll.filter(r => inP(r, periods.p1));
  const rowsP2 = rowsAll.filter(r => inP(r, periods.p2));

  // totals (quarter totals)
  const totalP1 = rowsP1.reduce((s, r) => s + asNum(r[valueKey]), 0);
  const totalP2 = rowsP2.reduce((s, r) => s + asNum(r[valueKey]), 0);

  // selected subsets (by table selection)
  const selP1 = rowsP1.filter(r => selectedKeys.has(keyOf(r)));
  const selP2 = rowsP2.filter(r => selectedKeys.has(keyOf(r)));

  const selectedP1 = selP1.reduce((s, r) => s + asNum(r[valueKey]), 0);
  const selectedP2 = selP2.reduce((s, r) => s + asNum(r[valueKey]), 0);

  // coverage per period (selected / total of that period)
  const coverageP1 = totalP1 === 0 ? 0 : (selectedP1 / totalP1) * 100;
  const coverageP2 = totalP2 === 0 ? 0 : (selectedP2 / totalP2) * 100;

  // deltas between periods
  const dSelected = computeDelta(selectedP1, selectedP2);
  const dCoverage = computeDelta(coverageP1, coverageP2); // % points diff

  // selected categories — aggregate by category in each period
  const agg = (rows: Row[]) => {
    const m = new Map<string, number>();
    for (const r of rows) {
      const k = (r[catKey] ?? 'Uncategorized') as string;
      m.set(k, (m.get(k) ?? 0) + asNum(r[valueKey]));
    }
    return m;
  };

  const catP1 = agg(selP1);
  const catP2 = agg(selP2);
  const catKeys = new Set<string>([...catP1.keys(), ...catP2.keys()]);

  const categories = [...catKeys].map(k => {
    const v1 = catP1.get(k) ?? 0;
    const v2 = catP2.get(k) ?? 0;
    const d = computeDelta(v1, v2);
    const pctOfTotalP2 = totalP2 === 0 ? 0 : (v2 / totalP2) * 100;
    return { label: k, v1, v2, delta: d, pctOfTotalP2 };
  }).sort((a, b) => b.pctOfTotalP2 - a.pctOfTotalP2);

  return {
    totals: {
      p1: { total: totalP1, selected: selectedP1, coverage: coverageP1 },
      p2: { total: totalP2, selected: selectedP2, coverage: coverageP2 },
      delta: { selected: dSelected, coverage: dCoverage }
    },
    categories,
    currency
  };
}