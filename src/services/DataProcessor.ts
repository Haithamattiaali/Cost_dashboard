/**
 * Data processing engine for Excel parsing and calculations
 * Handles all data transformations and metrics calculations in the browser
 */

import * as XLSX from 'xlsx';
import { CostDataRow, FilterOptions } from './BrowserDatabase';

export interface DashboardMetrics {
  totalCost: number;
  totalOpex: number;
  totalCapex: number;
  dmscoTotal: number;
  proceed3PLTotal: number;
  costByQuarter: Array<any>;
  costByWarehouse: Array<{ warehouse: string; cost: number }>;
  costByCategory: Array<{ category: string; cost: number }>;
  costByType: Array<{ type: string; cost: number }>;
  costByGLAccount: Array<{ value: string; totalCost: number }>;
  topExpenses: any[];
}

export interface ComparisonMetrics {
  current: DashboardMetrics;
  previous: DashboardMetrics;
  deltas: {
    totalCost: { value: number; percentage: number };
    totalOpex: { value: number; percentage: number };
    totalCapex: { value: number; percentage: number };
    dmscoTotal: { value: number; percentage: number };
    proceed3PLTotal: { value: number; percentage: number };
  };
}

class DataProcessor {
  /**
   * Parse Excel file and extract cost data
   */
  async parseExcel(file: File): Promise<CostDataRow[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });

          // Get the first sheet
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];

          // Convert to JSON with raw values to preserve numeric types
          // raw: true keeps numbers as numbers instead of converting to strings
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: true, defval: '' });

          // Transform and validate data
          const costData = this.transformExcelData(jsonData);
          resolve(costData);
        } catch (error) {
          reject(new Error(`Failed to parse Excel file: ${error.message}`));
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsBinaryString(file);
    });
  }

  /**
   * Transform raw Excel data to our CostDataRow format
   */
  private transformExcelData(rawData: any[]): CostDataRow[] {
    console.log('[DataProcessor] Raw data sample:', rawData[0]);
    console.log('[DataProcessor] Total rows to transform:', rawData.length);

    // Log all column names to debug
    if (rawData.length > 0) {
      console.log('[DataProcessor] Available columns:', Object.keys(rawData[0]));
      // Also log trimmed versions to catch space issues
      console.log('[DataProcessor] Trimmed columns:', Object.keys(rawData[0]).map(k => k.trim()));

      // Specifically debug the Year column value
      const firstRow = rawData[0];
      console.log('[DataProcessor] Year column debug:');
      console.log('  - row["Year"]:', firstRow['Year'], 'type:', typeof firstRow['Year']);
      console.log('  - row["year"]:', firstRow['year'], 'type:', typeof firstRow['year']);
      console.log('  - row["YEAR"]:', firstRow['YEAR'], 'type:', typeof firstRow['YEAR']);

      // Check all possible year-like columns
      Object.keys(firstRow).forEach(key => {
        if (key.toLowerCase().includes('year')) {
          console.log(`  - row["${key}"]:`, firstRow[key], 'type:', typeof firstRow[key]);
        }
      });
    }

    const transformedData = rawData.map((row, index) => {
      // Handle various column name variations with case-insensitive matching
      const getColumnValue = (possibleNames: string[], defaultValue: any = '') => {
        // First try exact matches
        for (const name of possibleNames) {
          if (row[name] !== undefined && row[name] !== null) {
            return row[name];
          }
        }

        // Then try case-insensitive and trimmed matches
        const rowKeys = Object.keys(row);
        for (const name of possibleNames) {
          const found = rowKeys.find(key =>
            key.toLowerCase().trim() === name.toLowerCase().trim()
          );
          if (found && row[found] !== undefined && row[found] !== null) {
            return row[found];
          }
        }

        // Finally try partial matches for key terms
        for (const name of possibleNames) {
          const keywords = name.toLowerCase().replace(/[^a-z0-9]/g, ' ').split(' ').filter(w => w.length > 2);
          const found = rowKeys.find(key => {
            const keyLower = key.toLowerCase();
            return keywords.every(keyword => keyLower.includes(keyword));
          });
          if (found && row[found] !== undefined && row[found] !== null) {
            return row[found];
          }
        }

        return defaultValue;
      };

      const parseNumber = (value: any): number => {
        if (typeof value === 'number') return value;
        if (typeof value === 'string') {
          // Remove commas, spaces, and currency symbols
          const cleaned = value.trim().replace(/,/g, '').replace(/[^\d.-]/g, '');
          const parsed = parseFloat(cleaned);
          return isNaN(parsed) ? 0 : parsed;
        }
        return 0;
      };

      const parsePercentage = (value: any): number => {
        if (typeof value === 'number') return value;
        if (typeof value === 'string') {
          // Remove % sign, spaces, and parse
          const cleaned = value.trim().replace(/%/g, '').replace(/,/g, '');
          const parsed = parseFloat(cleaned);
          return isNaN(parsed) ? 0 : parsed;
        }
        return 0;
      };

      // Parse the row data - matching actual Excel columns from data.xlsx
      const yearValue = getColumnValue(['year', 'Year', 'YEAR'], '');

      // More robust year parsing to handle various formats
      let parsedYear = 0;
      if (yearValue !== undefined && yearValue !== null && yearValue !== '') {
        // Check if it's already a number
        if (typeof yearValue === 'number') {
          parsedYear = Math.floor(yearValue);
        } else {
          // Convert to string and clean up
          const yearStr = String(yearValue).trim();

          // Handle formatted numbers like " 2,025.00 " (from XLSX with raw: false)
          if (yearStr.includes(',') || yearStr.includes('.')) {
            // Remove thousands separators and decimal parts
            const cleanedStr = yearStr.replace(/,/g, '').replace(/\.\d+$/, '').trim();
            parsedYear = parseInt(cleanedStr);
          } else if (yearStr.match(/^\d{4}$/)) {
            // Standard 4-digit year
            parsedYear = parseInt(yearStr);
          } else if (yearStr.match(/^\d{2}$/)) {
            // 2-digit year - assume 2000s
            const twoDigit = parseInt(yearStr);
            parsedYear = twoDigit < 50 ? 2000 + twoDigit : 1900 + twoDigit;
          } else {
            // Try to extract 4 digits from the string
            const yearMatch = yearStr.match(/(\d{4})/);
            if (yearMatch) {
              parsedYear = parseInt(yearMatch[1]);
            } else {
              // Last resort - just try parsing
              parsedYear = parseInt(yearStr);
            }
          }
        }

        // Validate the parsed year
        if (parsedYear < 1900 || parsedYear > 2100 || isNaN(parsedYear)) {
          console.warn(`[DataProcessor] Row ${index + 1}: Invalid year value "${yearValue}" parsed as ${parsedYear}, raw type: ${typeof yearValue}`);
          parsedYear = 0;
        } else {
          // Log successful parsing for first few rows
          if (index < 3) {
            console.log(`[DataProcessor] Row ${index + 1}: Successfully parsed year "${yearValue}" (type: ${typeof yearValue}) as ${parsedYear}`);
          }
        }
      }

      // Skip row if year is invalid or 0
      if (!parsedYear) {
        console.warn(`[DataProcessor] Skipping row ${index + 1}: Could not parse valid year from "${yearValue}"`);
        return null; // This will be filtered out later
      }

      // Debug and validate quarter value
      const quarterRawValue = getColumnValue(['quarter', 'Quarter', 'QUARTER', 'Qtr'], 'Q1');
      let quarterValue = String(quarterRawValue).toUpperCase().replace(/\s+/g, '');

      // Validate quarter format - should be Q1, Q2, Q3, or Q4
      if (!quarterValue.match(/^Q[1-4]$/)) {
        // Try to extract quarter number if it's in a different format
        const qMatch = quarterValue.match(/Q?([1-4])/);
        if (qMatch) {
          quarterValue = `Q${qMatch[1]}`;
        } else {
          console.warn(`[DataProcessor] Invalid quarter value "${quarterRawValue}" in row ${index + 1}, defaulting to Q1`);
          quarterValue = 'Q1';
        }
      }

      console.log('[DataProcessor] Quarter processed:', quarterValue, 'from raw:', quarterRawValue, 'Year:', parsedYear);

      const parsedRow = {
        year: parsedYear,
        quarter: quarterValue,
        warehouse: getColumnValue(['Warehouse ', 'Warehouse', 'warehouse', 'WAREHOUSE', 'WH', 'DC'], '').toString().trim(),
        type: getColumnValue(['Type', 'type', 'TYPE'], ''),
        glAccountNo: getColumnValue(['GL Account No.', 'GL Account No', 'GL No', 'GL Account Number', 'GL Account'], ''),
        glAccountName: getColumnValue(['GL Account Name', 'Account Name', 'GL Name'], ''),
        glAccountsGroup: getColumnValue(['GL Accounts Group', 'GL Group', 'Account Group'], ''),
        costType: getColumnValue(['Cost Type', 'cost type', 'COST TYPE'], ''),
        tcoModelCategories: getColumnValue(['TCO Model Categories', 'TCO Categories', 'TCO Model', 'Category'], ''),
        opexCapex: String(getColumnValue(['OpEx /CapEx', 'Opex/Capex', 'OPEX/CAPEX', 'OpEx/CapEx', 'OpEx / CapEx'], '')).toLowerCase(),
        totalIncurredCostGlAccountValue: parseNumber(
          getColumnValue(['total incured cost', 'Total Incurred Cost (GL account value)', 'Total Incurred Cost', 'Total Cost', 'Cost'], 0)
        ),
        // Map the COST SHARE columns (percentages)
        shareDmsco: parsePercentage(getColumnValue(['WH COST SHARE ', 'WH COST SHARE', 'Share Dmsco (%)', 'Share Dmsco'], 0)),
        shareProceed3PL: parsePercentage(getColumnValue(['Proceed 3PL (WH) COST SHARE ', 'Proceed 3PL (TRS) COST SHARE ', 'Proceed 3PL COST SHARE', 'Share PROCEED 3PL (%)', 'Share PROCEED 3PL'], 0)),
        shareAlFaris: parsePercentage(getColumnValue(['Dist. COST SHARE ', 'Dist COST SHARE', 'Distribution COST SHARE', 'Share AlFaris (%)', 'Share AlFaris'], 0)),
        shareJaleel: parsePercentage(getColumnValue(['Last Mile (TRS) COST SHARE ', 'Last Mile COST SHARE', 'Share Jaleel (%)', 'Share Jaleel'], 0)),
        shareOthers: parsePercentage(getColumnValue(['TRS COST SHARE ', 'TRS COST SHARE', 'Transportation COST SHARE', 'Share Others (%)', 'Share Others'], 0)),
        // Map the COST VALUE columns (actual amounts)
        valueDmsco: parseNumber(getColumnValue(['WH COST VALUE', 'WH COST VALUE ', 'Warehouse COST VALUE', 'Value Dmsco'], 0)),
        valueProceed3PL: parseNumber(getColumnValue(['PROCEED 3pl COST VALUE ', 'PROCEED 3PL COST VALUE', 'Proceed 3PL (WH) COST VALUE', 'Proceed 3PL (TRS) COST VALUE', 'Value PROCEED 3PL'], 0)),
        valueAlFaris: parseNumber(getColumnValue(['Dist. COST VALUE ', 'Dist COST VALUE', 'Distribution COST VALUE', 'Value AlFaris'], 0)),
        valueJaleel: parseNumber(getColumnValue(['Last Mile COST VALUE ', 'Last Mile COST VALUE', 'Last Mile (TRS) COST VALUE', 'Value Jaleel'], 0)),
        valueOthers: parseNumber(getColumnValue(['TRS COST VALUE ', 'TRS COST VALUE', 'Transportation COST VALUE', 'Value Others'], 0)),
        // Department-specific costs - map from COST VALUE columns
        pharmaciesCost: parseNumber(getColumnValue(['PHs COST VALUE ', 'PHs COST VALUE', 'Pharmacies COST VALUE', 'PHs Cost'], 0)),
        distributionCost: parseNumber(getColumnValue(['Dist. COST VALUE ', 'Dist COST VALUE', 'Distribution COST VALUE', 'Distribution Cost'], 0)),
        lastMileCost: parseNumber(getColumnValue(['Last Mile COST VALUE ', 'Last Mile COST VALUE', 'Last Mile (TRS) COST VALUE', 'Last Mile Cost'], 0)),
        proceed3PLWHCost: parseNumber(getColumnValue(['Proceed 3PL (WH) COST VALUE ', 'Proceed 3PL (WH) COST VALUE', 'Proceed 3PL WH COST VALUE'], 0)),
        proceed3PLTRSCost: parseNumber(getColumnValue(['Proceed 3PL (TRS) COST VALUE ', 'Proceed 3PL (TRS) COST VALUE', 'Proceed 3PL TRS COST VALUE'], 0)),
        warehouseCost: parseNumber(getColumnValue(['WH COST VALUE', 'WH COST VALUE ', 'Warehouse COST VALUE'], 0)),
        transportationCost: parseNumber(getColumnValue(['TRS COST VALUE ', 'TRS COST VALUE', 'Transportation COST VALUE'], 0)),
      };

      // Log first few rows for debugging
      if (index < 3) {
        console.log(`[DataProcessor] Transformed row ${index + 1}:`, {
          year: parsedRow.year,
          quarter: parsedRow.quarter,
          totalCost: parsedRow.totalIncurredCostGlAccountValue,
          pharmacies: parsedRow.pharmaciesCost,
          distribution: parsedRow.distributionCost,
          lastMile: parsedRow.lastMileCost,
          warehouse: parsedRow.warehouseCost
        });
      }

      return parsedRow;
    }).filter(row => row !== null); // Filter out any rows that failed to parse

    // Log unique years for debugging
    const uniqueYears = [...new Set(transformedData.map(row => row.year))];
    console.log('[DataProcessor] Unique years in transformed data:', uniqueYears);
    console.log('[DataProcessor] Final row count after filtering:', transformedData.length);

    return transformedData;
  }

  /**
   * Calculate dashboard metrics from cost data
   */
  calculateMetrics(data: CostDataRow[]): DashboardMetrics {
    console.log('[DataProcessor] Calculating metrics for', data.length, 'rows');

    // Return empty metrics if no data
    if (!data || data.length === 0) {
      console.log('[DataProcessor] No data to calculate metrics from');
      return {
        totalCost: 0,
        totalOpex: 0,
        totalCapex: 0,
        dmscoTotal: 0,
        proceed3PLTotal: 0,
        costByQuarter: [],
        costByWarehouse: [],
        costByCategory: [],
        costByType: [],
        costByGLAccount: [],
        topExpenses: []
      };
    }

    // Total calculations
    const totalCost = data.reduce((sum, row) => sum + (row.totalIncurredCostGlAccountValue || 0), 0);
    const totalOpex = data
      .filter(row => row.opexCapex?.toLowerCase() === 'opex')
      .reduce((sum, row) => sum + (row.totalIncurredCostGlAccountValue || 0), 0);
    const totalCapex = data
      .filter(row => row.opexCapex?.toLowerCase() === 'capex')
      .reduce((sum, row) => sum + (row.totalIncurredCostGlAccountValue || 0), 0);

    // Division totals
    // DMSCO Operations = Pharmacies + Distribution + Last Mile
    const dmscoTotal = data.reduce((sum, row) => {
      const pharmacies = row.pharmaciesCost || 0;
      const distribution = row.distributionCost || 0;
      const lastMile = row.lastMileCost || 0;
      return sum + pharmacies + distribution + lastMile;
    }, 0);

    // PROCEED 3PL = Sum of PROCEED 3PL values (already includes both WH and TRS)
    const proceed3PLTotal = data.reduce((sum, row) => sum + (row.valueProceed3PL || 0), 0);

    // Cost by quarter with department breakdown - matching Dashboard expectations
    const quarterMap = new Map<string, any>();

    data.forEach(row => {
      const key = `${row.year} ${row.quarter}`;
      if (!quarterMap.has(key)) {
        quarterMap.set(key, {
          totalCost: 0,
          pharmaciesCost: 0,
          distributionCost: 0,
          lastMileCost: 0,
          proceed3PLWHCost: 0,
          proceed3PLTRSCost: 0,
          warehouseCost: 0,
          transportationCost: 0
        });
      }

      const quarterData = quarterMap.get(key);

      // Add to total
      quarterData.totalCost += row.totalIncurredCostGlAccountValue || 0;

      // Use the directly mapped department costs if available
      if (row.pharmaciesCost !== undefined) {
        quarterData.pharmaciesCost += row.pharmaciesCost;
      } else {
        // Fallback to PHs COST VALUE
        quarterData.pharmaciesCost += row.valueOthers || 0;
      }

      if (row.distributionCost !== undefined) {
        quarterData.distributionCost += row.distributionCost;
      } else {
        // Fallback to Dist. COST VALUE
        quarterData.distributionCost += row.valueAlFaris || 0;
      }

      if (row.lastMileCost !== undefined) {
        quarterData.lastMileCost += row.lastMileCost;
      } else {
        // Fallback to Last Mile COST VALUE
        quarterData.lastMileCost += row.valueJaleel || 0;
      }

      if (row.proceed3PLWHCost !== undefined) {
        quarterData.proceed3PLWHCost += row.proceed3PLWHCost;
      } else {
        // Split proceed3PL value if specific WH cost not available
        quarterData.proceed3PLWHCost += (row.valueProceed3PL || 0) * 0.5;
      }

      if (row.proceed3PLTRSCost !== undefined) {
        quarterData.proceed3PLTRSCost += row.proceed3PLTRSCost;
      } else {
        // Split proceed3PL value if specific TRS cost not available
        quarterData.proceed3PLTRSCost += (row.valueProceed3PL || 0) * 0.5;
      }

      if (row.warehouseCost !== undefined) {
        quarterData.warehouseCost += row.warehouseCost;
      } else {
        // Fallback to WH COST VALUE
        quarterData.warehouseCost += row.valueDmsco || 0;
      }

      if (row.transportationCost !== undefined) {
        quarterData.transportationCost += row.transportationCost;
      } else {
        // Fallback to TRS COST VALUE
        quarterData.transportationCost += row.valueOthers || 0;
      }
    });

    const costByQuarter = Array.from(quarterMap.entries())
      .map(([quarter, costs]) => ({
        quarter,
        cost: costs.totalCost,
        // Dashboard expects these properties
        value: quarter.split(' ')[1], // Extract just the quarter part (Q1, Q2, etc.)
        totalCost: costs.totalCost,
        // Department costs
        pharmaciesCost: costs.pharmaciesCost,
        distributionCost: costs.distributionCost,
        lastMileCost: costs.lastMileCost,
        proceed3PLWHCost: costs.proceed3PLWHCost,
        proceed3PLTRSCost: costs.proceed3PLTRSCost,
        warehouseCost: costs.warehouseCost,
        transportationCost: costs.transportationCost
      }))
      .sort((a, b) => a.quarter.localeCompare(b.quarter));

    // Cost by warehouse
    const warehouseMap = new Map<string, number>();
    data.forEach(row => {
      if (row.warehouse) {
        warehouseMap.set(row.warehouse, (warehouseMap.get(row.warehouse) || 0) + (row.totalIncurredCostGlAccountValue || 0));
      }
    });
    const costByWarehouse = Array.from(warehouseMap.entries())
      .map(([warehouse, cost]) => ({ warehouse, cost }))
      .sort((a, b) => b.cost - a.cost);

    // Cost by category
    const categoryMap = new Map<string, number>();
    data.forEach(row => {
      if (row.tcoModelCategories) {
        categoryMap.set(row.tcoModelCategories, (categoryMap.get(row.tcoModelCategories) || 0) + (row.totalIncurredCostGlAccountValue || 0));
      }
    });
    const costByCategory = Array.from(categoryMap.entries())
      .map(([category, cost]) => ({ category, cost }))
      .sort((a, b) => b.cost - a.cost);

    // Cost by type
    const typeMap = new Map<string, number>();
    data.forEach(row => {
      if (row.type) {
        typeMap.set(row.type, (typeMap.get(row.type) || 0) + (row.totalIncurredCostGlAccountValue || 0));
      }
    });
    const costByType = Array.from(typeMap.entries())
      .map(([type, cost]) => ({ type, cost }))
      .sort((a, b) => b.cost - a.cost);

    // Cost by GL Account - format expected by Dashboard
    const glMap = new Map<string, number>();
    data.forEach(row => {
      const glKey = row.glAccountName || row.glAccountNo || 'Unknown';
      glMap.set(glKey, (glMap.get(glKey) || 0) + (row.totalIncurredCostGlAccountValue || 0));
    });
    const costByGLAccount = Array.from(glMap.entries())
      .map(([value, totalCost]) => ({ value, totalCost }))
      .sort((a, b) => b.totalCost - a.totalCost);

    // Top expenses - return raw data rows for the data grid
    // Sort by totalIncurredCostGlAccountValue and take top 100 rows
    const topExpenses = data
      .filter(row => row.totalIncurredCostGlAccountValue > 0)
      .sort((a, b) => (b.totalIncurredCostGlAccountValue || 0) - (a.totalIncurredCostGlAccountValue || 0))
      .slice(0, 100)
      .map(row => ({
        ...row,
        // Add renamed properties expected by the Dashboard
        totalIncurredCost: row.totalIncurredCostGlAccountValue,
        // Make sure quarter is uppercase for display
        quarter: row.quarter?.toUpperCase() || row.quarter
      }));

    const metrics = {
      totalCost,
      totalOpex,
      totalCapex,
      dmscoTotal,
      proceed3PLTotal,
      costByQuarter,
      costByWarehouse,
      costByCategory,
      costByType,
      costByGLAccount,
      topExpenses
    };

    // Log the breakdown for debugging
    const pharmaciesTotal = data.reduce((sum, row) => sum + (row.pharmaciesCost || 0), 0);
    const distributionTotal = data.reduce((sum, row) => sum + (row.distributionCost || 0), 0);
    const lastMileTotal = data.reduce((sum, row) => sum + (row.lastMileCost || 0), 0);

    console.log('[DataProcessor] Division Totals Breakdown:', {
      pharmaciesTotal,
      distributionTotal,
      lastMileTotal,
      dmscoTotal: dmscoTotal + ' (Ph+Dist+LM)',
      proceed3PLTotal
    });

    console.log('[DataProcessor] Calculated metrics:', {
      totalCost,
      totalOpex,
      totalCapex,
      dmscoTotal,
      proceed3PLTotal,
      quarterCount: costByQuarter.length,
      warehouseCount: costByWarehouse.length,
      categoryCount: costByCategory.length,
      typeCount: costByType.length,
      glAccountCount: costByGLAccount.length,
      firstQuarter: costByQuarter[0],
      topExpenseCount: topExpenses.length,
      hasData: data.length > 0
    });

    return metrics;
  }

  /**
   * Filter data based on filter options
   */
  filterData(data: CostDataRow[], filters: FilterOptions): CostDataRow[] {
    return data.filter(row => {
      if (filters.year && row.year !== filters.year) return false;

      // Case-insensitive quarter comparison to handle Q1 vs q1 mismatches
      if (filters.quarter) {
        const filterQuarter = String(filters.quarter).toUpperCase().trim();
        const rowQuarter = String(row.quarter).toUpperCase().trim();
        if (filterQuarter !== rowQuarter) return false;
      }

      if (filters.warehouse && row.warehouse !== filters.warehouse) return false;
      if (filters.type && row.type !== filters.type) return false;
      if (filters.costType && row.costType !== filters.costType) return false;
      if (filters.opexCapex && row.opexCapex !== filters.opexCapex) return false;
      if (filters.category && row.tcoModelCategories !== filters.category) return false;
      if (filters.glAccountNo && row.glAccountNo !== filters.glAccountNo) return false;
      if (filters.glAccountName && !row.glAccountName.toLowerCase().includes(filters.glAccountName.toLowerCase())) return false;

      return true;
    });
  }

  /**
   * Compare metrics between two quarters
   */
  compareQuarters(q1Data: CostDataRow[], q2Data: CostDataRow[]): ComparisonMetrics {
    const current = this.calculateMetrics(q1Data);
    const previous = this.calculateMetrics(q2Data);

    const calculateDelta = (current: number, previous: number) => {
      const value = current - previous;
      const percentage = previous > 0 ? (value / previous) * 100 : 0;
      return { value, percentage };
    };

    return {
      current,
      previous,
      deltas: {
        totalCost: calculateDelta(current.totalCost, previous.totalCost),
        totalOpex: calculateDelta(current.totalOpex, previous.totalOpex),
        totalCapex: calculateDelta(current.totalCapex, previous.totalCapex),
        dmscoTotal: calculateDelta(current.dmscoTotal, previous.dmscoTotal),
        proceed3PLTotal: calculateDelta(current.proceed3PLTotal, previous.proceed3PLTotal),
      }
    };
  }

  /**
   * Export data to Excel format
   */
  exportToExcel(data: CostDataRow[], filename: string = 'cost-data-export.xlsx'): void {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Cost Data');
    XLSX.writeFile(workbook, filename);
  }

  /**
   * Export data to CSV format
   */
  exportToCSV(data: CostDataRow[], filename: string = 'cost-data-export.csv'): void {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(worksheet);

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}

// Export singleton instance
export const dataProcessor = new DataProcessor();