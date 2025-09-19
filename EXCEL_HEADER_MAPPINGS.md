# Excel Header Mappings Documentation

## Overview
This document provides the exact column header mappings between the Excel file (`data.xlsx`) and the database/application fields. The Excel file has some peculiarities with header formatting that must be matched exactly.

## Important Notes

### ⚠️ Critical Information
1. **Many headers contain leading and/or trailing spaces** - These MUST be preserved
2. **The header "total incured cost" has a typo** - It's spelled "incured" not "incurred"
3. **The "Warehouse" column is typically empty** in the data, so it may not appear in parsed JSON
4. **All monetary values need parsing** to remove formatting and convert to numbers
5. **Percentage values may be decimals or percentages** - Handle both formats

## Exact Header Mappings

| Database Field | Excel Header (EXACT) | Notes |
|---------------|---------------------|-------|
| year | `Year` | Numeric year value |
| quarter | `quarter` | Lowercase in Excel |
| warehouse | `Warehouse ` | Has trailing space, often empty |
| type | `Type` | Category type |
| glAccountNo | `GL Account No.` | With period |
| glAccountName | `GL Account Name` | |
| costType | `Cost Type` | |
| tcoModelCategories | `TCO Model Categories` | |
| opexCapex | `OpEx /CapEx` | Space before slash |
| totalIncurredCost | ` total incured cost ` | **SPACES + TYPO** |
| shareWH | `WH COST SHARE ` | Trailing space |
| shareTRS | `TRS COST SHARE ` | Trailing space |
| shareDistribution | `Dist. COST SHARE ` | Trailing space |
| shareLastMile | `Last Mile (TRS) COST SHARE ` | Trailing space |
| shareProceed3PLWH | `Proceed 3PL (WH) COST SHARE ` | Trailing space |
| shareProceed3PLTRS | `Proceed 3PL (TRS) COST SHARE ` | Trailing space |
| valueWH | ` WH COST VALUE ` | Leading space |
| valueTRS | ` TRS COST VALUE  ` | Leading + 2 trailing spaces |
| valueDistribution | ` Dist. COST VALUE  ` | Leading + trailing spaces |
| valueLastMile | ` Last Mile COST VALUE  ` | Leading + trailing spaces |
| valueProceed3PLWH | ` Proceed 3PL (WH) COST VALUE  ` | Leading + trailing spaces |
| valueProceed3PLTRS | ` Proceed 3PL (TRS) COST VALUE  ` | Leading + trailing spaces |
| totalPharmacyDistLM | ` PHs COST VALUE  ` | Leading + trailing spaces |
| totalProceed3PL | ` PROCEED 3pl COST VALUE  ` | Lowercase "3pl", spaces |

## Unmapped Excel Columns
These columns exist in the Excel file but are not currently mapped:
- `GL Accounts Group`
- `Main Categories`

## Calculated Fields
These fields are calculated from other values:
- `currentExpectedCost` - Not in Excel, defaults to 0
- `totalDistributionCost` - Sum of: PHs + Dist + Last Mile + Proceed 3PL values

## TypeScript Implementation

```typescript
// In ExcelProcessor.ts
private transformRow(row: any): CostDataRow {
  return {
    year: this.parseNumber(row['Year']),
    quarter: String(row['quarter'] || '').toLowerCase(),
    warehouse: String(row['Warehouse '] || row['Warehouse'] || '').trim(),
    type: String(row['Type'] || ''),
    glAccountNo: String(row['GL Account No.'] || ''),
    glAccountName: String(row['GL Account Name'] || ''),
    costType: String(row['Cost Type'] || ''),
    tcoModelCategories: String(row['TCO Model Categories'] || ''),
    opexCapex: String(row['OpEx /CapEx'] || ''),
    totalIncurredCost: this.parseNumber(row[' total incured cost ']),
    shareWH: this.parsePercentage(row['WH COST SHARE ']),
    shareTRS: this.parsePercentage(row['TRS COST SHARE ']),
    shareDistribution: this.parsePercentage(row['Dist. COST SHARE ']),
    shareLastMile: this.parsePercentage(row['Last Mile (TRS) COST SHARE ']),
    shareProceed3PLWH: this.parsePercentage(row['Proceed 3PL (WH) COST SHARE ']),
    shareProceed3PLTRS: this.parsePercentage(row['Proceed 3PL (TRS) COST SHARE ']),
    valueWH: this.parseNumber(row[' WH COST VALUE ']),
    valueTRS: this.parseNumber(row[' TRS COST VALUE  ']),
    valueDistribution: this.parseNumber(row[' Dist. COST VALUE  ']),
    valueLastMile: this.parseNumber(row[' Last Mile COST VALUE  ']),
    valueProceed3PLWH: this.parseNumber(row[' Proceed 3PL (WH) COST VALUE  ']),
    valueProceed3PLTRS: this.parseNumber(row[' Proceed 3PL (TRS) COST VALUE  ']),
    totalPharmacyDistLM: this.parseNumber(row[' PHs COST VALUE  ']),
    totalProceed3PL: this.parseNumber(row[' PROCEED 3pl COST VALUE  ']),
    currentExpectedCost: 0,
    totalDistributionCost: this.calculateTotalDistribution(row),
  };
}
```

## Validation Scripts

Use these scripts to validate the mappings:

1. **analyze-excel-headers.js** - Analyzes and displays all headers
2. **test-extraction.js** - Tests data extraction with correct mappings
3. **validate-data-mapping.js** - Validates all mappings are working

## Common Issues and Solutions

### Issue 1: Values showing as 0
**Cause**: Header doesn't match exactly (missing spaces)
**Solution**: Check for leading/trailing spaces in the Excel header

### Issue 2: Warehouse field empty
**Cause**: Column has no data in Excel
**Solution**: Default to empty string

### Issue 3: Percentage values incorrect
**Cause**: May be stored as decimal (0.1) or percentage (10%)
**Solution**: parsePercentage() handles both formats

## Testing

To verify mappings are working:
```bash
node test-extraction.js
```

Expected output should show:
- ✅ Successfully read 115 rows
- ✅ Total Cost: 44,975,273.34
- ✅ All data quality checks passed

## Last Updated
2025-09-19 - Verified against Q2-25 TCO sheet