import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

export interface CostDataRow {
  year: number;
  quarter: string;
  warehouse: string;
  type: string;
  glAccountNo: string;
  glAccountName: string;
  glAccountsGroup: string;
  costType: string;
  tcoModelCategories: string;
  mainCategories: string;
  opexCapex: string;
  totalIncurredCost: number;
  shareWH: number;
  shareTRS: number;
  shareDistribution: number;
  shareLastMile: number;
  shareProceed3PLWH: number;
  shareProceed3PLTRS: number;
  valueWH: number;
  valueTRS: number;
  valueDistribution: number;
  valueLastMile: number;
  valueProceed3PLWH: number;
  valueProceed3PLTRS: number;
  totalPharmacyDistLM: number;
  totalProceed3PL: number;
  currentExpectedCost: number;
  totalDistributionCost: number;
}

export class ExcelProcessor {
  private workbook: XLSX.WorkBook | null = null;
  private data: CostDataRow[] = [];

  async loadFile(filePath: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!fs.existsSync(filePath)) {
        return { success: false, error: 'File not found' };
      }

      const buffer = fs.readFileSync(filePath);
      this.workbook = XLSX.read(buffer, { type: 'buffer' });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Failed to load Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async parseData(sheetName?: string): Promise<{ success: boolean; data?: CostDataRow[]; error?: string }> {
    try {
      if (!this.workbook) {
        return { success: false, error: 'No workbook loaded' };
      }

      const sheet = sheetName
        ? this.workbook.Sheets[sheetName]
        : this.workbook.Sheets[this.workbook.SheetNames[0]];

      if (!sheet) {
        return { success: false, error: 'Sheet not found' };
      }

      const jsonData = XLSX.utils.sheet_to_json<any>(sheet);

      // Filter out empty rows before transformation
      // A row is considered empty if it has no Year and no quarter
      const filteredData = jsonData.filter(row => {
        // Check if row has meaningful data - at least Year or quarter should exist
        const hasYear = row['Year'] !== null && row['Year'] !== undefined && row['Year'] !== '';
        const hasQuarter = row['quarter'] !== null && row['quarter'] !== undefined && row['quarter'] !== '';

        // Row must have at least Year and quarter to be valid
        return hasYear && hasQuarter;
      });

      this.data = filteredData.map(row => this.transformRow(row));

      return { success: true, data: this.data };
    } catch (error) {
      return {
        success: false,
        error: `Failed to parse Excel data: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private transformRow(row: any): CostDataRow {
    // Exact headers from Excel file:
    // Column 1: "Type"
    // Column 2: "Year"
    // Column 3: "quarter"
    // Column 4: "Warehouse " (note trailing space)
    // Column 5: "GL Account No."
    // Column 6: "GL Account Name"
    // Column 7: "GL Accounts Group"
    // Column 8: "Cost Type"
    // Column 9: "TCO Model Categories"
    // Column 10: "Main Categories"
    // Column 11: "OpEx /CapEx"
    // Column 12: "total incured cost"
    // Column 13: "WH COST SHARE " (note trailing space)
    // Column 14: "TRS COST SHARE " (note trailing space)
    // Column 15: "WH COST VALUE"
    // Column 16: "TRS COST VALUE " (note trailing space)
    // Column 17: "Dist. COST SHARE " (note trailing space)
    // Column 18: "Last Mile (TRS) COST SHARE " (note trailing space)
    // Column 19: "Proceed 3PL (WH) COST SHARE " (note trailing space)
    // Column 20: "Proceed 3PL (TRS) COST SHARE " (note trailing space)
    // Column 21: "PHs COST VALUE " (note trailing space)
    // Column 22: "Dist. COST VALUE " (note trailing space)
    // Column 23: "Last Mile COST VALUE " (note trailing space)
    // Column 24: "Proceed 3PL (WH) COST VALUE " (note trailing space)
    // Column 25: "Proceed 3PL (TRS) COST VALUE " (note trailing space)
    // Column 26: "PROCEED 3pl COST VALUE " (note trailing space)

    return {
      year: this.parseNumber(row['Year']),
      quarter: String(row['quarter'] || '').toLowerCase(),
      warehouse: String(row['Warehouse '] || row['Warehouse'] || '').trim(), // Handle both with and without space, default to empty
      type: String(row['Type'] || ''),
      glAccountNo: String(row['GL Account No.'] || ''),
      glAccountName: String(row['GL Account Name'] || ''),
      glAccountsGroup: String(row['GL Accounts Group'] || ''),
      costType: String(row['Cost Type'] || ''),
      tcoModelCategories: String(row['TCO Model Categories'] || ''),
      mainCategories: String(row['Main Categories'] || ''),
      opexCapex: String(row['OpEx /CapEx'] || ''), // Note: different spacing
      totalIncurredCost: this.parseNumber(row[' total incured cost ']), // Note: SPACES, lowercase and typo "incured"
      shareWH: this.parsePercentage(row['WH COST SHARE ']), // Note trailing space
      shareTRS: this.parsePercentage(row['TRS COST SHARE ']), // Note trailing space
      shareDistribution: this.parsePercentage(row['Dist. COST SHARE ']), // Note different format
      shareLastMile: this.parsePercentage(row['Last Mile (TRS) COST SHARE ']), // Note different format
      shareProceed3PLWH: this.parsePercentage(row['Proceed 3PL (WH) COST SHARE ']), // Note different format
      shareProceed3PLTRS: this.parsePercentage(row['Proceed 3PL (TRS) COST SHARE ']), // Note different format
      valueWH: this.parseNumber(row[' WH COST VALUE ']), // Note LEADING SPACE
      valueTRS: this.parseNumber(row[' TRS COST VALUE  ']), // Note SPACES on both sides
      valueDistribution: this.parseNumber(row[' Dist. COST VALUE  ']), // Note SPACES
      valueLastMile: this.parseNumber(row[' Last Mile COST VALUE  ']), // Note SPACES
      valueProceed3PLWH: this.parseNumber(row[' Proceed 3PL (WH) COST VALUE  ']), // Note SPACES
      valueProceed3PLTRS: this.parseNumber(row[' Proceed 3PL (TRS) COST VALUE  ']), // Note SPACES
      totalPharmacyDistLM: this.parseNumber(row[' PHs COST VALUE  ']), // Note SPACES
      totalProceed3PL: this.parseNumber(row[' PROCEED 3pl COST VALUE  ']), // Note SPACES and case "3pl"
      currentExpectedCost: 0, // Not present in Excel, defaulting to 0
      totalDistributionCost: this.calculateTotalDistribution(row), // Calculate from available fields
    };
  }

  private calculateTotalDistribution(row: any): number {
    // Calculate total distribution cost from available fields (note the spaces in headers)
    const phsValue = this.parseNumber(row[' PHs COST VALUE  ']);
    const distValue = this.parseNumber(row[' Dist. COST VALUE  ']);
    const lastMileValue = this.parseNumber(row[' Last Mile COST VALUE  ']);
    const proceed3PLValue = this.parseNumber(row[' PROCEED 3pl COST VALUE  ']);

    return phsValue + distValue + lastMileValue + proceed3PLValue;
  }

  private parseNumber(value: any): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const cleaned = value.replace(/[^0-9.-]/g, '');
      const num = parseFloat(cleaned);
      return isNaN(num) ? 0 : num;
    }
    return 0;
  }

  private parsePercentage(value: any): number {
    if (typeof value === 'number') {
      // If it's already a decimal (0.1 for 10%), multiply by 100
      return value < 1 ? value * 100 : value;
    }
    if (typeof value === 'string') {
      const cleaned = value.replace('%', '').trim();
      const num = parseFloat(cleaned);
      return isNaN(num) ? 0 : num;
    }
    return 0;
  }

  validateData(): { isValid: boolean; errors: string[]; warnings: string[]; statistics: any } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const missingData = {
      glAccountsGroup: 0,
      mainCategories: 0,
      warehouse: 0,
      opexCapex: 0,
      tcoModelCategories: 0
    };

    if (this.data.length === 0) {
      errors.push('No data found in the Excel file');
      return { isValid: false, errors, warnings, statistics: null };
    }

    // Check for required fields and collect statistics
    this.data.forEach((row, index) => {
      // Critical errors
      if (!row.year || row.year < 2020 || row.year > 2030) {
        errors.push(`Row ${index + 2}: Invalid year`);
      }
      if (!row.quarter) {
        errors.push(`Row ${index + 2}: Missing quarter`);
      }
      if (row.totalIncurredCost < 0) {
        errors.push(`Row ${index + 2}: Negative total cost`);
      }

      // Data quality warnings - count missing values
      if (!row.glAccountsGroup || row.glAccountsGroup.trim() === '') {
        missingData.glAccountsGroup++;
      }
      if (!row.mainCategories || row.mainCategories.trim() === '') {
        missingData.mainCategories++;
      }
      if (!row.warehouse || row.warehouse.trim() === '') {
        missingData.warehouse++;
      }
      if (!row.opexCapex || row.opexCapex.trim() === '') {
        missingData.opexCapex++;
      }
      if (!row.tcoModelCategories || row.tcoModelCategories.trim() === '') {
        missingData.tcoModelCategories++;
      }
    });

    // Generate warnings for missing data
    const totalRows = this.data.length;
    if (missingData.glAccountsGroup > 0) {
      warnings.push(`GL Accounts Group: ${missingData.glAccountsGroup} rows (${((missingData.glAccountsGroup / totalRows) * 100).toFixed(1)}%) have missing values`);
    }
    if (missingData.mainCategories > 0) {
      warnings.push(`Main Categories: ${missingData.mainCategories} rows (${((missingData.mainCategories / totalRows) * 100).toFixed(1)}%) have missing values`);
    }
    if (missingData.warehouse > 0) {
      warnings.push(`Warehouse: ${missingData.warehouse} rows (${((missingData.warehouse / totalRows) * 100).toFixed(1)}%) have missing values`);
    }
    if (missingData.opexCapex > 0) {
      warnings.push(`OpEx/CapEx: ${missingData.opexCapex} rows (${((missingData.opexCapex / totalRows) * 100).toFixed(1)}%) have missing values`);
    }
    if (missingData.tcoModelCategories > 0) {
      warnings.push(`TCO Model Categories: ${missingData.tcoModelCategories} rows (${((missingData.tcoModelCategories / totalRows) * 100).toFixed(1)}%) have missing values`);
    }

    const statistics = {
      totalRows,
      missingData,
      completenessRate: {
        glAccountsGroup: ((totalRows - missingData.glAccountsGroup) / totalRows * 100).toFixed(1) + '%',
        mainCategories: ((totalRows - missingData.mainCategories) / totalRows * 100).toFixed(1) + '%',
        warehouse: ((totalRows - missingData.warehouse) / totalRows * 100).toFixed(1) + '%',
        opexCapex: ((totalRows - missingData.opexCapex) / totalRows * 100).toFixed(1) + '%',
        tcoModelCategories: ((totalRows - missingData.tcoModelCategories) / totalRows * 100).toFixed(1) + '%'
      }
    };

    return { isValid: errors.length === 0, errors, warnings, statistics };
  }

  async saveToDatabase(db: any): Promise<{ success: boolean; rowsInserted?: number; error?: string }> {
    try {
      let rowsInserted = 0;

      for (const row of this.data) {
        const result = await db.insertCostData(row);
        if (result.success) {
          rowsInserted++;
        }
      }

      return { success: true, rowsInserted };
    } catch (error) {
      return {
        success: false,
        error: `Failed to save to database: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  getDataSummary() {
    if (this.data.length === 0) {
      return null;
    }

    const warehouses = [...new Set(this.data.map(d => d.warehouse))];
    const quarters = [...new Set(this.data.map(d => `${d.year} ${d.quarter}`))];
    const categories = [...new Set(this.data.map(d => d.tcoModelCategories))];

    const totalCost = this.data.reduce((sum, row) => sum + row.totalIncurredCost, 0);
    const avgCostPerRow = totalCost / this.data.length;

    return {
      totalRows: this.data.length,
      warehouses,
      quarters,
      categories,
      totalCost,
      avgCostPerRow,
      dataRange: {
        minYear: Math.min(...this.data.map(d => d.year)),
        maxYear: Math.max(...this.data.map(d => d.year)),
      },
    };
  }
}