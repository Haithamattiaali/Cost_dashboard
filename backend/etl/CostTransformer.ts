import { CostDataRow } from './ExcelProcessor';

export interface AggregatedCost {
  dimension: string;
  value: string;
  totalCost: number;
  warehouseCost: number;
  transportationCost: number;
  distributionCost: number;
  lastMileCost: number;
  pharmaciesCost: number;
  proceed3PLWHCost: number;
  proceed3PLTRSCost: number;
  opexAmount: number;
  capexAmount: number;
  constantCost: number;
  variableCost: number;
  rowCount: number;
}

export interface ComparisonData {
  current: AggregatedCost;
  previous?: AggregatedCost;
  change: {
    amount: number;
    percentage: number;
  };
}

export interface DashboardMetrics {
  totalCost: number;
  totalOpex: number;
  totalCapex: number;
  dmascoTotal: number;
  proceed3PLTotal: number;
  costByQuarter: AggregatedCost[];
  costByWarehouse: AggregatedCost[];
  costByCategory: AggregatedCost[];
  costByType: AggregatedCost[];
  costByGLAccount: AggregatedCost[];
  topExpenses: CostDataRow[];
}

export class CostTransformer {
  private data: CostDataRow[] = [];

  constructor(data: CostDataRow[]) {
    this.data = data;
  }

  // Aggregate costs by any dimension
  aggregateByDimension(dimension: keyof CostDataRow): AggregatedCost[] {
    const aggregated = new Map<string, AggregatedCost>();

    for (const row of this.data) {
      const key = String(row[dimension]);

      if (!aggregated.has(key)) {
        aggregated.set(key, {
          dimension: dimension as string,
          value: key,
          totalCost: 0,
          warehouseCost: 0,
          transportationCost: 0,
          distributionCost: 0,
          lastMileCost: 0,
          pharmaciesCost: 0,
          proceed3PLWHCost: 0,
          proceed3PLTRSCost: 0,
          opexAmount: 0,
          capexAmount: 0,
          constantCost: 0,
          variableCost: 0,
          rowCount: 0,
        });
      }

      const agg = aggregated.get(key)!;
      agg.totalCost += row.totalIncurredCost;
      agg.warehouseCost += row.valueWH;
      agg.transportationCost += row.valueTRS;
      agg.distributionCost += row.valueDistribution;
      agg.lastMileCost += row.valueLastMile;
      agg.pharmaciesCost += row.totalPharmacyDistLM; // This is the PHs (Pharmacies) cost value
      agg.proceed3PLWHCost += row.valueProceed3PLWH;
      agg.proceed3PLTRSCost += row.valueProceed3PLTRS;

      // Case-insensitive comparison for OPEX/CAPEX
      const opexCapexUpper = row.opexCapex?.toUpperCase();
      if (opexCapexUpper === 'OPEX') {
        agg.opexAmount += row.totalIncurredCost;
      } else if (opexCapexUpper === 'CAPEX') {
        agg.capexAmount += row.totalIncurredCost;
      }

      if (row.costType === 'Constant') {
        agg.constantCost += row.totalIncurredCost;
      } else if (row.costType === 'Variable') {
        agg.variableCost += row.totalIncurredCost;
      }

      agg.rowCount++;
    }

    return Array.from(aggregated.values()).sort((a, b) => b.totalCost - a.totalCost);
  }

  // Aggregate by quarter with proper ordering
  aggregateByQuarter(): AggregatedCost[] {
    const quarterOrder = { 'q1': 1, 'q2': 2, 'q3': 3, 'q4': 4 };
    const aggregated = this.aggregateByDimension('quarter');

    return aggregated.sort((a, b) => {
      const orderA = quarterOrder[a.value.toLowerCase() as keyof typeof quarterOrder] || 999;
      const orderB = quarterOrder[b.value.toLowerCase() as keyof typeof quarterOrder] || 999;
      return orderA - orderB;
    });
  }

