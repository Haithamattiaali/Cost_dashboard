export type Delta = {
  p1: number;
  p2: number;
  abs: number; // p2 - p1
  pct: number | null; // null if p1 = 0
  dir: 'up' | 'down' | 'flat' | 'new';
};

export function computeDelta(p1?: number, p2?: number): Delta {
  const v1 = Number(p1 ?? 0);
  const v2 = Number(p2 ?? 0);
  const abs = v2 - v1;
  const pct = v1 === 0 ? null : (abs / v1) * 100;
  let dir: Delta['dir'] = 'flat';
  if (v1 === 0 && v2 > 0) dir = 'new';
  else if (abs > 0) dir = 'up';
  else if (abs < 0) dir = 'down';
  return { p1: v1, p2: v2, abs, pct, dir };
}

// formatting
export const fmtShort = (n: number) => {
  const s = n < 0 ? '-' : '+';
  const a = Math.abs(n);
  const t = (x: number) => Number(x.toFixed(1)).toString();
  if (a < 1_000) return `${s}${t(a)}`;
  if (a < 1_000_000) return `${s}${t(a / 1e3)}K`;
  if (a < 1_000_000_000) return `${s}${t(a / 1e6)}M`;
  return `${s}${t(a / 1e9)}B`;
};

export const fmtPct = (p: number | null) =>
  p === null ? 'n/a' : `${(p >= 0 ? +1 : -1) * p < 0 ? '-' : '+'}${Math.abs(p!).toFixed(1)}%`;

export const toneForCost = (d: Delta) =>
  d.dir === 'down' ? 'success' : d.dir === 'up' ? 'danger' : 'neutral'; // costs down = good

export function deltaBadgeText(label: string, d: Delta) {
  if (d.dir === 'new') return `${label}: NEW (${fmtShort(d.abs)})`;
  return `${label}: ${fmtPct(d.pct)} (${fmtShort(d.abs)})`;
}

// Currency helpers (reuse existing or define new)
export const fmtCurrency = (n: number, cc = 'SAR') =>
  `${cc} ${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;