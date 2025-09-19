# OPEX/CAPEX Filter Fix Documentation

## Issue Summary
The OPEX/CAPEX filter in the cost dashboard was not working correctly. When users selected "CAPEX" from the dropdown, the dashboard continued to show all data instead of filtering to only CAPEX items.

## Root Causes Identified

### 1. **Missing Filter Application in Dashboard Endpoint**
- **Location**: `backend/routes/costs.ts` line 42-59
- **Issue**: The `/api/costs/dashboard` endpoint was calling `db.getAllCostData()` instead of `db.getCostDataByFilters(filters)`
- **Impact**: ALL filters were being ignored, not just OPEX/CAPEX

### 2. **Case Sensitivity Mismatch**
- **Database Values**: `OpEx` and `CapEx` (mixed case)
- **Code Expectations**: `OPEX` and `CAPEX` (uppercase)
- **Locations Affected**:
  - `backend/etl/CostTransformer.ts` lines 84-87 (aggregation)
  - `backend/etl/CostTransformer.ts` lines 117-122 (metrics calculation)

### 3. **Case-Sensitive Database Query**
- **Location**: `backend/database/DatabaseManager.ts` line 325-328
- **Issue**: SQL query used exact string match instead of case-insensitive comparison

## Fixes Applied

### Fix 1: Apply Filters to Dashboard Endpoint
```typescript
// OLD CODE (line 42-59 in backend/routes/costs.ts)
router.get('/dashboard', async (req: Request, res: Response) => {
  const data = await db.getAllCostData(); // ❌ Ignores filters
  // ...
});

// NEW CODE
router.get('/dashboard', async (req: Request, res: Response) => {
  const filters = {
    year: req.query.year ? parseInt(req.query.year as string) : undefined,
    quarter: req.query.quarter as string,
    warehouse: req.query.warehouse as string,
    type: req.query.type as string,
    costType: req.query.costType as string,
    opexCapex: req.query.opexCapex as string,
  };

  const data = await db.getCostDataByFilters(filters); // ✅ Applies filters
  // ...
});
```

### Fix 2: Case-Insensitive OPEX/CAPEX Comparison
```typescript
// CostTransformer.ts - Aggregation (lines 84-87)
// OLD CODE
if (row.opexCapex === 'OPEX') { // ❌ Case-sensitive

// NEW CODE
const opexCapexUpper = row.opexCapex?.toUpperCase();
if (opexCapexUpper === 'OPEX') { // ✅ Case-insensitive

// CostTransformer.ts - Metrics (lines 117-122)
// OLD CODE
.filter(row => row.opexCapex === 'OPEX') // ❌ Case-sensitive

// NEW CODE
.filter(row => row.opexCapex?.toUpperCase() === 'OPEX') // ✅ Case-insensitive
```

### Fix 3: Case-Insensitive Database Query
```typescript
// DatabaseManager.ts (lines 325-328)
// OLD CODE
query += ' AND opex_capex = ?'; // ❌ Case-sensitive

// NEW CODE
query += ' AND UPPER(opex_capex) = UPPER(?)'; // ✅ Case-insensitive
```

## Test Results

### Before Fix
- ❌ Selecting "CAPEX" showed all data ($44,975,273.34)
- ❌ Filters were completely ignored
- ❌ Case variations failed (OPEX vs OpEx)

### After Fix
- ✅ Selecting "OpEx" shows only OPEX data ($44,975,273.34)
- ✅ Selecting "CapEx" shows only CAPEX data ($0 - all CapEx entries have 0 cost in test data)
- ✅ All case variations work (OPEX, OpEx, opex)
- ✅ Combined filters work (OpEx + Year 2025)

## Files Modified
1. `/backend/routes/costs.ts` - Added filter parsing to dashboard endpoint
2. `/backend/etl/CostTransformer.ts` - Made OPEX/CAPEX comparison case-insensitive
3. `/backend/database/DatabaseManager.ts` - Made SQL query case-insensitive

## Testing
Run the test suite:
```bash
node test-filters.js
```

Open the test interface:
```bash
open test-frontend-filters.html
```

## Rollback Procedure
If issues arise, revert the three modified files:

```bash
# Revert backend routes
git checkout backend/routes/costs.ts

# Revert transformer
git checkout backend/etl/CostTransformer.ts

# Revert database manager
git checkout backend/database/DatabaseManager.ts

# Restart backend
npm run dev:backend
```

## Risk Assessment
- **Risk Level**: LOW
- **Change Size**: 3 files, ~30 lines of code
- **Backward Compatibility**: ✅ Maintained
- **Database Changes**: None
- **Frontend Changes**: None
- **API Contract Changes**: None

## Verification Checklist
- [x] CAPEX filter returns only CAPEX items
- [x] OPEX filter returns only OPEX items
- [x] Case-insensitive filtering works
- [x] Combined filters work correctly
- [x] No filter returns all data
- [x] Dashboard metrics calculate correctly
- [x] No performance degradation

## Monitoring
Added console logging for observability:
- Filter parameters received
- Number of rows returned after filtering

## Future Improvements
1. Consider normalizing OPEX/CAPEX values in the database to avoid case issues
2. Add unit tests for filter functionality
3. Consider adding filter validation middleware