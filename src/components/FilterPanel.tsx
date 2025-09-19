import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Filter, X, Loader2, AlertCircle } from 'lucide-react';
import { fetchFilterOptions } from '../api/costs';

interface FilterPanelProps {
  onFiltersChange: (filters: any) => void;
}

export default function FilterPanel({ onFiltersChange }: FilterPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState({
    year: '',
    quarter: '',
    warehouse: '',
    type: '',
    costType: '',
    opexCapex: '',
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


  useEffect(() => {
    const activeFilters = Object.entries(filters).reduce((acc, [key, value]) => {
      if (value) acc[key] = value;
      return acc;
    }, {} as any);
    onFiltersChange(activeFilters);
  }, [filters, onFiltersChange]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      year: '',
      quarter: '',
      warehouse: '',
      type: '',
      costType: '',
      opexCapex: '',
    });
  };

  const activeFilterCount = Object.values(filters).filter(v => v).length;

  return (
    <div className="filter-panel">
      <div className="flex items-center justify-between mb-4">
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 fade-in">
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Warehouse</label>
                <select
                  value={filters.warehouse}
                  onChange={(e) => handleFilterChange('warehouse', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9e1f63]"
                  disabled={filterValidOptions(filterOptions?.warehouses).length === 0}
                >
                  <option value="">
                    {filterValidOptions(filterOptions?.warehouses).length === 0
                      ? "No Warehouses Available"
                      : "All Warehouses"}
                  </option>
                  {filterValidOptions(filterOptions?.warehouses)?.map((warehouse: string) => (
                    <option key={warehouse} value={warehouse}>{warehouse}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={filters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9e1f63]"
                >
                  <option value="">All Types</option>
                  {filterValidOptions(filterOptions?.types)?.map((type: string) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cost Type</label>
                <select
                  value={filters.costType}
                  onChange={(e) => handleFilterChange('costType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9e1f63]"
                >
                  <option value="">All Cost Types</option>
                  {filterValidOptions(filterOptions?.costTypes)?.map((costType: string) => (
                    <option key={costType} value={costType}>{costType}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">OPEX/CAPEX</label>
                <select
                  value={filters.opexCapex}
                  onChange={(e) => handleFilterChange('opexCapex', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9e1f63]"
                >
                  <option value="">All</option>
                  {filterValidOptions(filterOptions?.opexCapex)?.map((opex: string) => (
                    <option key={opex} value={opex}>{opex}</option>
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