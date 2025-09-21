import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Filter, X, Loader2, AlertCircle, Calendar, Hash } from 'lucide-react';
import { fetchFilterOptions } from '../api/costs';

interface FilterPanelProps {
  onFiltersChange: (filters: any) => void;
}

export default function FilterPanel({ onFiltersChange }: FilterPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const lastFiltersRef = useRef<string>('');

  // Initialize filters with a callback to preserve existing values
  const [filters, setFilters] = useState(() => {
    const stored = localStorage.getItem('dashboard-filters');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        // Ignore parse errors
      }
    }
    return {
      year: '',
      quarter: '',
    };
  });

  const { data: filterOptions, isLoading, isError, error } = useQuery({
    queryKey: ['filter-options'],
    queryFn: fetchFilterOptions,
    retry: 2,
    staleTime: 5 * 60 * 1000, // Consider data stale after 5 minutes
  });

  // Helper function to filter out empty or invalid values
  const filterValidOptions = (options: any[] | undefined): any[] => {
    if (!options) return [];
    return options.filter(option => option !== '' && option !== null && option !== undefined);
  };

  // Initialize with latest year when data loads
  useEffect(() => {
    if (filterOptions?.years && filterOptions.years.length > 0 && !isInitialized) {
      const latestYear = Math.max(...filterOptions.years);
      setFilters(prev => ({
        ...prev,
        year: String(latestYear),
        // Keep quarter if already set, otherwise empty
        quarter: prev.quarter || ''
      }));
      setIsInitialized(true);
    }
  }, [filterOptions, isInitialized]);

  // Stable callback for filters change
  const notifyFiltersChange = useCallback(() => {
    const activeFilters = Object.entries(filters).reduce((acc, [key, value]) => {
      if (value) acc[key] = value;
      return acc;
    }, {} as any);

    // Only notify if filters actually changed
    const filtersStr = JSON.stringify(activeFilters);
    if (filtersStr !== lastFiltersRef.current) {
      lastFiltersRef.current = filtersStr;
      // Save to localStorage
      localStorage.setItem('dashboard-filters', JSON.stringify(filters));
      onFiltersChange(activeFilters);
    }
  }, [filters, onFiltersChange]);

  useEffect(() => {
    notifyFiltersChange();
  }, [notifyFiltersChange]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      year: '',
      quarter: '',
    });
    localStorage.removeItem('dashboard-filters');
  };

  const activeFilterCount = Object.values(filters).filter(v => v).length;

  // Build display text for active filters
  const getFilterDisplay = () => {
    const parts = [];
    if (filters.year) {
      parts.push(`Year: ${filters.year}`);
    }
    if (filters.quarter) {
      // Handle both formats: "q1" and "Q1"
      const quarterText = typeof filters.quarter === 'string'
        ? filters.quarter.toUpperCase()
        : filters.quarter;
      parts.push(`Quarter: ${quarterText}`);
    }
    return parts.join(' • ');
  };

  return (
    <div className="filter-panel">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center text-gray-700 hover:text-gray-900"
          >
            <Filter className="h-5 w-5 mr-2" />
            <span className="font-medium">Filters</span>
            {activeFilterCount > 0 && (
              <span className="ml-2 px-2 py-1 text-xs bg-[#9e1f63] text-white rounded-full">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Display selected filters */}
          {activeFilterCount > 0 && (
            <div className="flex items-center text-sm text-gray-600">
              <span className="font-medium">{getFilterDisplay()}</span>
            </div>
          )}
        </div>

        {activeFilterCount > 0 && (
          <button
            onClick={clearFilters}
            className="flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <X className="h-4 w-4 mr-1" />
            Clear all
          </button>
        )}
      </div>

      {isOpen && (
        <>
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-[#9e1f63]" />
              <span className="ml-2 text-gray-600">Loading filter options...</span>
            </div>
          )}

          {isError && (
            <div className="flex items-center justify-center py-8 text-red-600">
              <AlertCircle className="h-5 w-5 mr-2" />
              <span>Failed to load filter options: {(error as Error)?.message || 'Unknown error'}</span>
            </div>
          )}

          {!isLoading && !isError && filterOptions && (
            <div className="grid grid-cols-2 gap-4 fade-in">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                <select
                  value={filters.year}
                  onChange={(e) => handleFilterChange('year', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9e1f63]"
                >
                  <option value="">All Years</option>
                  {filterValidOptions(filterOptions?.years)?.map((year: number) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quarter</label>
                <select
                  value={filters.quarter}
                  onChange={(e) => handleFilterChange('quarter', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9e1f63]"
                >
                  <option value="">All Quarters</option>
                  {filterValidOptions(filterOptions?.quarters)?.map((quarter: string) => (
                    <option key={quarter} value={quarter}>{quarter.toUpperCase()}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}