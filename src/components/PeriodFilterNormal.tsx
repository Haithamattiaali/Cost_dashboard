// Period filter component for Normal Mode
import React, { useMemo, useEffect } from 'react';
import { usePeriodStore, Quarter } from '../state/periodScope';
import { availableQuarters, getLatestYear } from '../utils/period-detect';

interface PeriodFilterNormalProps {
  rows: any[];  // The current dataset
  className?: string;
}

export default function PeriodFilterNormal({ rows, className }: PeriodFilterNormalProps) {
  const { normal, setNormalAll, setNormalSingle } = usePeriodStore();

  // Detect available quarters from the dataset
  const quarterMap = useMemo(() => availableQuarters(rows), [rows]);
  const years = useMemo(() => {
    const yearList = Array.from(quarterMap.keys()).sort((a, b) => a - b);
    return yearList;
  }, [quarterMap]);

  // Initialize with latest year when data loads
  useEffect(() => {
    if (quarterMap.size > 0 && normal.kind === 'all' && normal.quarters.size === 0) {
      const latestYear = getLatestYear(quarterMap);
      if (latestYear) {
        const quarters = quarterMap.get(latestYear) || new Set<Quarter>();
        setNormalAll(latestYear, quarters);
      }
    }
  }, [quarterMap, normal, setNormalAll]);

  // Handle year change
  const handleYearChange = (yearStr: string) => {
    const year = Number(yearStr);
    const quarters = quarterMap.get(year) || new Set<Quarter>();
    setNormalAll(year, quarters);
  };

  // Handle quarter change
  const handleQuarterChange = (value: string) => {
    if (value === 'ALL') {
      const quarters = quarterMap.get(normal.year) || new Set<Quarter>();
      setNormalAll(normal.year, quarters);
    } else {
      const quarter = Number(value.replace('Q', '')) as Quarter;
      setNormalSingle(normal.year, quarter);
    }
  };

  // Get current year
  const currentYear = normal.kind === 'all' ? normal.year : normal.year;

  // Get available quarters for current year
  const availableQuartersForYear = useMemo(() => {
    const quarters = quarterMap.get(currentYear);
    if (!quarters || quarters.size === 0) return [];
    return Array.from(quarters).sort();
  }, [currentYear, quarterMap]);

  // Get current quarter value for select
  const currentQuarterValue = normal.kind === 'all' ? 'ALL' : `Q${normal.quarter}`;

  return (
    <div className={`flex items-center gap-4 ${className || ''}`}>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
        <select
          value={currentYear}
          onChange={(e) => handleYearChange(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9e1f63] min-w-[100px]"
        >
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Quarter</label>
        <select
          value={currentQuarterValue}
          onChange={(e) => handleQuarterChange(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9e1f63] min-w-[140px]"
        >
          <option value="ALL">All Quarters</option>
          {availableQuartersForYear.map((q) => (
            <option key={q} value={`Q${q}`}>
              Q{q}
            </option>
          ))}
        </select>
      </div>

      {/* Period context chip */}
      <div className="ml-4 px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700">
        {normal.kind === 'all'
          ? `All quarters • FY${currentYear}`
          : `Quarter Q${normal.quarter} • FY${currentYear}`}
      </div>
    </div>
  );
}