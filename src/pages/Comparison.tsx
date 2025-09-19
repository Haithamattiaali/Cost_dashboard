import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { compareQuarters, compareYearOverYear, fetchFilterOptions } from '../api/costs';
import { formatCurrency, formatPercentage } from '../utils/formatting';

export default function Comparison() {
  const [comparisonType, setComparisonType] = useState<'quarter' | 'year'>('quarter');
  const [quarterComparison, setQuarterComparison] = useState({
    currentYear: 2025,
    currentQuarter: 'q2',
    previousYear: 2025,
    previousQuarter: 'q1',
  });
  const [yearComparison, setYearComparison] = useState({
    currentYear: 2025,
    previousYear: 2024,
  });

  const { data: filterOptions } = useQuery({
    queryKey: ['filter-options'],
    queryFn: fetchFilterOptions,
  });

  const { data: quarterData, isLoading: quarterLoading } = useQuery({
    queryKey: ['quarter-comparison', quarterComparison],
    queryFn: () => compareQuarters(quarterComparison),
    enabled: comparisonType === 'quarter',
  });

  const { data: yearData, isLoading: yearLoading } = useQuery({
    queryKey: ['year-comparison', yearComparison],
    queryFn: () => compareYearOverYear(yearComparison.currentYear, yearComparison.previousYear),
    enabled: comparisonType === 'year',
  });

  const isLoading = comparisonType === 'quarter' ? quarterLoading : yearLoading;
  const comparisonData = comparisonType === 'quarter' ? quarterData?.comparison : yearData?.comparison;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Period Comparison</h1>
        <p className="text-gray-500 mt-1">Compare costs across different time periods</p>
      </div>

      {/* Comparison Type Selector */}
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <div className="flex space-x-4 mb-4">
          <button
            onClick={() => setComparisonType('quarter')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              comparisonType === 'quarter'
                ? 'bg-[#9e1f63] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Quarter Comparison
          </button>
          <button
            onClick={() => setComparisonType('year')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              comparisonType === 'year'
                ? 'bg-[#9e1f63] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Year-over-Year
          </button>
        </div>

        {/* Period Selectors */}
        {comparisonType === 'quarter' ? (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Year</label>
              <select
                value={quarterComparison.currentYear}
                onChange={(e) => setQuarterComparison(prev => ({
                  ...prev,
                  currentYear: parseInt(e.target.value)
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                {filterOptions?.years?.map((year: number) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Quarter</label>
              <select
                value={quarterComparison.currentQuarter}
                onChange={(e) => setQuarterComparison(prev => ({
                  ...prev,
                  currentQuarter: e.target.value
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                {filterOptions?.quarters?.map((quarter: string) => (
                  <option key={quarter} value={quarter}>{quarter.toUpperCase()}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-center">
              <ArrowRight className="h-5 w-5 text-gray-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Previous Year</label>
              <select
                value={quarterComparison.previousYear}
                onChange={(e) => setQuarterComparison(prev => ({
                  ...prev,
                  previousYear: parseInt(e.target.value)
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                {filterOptions?.years?.map((year: number) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Previous Quarter</label>
              <select
                value={quarterComparison.previousQuarter}
                onChange={(e) => setQuarterComparison(prev => ({
                  ...prev,
                  previousQuarter: e.target.value
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                {filterOptions?.quarters?.map((quarter: string) => (
                  <option key={quarter} value={quarter}>{quarter.toUpperCase()}</option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Year</label>
              <select
                value={yearComparison.currentYear}
                onChange={(e) => setYearComparison(prev => ({
                  ...prev,
                  currentYear: parseInt(e.target.value)
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                {filterOptions?.years?.map((year: number) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-center">
              <ArrowRight className="h-5 w-5 text-gray-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Previous Year</label>
              <select
                value={yearComparison.previousYear}
                onChange={(e) => setYearComparison(prev => ({
                  ...prev,
                  previousYear: parseInt(e.target.value)
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                {filterOptions?.years?.map((year: number) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading comparison data...</div>
        </div>
      )}

      {comparisonData && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="metric-card border-[#9e1f63]">
              <h3 className="text-sm text-gray-500 mb-2">Current Period</h3>
              <p className="text-2xl font-bold text-[#9e1f63]">
                {formatCurrency(comparisonType === 'quarter'
                  ? comparisonData.current?.total || 0
                  : comparisonData.currentTotal || 0
                )}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {comparisonType === 'quarter'
                  ? `${comparisonData.current?.year} ${comparisonData.current?.quarter?.toUpperCase()}`
                  : comparisonData.currentYear
                }
              </p>
            </div>

            <div className="metric-card border-[#424046]">
              <h3 className="text-sm text-gray-500 mb-2">Previous Period</h3>
              <p className="text-2xl font-bold text-[#424046]">
                {formatCurrency(comparisonType === 'quarter'
                  ? comparisonData.previous?.total || 0
                  : comparisonData.previousTotal || 0
                )}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {comparisonType === 'quarter'
                  ? `${comparisonData.previous?.year} ${comparisonData.previous?.quarter?.toUpperCase()}`
                  : comparisonData.previousYear
                }
              </p>
            </div>

            <div className={`metric-card ${comparisonData.change?.amount >= 0 ? 'border-red-500' : 'border-green-500'}`}>
              <h3 className="text-sm text-gray-500 mb-2">Change</h3>
              <div className="flex items-center">
                {comparisonData.change?.amount >= 0 ? (
                  <TrendingUp className="h-5 w-5 text-red-500 mr-2" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-green-500 mr-2" />
                )}
                <p className={`text-2xl font-bold ${comparisonData.change?.amount >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {formatCurrency(Math.abs(comparisonData.change?.amount || 0))}
                </p>
              </div>
              <p className={`text-sm mt-1 ${comparisonData.change?.amount >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                {comparisonData.change?.amount >= 0 ? '+' : '-'}
                {formatPercentage(Math.abs(comparisonData.change?.percentage || 0) / 100)}
              </p>
            </div>
          </div>

          {/* Comparison Chart */}
          <div className="chart-container">
            <h3 className="text-lg font-semibold mb-4">Comparison by Warehouse</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={comparisonData.details || comparisonData.byWarehouse}
                margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="current.value"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis tickFormatter={(value) => formatCurrency(value, true)} />
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                <Legend />
                <Bar dataKey="current.totalCost" name="Current" fill="#9e1f63" />
                <Bar dataKey="previous.totalCost" name="Previous" fill="#424046" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Detailed Table */}
          <div className="chart-container">
            <h3 className="text-lg font-semibold mb-4">Detailed Comparison</h3>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Warehouse</th>
                    <th className="text-right">Current</th>
                    <th className="text-right">Previous</th>
                    <th className="text-right">Change</th>
                    <th className="text-right">Change %</th>
                  </tr>
                </thead>
                <tbody>
                  {(comparisonData.details || comparisonData.byWarehouse)?.map((item: any, index: number) => (
                    <tr key={index}>
                      <td>{item.current?.value}</td>
                      <td className="text-right">{formatCurrency(item.current?.totalCost || 0)}</td>
                      <td className="text-right">{formatCurrency(item.previous?.totalCost || 0)}</td>
                      <td className={`text-right font-medium ${
                        item.change?.amount >= 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {item.change?.amount >= 0 ? '+' : ''}
                        {formatCurrency(item.change?.amount || 0)}
                      </td>
                      <td className={`text-right ${
                        item.change?.percentage >= 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {item.change?.percentage >= 0 ? '+' : ''}
                        {formatPercentage(item.change?.percentage / 100 || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}