  // Get metrics for dashboard
  getDashboardMetrics(): DashboardMetrics {
    const totalCost = this.data.reduce((sum, row) => sum + row.totalIncurredCost, 0);
    // Case-insensitive filtering for OPEX/CAPEX
    const totalOpex = this.data
      .filter(row => row.opexCapex?.toUpperCase() === 'OPEX')
      .reduce((sum, row) => sum + row.totalIncurredCost, 0);
    const totalCapex = this.data
      .filter(row => row.opexCapex?.toUpperCase() === 'CAPEX')
      .reduce((sum, row) => sum + row.totalIncurredCost, 0);

    // Damasco Total = Pharmacies + Distribution + Last Mile
    const dmascoTotal = this.data.reduce(
      (sum, row) => sum + row.totalPharmacyDistLM + row.valueDistribution + row.valueLastMile,
      0
    );

    const proceed3PLTotal = this.data.reduce(
      (sum, row) => sum + row.valueProceed3PLWH + row.valueProceed3PLTRS,
      0
    );

    const topExpenses = [...this.data]
      .sort((a, b) => b.totalIncurredCost - a.totalIncurredCost);

    // Aggregate by GL Account
    const costByGLAccount = this.aggregateByDimension('glAccountName');

    return {
      totalCost,
      totalOpex,
      totalCapex,
      dmascoTotal,
      proceed3PLTotal,
      costByQuarter: this.aggregateByQuarter(),
      costByWarehouse: this.aggregateByDimension('warehouse').slice(0, 10),
      costByCategory: this.aggregateByDimension('tcoModelCategories').slice(0, 10),
      costByType: this.aggregateByDimension('costType'),
      costByGLAccount,
      topExpenses: topExpenses, // Return ALL expense data for the detailed table
    };
  }

  // Compare two periods
  comparePeriods(
    currentFilter: (row: CostDataRow) => boolean,
    previousFilter: (row: CostDataRow) => boolean
  ): ComparisonData[] {
    const currentData = this.data.filter(currentFilter);
    const previousData = this.data.filter(previousFilter);

    const currentTransformer = new CostTransformer(currentData);
    const previousTransformer = new CostTransformer(previousData);

    const currentByWarehouse = currentTransformer.aggregateByDimension('warehouse');
    const previousByWarehouse = previousTransformer.aggregateByDimension('warehouse');

    const previousMap = new Map(previousByWarehouse.map(item => [item.value, item]));

    const comparisons: ComparisonData[] = [];

    for (const current of currentByWarehouse) {
      const previous = previousMap.get(current.value);
      const change = previous
        ? {
            amount: current.totalCost - previous.totalCost,
            percentage: previous.totalCost > 0
              ? ((current.totalCost - previous.totalCost) / previous.totalCost) * 100
              : 0,
          }
        : {
            amount: current.totalCost,
            percentage: 100,
          };

      comparisons.push({
        current,
        previous,
        change,
      });
    }

    return comparisons.sort((a, b) => Math.abs(b.change.amount) - Math.abs(a.change.amount));
  }

  // Filter data
  filterData(filters: {
    year?: number;
    quarter?: string;
    warehouse?: string;
    type?: string;
    costType?: string;
    opexCapex?: string;
  }): CostDataRow[] {
    return this.data.filter(row => {
      if (filters.year && row.year !== filters.year) return false;
      if (filters.quarter && row.quarter !== filters.quarter) return false;
      if (filters.warehouse && row.warehouse !== filters.warehouse) return false;
      if (filters.type && row.type !== filters.type) return false;
      if (filters.costType && row.costType !== filters.costType) return false;
      if (filters.opexCapex && row.opexCapex !== filters.opexCapex) return false;
      return true;
    });
  }

  // Get unique values for filters
  getFilterOptions() {
    // Helper to filter out empty, null, or undefined values
    const getUniqueValues = (field: keyof CostDataRow): any[] => {
      return [...new Set(this.data.map(d => d[field]))]
        .filter(value => value !== '' && value !== null && value !== undefined)
        .sort();
    };

    return {
      years: [...new Set(this.data.map(d => d.year))].filter(Boolean).sort(),
      quarters: getUniqueValues('quarter'),
      warehouses: getUniqueValues('warehouse'),
      types: getUniqueValues('type'),
      costTypes: getUniqueValues('costType'),
      opexCapex: getUniqueValues('opexCapex'),
      categories: getUniqueValues('tcoModelCategories'),
    };
  }
}