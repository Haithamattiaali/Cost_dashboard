import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Treemap
} from 'recharts';
import { fetchAggregatedData } from '../api/costs';
import { formatCurrency, formatPercentage } from '../utils/formatting';

const COLORS = ['#9e1f63', '#424046', '#e05e3d', '#005b8c', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Analysis() {
  const [dimension, setDimension] = useState('tcoModelCategories');

  const { data: aggregatedData, isLoading } = useQuery({
    queryKey: ['aggregated-data', dimension],
    queryFn: () => fetchAggregatedData(dimension),
  });

  const dimensions = [
    { value: 'tcoModelCategories', label: 'TCO Categories' },
    { value: 'warehouse', label: 'Warehouse' },
    { value: 'type', label: 'Type' },
    { value: 'costType', label: 'Cost Type' },
    { value: 'opexCapex', label: 'OPEX/CAPEX' },
    { value: 'quarter', label: 'Quarter' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading analysis data...</div>
      </div>
    );
  }

  const data = aggregatedData?.data || [];
  const totalCost = data.reduce((sum: number, item: any) => sum + item.totalCost, 0);

  // Prepare data for different visualizations
  const pieData = data.slice(0, 8).map((item: any) => ({
    name: item.value,
    value: item.totalCost,
    percentage: (item.totalCost / totalCost) * 100,
  }));

  const treemapData = data.slice(0, 15).map((item: any) => ({
    name: item.value,
    size: item.totalCost,
    percentage: (item.totalCost / totalCost) * 100,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Cost Analysis</h1>
        <p className="text-gray-500 mt-1">Deep dive into cost distribution and patterns</p>
      </div>

      {/* Dimension Selector */}
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Analyze by:
        </label>
        <div className="flex flex-wrap gap-2">
          {dimensions.map((dim) => (
            <button
              key={dim.value}
              onClick={() => setDimension(dim.value)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                dimension === dim.value
                  ? 'bg-[#9e1f63] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {dim.label}
            </button>
          ))}
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="chart-container">
          <h3 className="text-lg font-semibold mb-4">Top 10 by {dimension}</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data.slice(0, 10)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tickFormatter={(value) => formatCurrency(value, true)} />
              <YAxis dataKey="value" type="category" width={120} />
              <Tooltip formatter={(value) => formatCurrency(value as number)} />
              <Bar dataKey="totalCost" fill="#9e1f63" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="chart-container">
          <h3 className="text-lg font-semibold mb-4">Distribution</h3>
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name}: ${formatPercentage(percentage / 100)}`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(value as number)} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Cost Breakdown */}
        <div className="chart-container">
          <h3 className="text-lg font-semibold mb-4">Cost Components</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data.slice(0, 8)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="value" angle={-45} textAnchor="end" height={100} />
              <YAxis tickFormatter={(value) => formatCurrency(value, true)} />
              <Tooltip formatter={(value) => formatCurrency(value as number)} />
              <Legend />
              <Bar dataKey="warehouseCost" stackId="a" fill="#9e1f63" name="Warehouse" />
              <Bar dataKey="transportationCost" stackId="a" fill="#424046" name="Transportation" />
              <Bar dataKey="distributionCost" stackId="a" fill="#e05e3d" name="Distribution" />
              <Bar dataKey="lastMileCost" stackId="a" fill="#005b8c" name="Last Mile" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* OPEX vs CAPEX */}
        <div className="chart-container">
          <h3 className="text-lg font-semibold mb-4">OPEX vs CAPEX</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data.slice(0, 8)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="value" angle={-45} textAnchor="end" height={100} />
              <YAxis tickFormatter={(value) => formatCurrency(value, true)} />
              <Tooltip formatter={(value) => formatCurrency(value as number)} />
              <Legend />
              <Bar dataKey="opexAmount" fill="#005b8c" name="OPEX" />
              <Bar dataKey="capexAmount" fill="#e05e3d" name="CAPEX" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="chart-container">
        <h3 className="text-lg font-semibold mb-4">Detailed Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>{dimension.replace(/([A-Z])/g, ' $1').trim()}</th>
                <th className="text-right">Total Cost</th>
                <th className="text-right">OPEX</th>
                <th className="text-right">CAPEX</th>
                <th className="text-right">Constant</th>
                <th className="text-right">Variable</th>
                <th className="text-right">% of Total</th>
                <th className="text-right">Items</th>
              </tr>
            </thead>
            <tbody>
              {data.slice(0, 20).map((item: any, index: number) => (
                <tr key={index}>
                  <td className="font-medium">{item.value}</td>
                  <td className="text-right">{formatCurrency(item.totalCost)}</td>
                  <td className="text-right">{formatCurrency(item.opexAmount)}</td>
                  <td className="text-right">{formatCurrency(item.capexAmount)}</td>
                  <td className="text-right">{formatCurrency(item.constantCost)}</td>
                  <td className="text-right">{formatCurrency(item.variableCost)}</td>
                  <td className="text-right">
                    <span className="text-[#9e1f63] font-medium">
                      {formatPercentage(item.totalCost / totalCost)}
                    </span>
                  </td>
                  <td className="text-right">{item.rowCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}