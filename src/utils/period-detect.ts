// Utility functions for detecting available periods in dataset

import { Quarter } from '../state/periodScope';

/**
 * Extract available quarters for each year in the dataset
 * @param rows - The dataset rows
 * @param yearKey - The key for year field (default: 'Year')
 * @param quarterKey - The key for quarter field (default: 'Quarter' or 'Qtr')
 * @returns Map of year to set of available quarters
 */
export function availableQuarters(
  rows: any[],
  yearKey = 'Year',
  quarterKeys: string[] = ['Quarter', 'Qtr', 'quarter', 'qtr']
): Map<number, Set<Quarter>> {
  const result = new Map<number, Set<Quarter>>();

  if (!rows || rows.length === 0) return result;

  for (const row of rows) {
    const year = Number(row[yearKey]);
    if (!year || isNaN(year)) continue;

    // Try to find quarter value using multiple possible keys
    let quarterValue: number | null = null;
    for (const qKey of quarterKeys) {
      const val = row[qKey];
      if (val !== undefined && val !== null) {
        // Handle different formats: 'Q1', 'q1', '1', 1
        let qNum: number;
        if (typeof val === 'number') {
          qNum = val;
        } else {
          const strVal = String(val).toUpperCase();
          if (strVal.startsWith('Q')) {
            qNum = Number(strVal.substring(1));
          } else {
            qNum = Number(strVal);
          }
        }

        if (qNum >= 1 && qNum <= 4) {
          quarterValue = qNum as Quarter;
          break;
        }
      }
    }

    if (!quarterValue) continue;

    if (!result.has(year)) {
      result.set(year, new Set<Quarter>());
    }
    result.get(year)!.add(quarterValue);
  }

  return result;
}

/**
 * Get the latest year from the available quarters map
 */
export function getLatestYear(quarterMap: Map<number, Set<Quarter>>): number | null {
  if (quarterMap.size === 0) return null;
  return Math.max(...Array.from(quarterMap.keys()));
}

/**
 * Check if a quarter exists for a given year
 */
export function quarterExistsForYear(
  quarterMap: Map<number, Set<Quarter>>,
  year: number,
  quarter: Quarter
): boolean {
  const quarters = quarterMap.get(year);
  return quarters ? quarters.has(quarter) : false;
}