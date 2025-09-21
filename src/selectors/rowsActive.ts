// Selector hook for getting active rows based on period scope
import { useMemo } from 'react';
import { usePeriodStore, Quarter } from '../state/periodScope';

/**
 * Hook to get active rows based on current mode and period selection
 * @param allRows - All available rows (after other filters)
 * @returns Filtered rows based on period scope
 */
export function useActiveRows(allRows: any[]): any[] {
  const { mode, normal, comparison } = usePeriodStore((state) => ({
    mode: state.mode,
    normal: state.normal,
    comparison: state.comparison
  }));

  return useMemo(() => {
    if (!allRows || allRows.length === 0) return [];

    if (mode === 'normal') {
      // Normal mode: filter by year and selected quarters
      if (normal.kind === 'all') {
        // All quarters for the selected year
        return allRows.filter((row) => {
          const rowYear = Number(row.Year || row.year);
          if (rowYear !== normal.year) return false;

          // Check if row's quarter is in the available quarters set
          const rowQuarter = parseQuarter(row);
          return rowQuarter !== null && normal.quarters.has(rowQuarter);
        });
      } else {
        // Single quarter for the selected year
        return allRows.filter((row) => {
          const rowYear = Number(row.Year || row.year);
          if (rowYear !== normal.year) return false;

          const rowQuarter = parseQuarter(row);
          return rowQuarter === normal.quarter;
        });
      }
    } else if (mode === 'comparison') {
      // Comparison mode: return rows for both P1 and P2
      // This will be handled by the existing comparison logic
      // For now, return all rows and let Dashboard handle the comparison filtering
      return allRows;
    }

    return allRows;
  }, [mode, normal, comparison, allRows]);
}

/**
 * Parse quarter value from a data row
 * Handles various formats: 'Q1', 'q1', '1', 1
 */
function parseQuarter(row: any): Quarter | null {
  // Try multiple possible field names
  const quarterFields = ['Quarter', 'Qtr', 'quarter', 'qtr'];

  for (const field of quarterFields) {
    const val = row[field];
    if (val === undefined || val === null) continue;

    let qNum: number;
    if (typeof val === 'number') {
      qNum = val;
    } else {
      const strVal = String(val).toUpperCase().trim();
      if (strVal.startsWith('Q')) {
        qNum = Number(strVal.substring(1));
      } else {
        qNum = Number(strVal);
      }
    }

    if (qNum >= 1 && qNum <= 4) {
      return qNum as Quarter;
    }
  }

  return null;
}

/**
 * Hook to get active rows for comparison mode
 * Returns separate arrays for period 1 and period 2
 */
export function useComparisonRows(allRows: any[]): {
  p1Rows: any[];
  p2Rows: any[];
} {
  const { comparison } = usePeriodStore((state) => ({
    comparison: state.comparison
  }));

  return useMemo(() => {
    if (!allRows || allRows.length === 0) {
      return { p1Rows: [], p2Rows: [] };
    }

    const p1Rows = comparison.p1
      ? allRows.filter((row) => {
          const rowYear = Number(row.Year || row.year);
          const rowQuarter = parseQuarter(row);
          return rowYear === comparison.p1.year && rowQuarter === comparison.p1.quarter;
        })
      : [];

    const p2Rows = comparison.p2
      ? allRows.filter((row) => {
          const rowYear = Number(row.Year || row.year);
          const rowQuarter = parseQuarter(row);
          return rowYear === comparison.p2.year && rowQuarter === comparison.p2.quarter;
        })
      : [];

    return { p1Rows, p2Rows };
  }, [comparison, allRows]);
}