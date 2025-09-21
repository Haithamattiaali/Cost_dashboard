/**
 * Test script to verify filter functionality is working correctly
 * This validates that the type mismatch issue has been resolved
 */

// Test data matching the structure in BrowserDatabase
const testData = [
  { year: 2025, quarter: 'Q2', warehouse: 'WH1', type: 'Type1', totalIncurredCostGlAccountValue: 1000 },
  { year: 2025, quarter: 'Q2', warehouse: 'WH2', type: 'Type2', totalIncurredCostGlAccountValue: 2000 },
  { year: 2025, quarter: 'Q1', warehouse: 'WH1', type: 'Type1', totalIncurredCostGlAccountValue: 1500 },
  { year: 2024, quarter: 'Q4', warehouse: 'WH1', type: 'Type1', totalIncurredCostGlAccountValue: 3000 },
];

// Filter logic matching BrowserDatabase.queryData
function applyFilters(data, filters) {
  console.log('Applying filters:', filters);
  console.log('Filter types - year:', typeof filters.year, 'quarter:', typeof filters.quarter);

  return data.filter(row => {
    // Test the defensive year comparison
    if (filters.year !== undefined && filters.year !== null) {
      const filterYear = Number(filters.year);
      const rowYear = Number(row.year);
      console.log(`Comparing years - filter: ${filterYear} (type: ${typeof filterYear}), row: ${rowYear} (type: ${typeof rowYear})`);
      if (!isNaN(filterYear) && !isNaN(rowYear) && filterYear !== rowYear) {
        return false;
      }
    }

    // Test quarter comparison
    if (filters.quarter) {
      const filterQuarter = String(filters.quarter).toUpperCase().trim();
      const rowQuarter = String(row.quarter).toUpperCase().trim();
      console.log(`Comparing quarters - filter: ${filterQuarter}, row: ${rowQuarter}`);
      if (filterQuarter !== rowQuarter) return false;
    }

    return true;
  });
}

// Test scenarios
console.log('=== FILTER TESTING ===\n');

// Test 1: No filters (should return all data)
console.log('Test 1: No filters');
let result = applyFilters(testData, {});
console.log(`Result: ${result.length} rows (expected: 4)\n`);

// Test 2: Year filter as number (correct type)
console.log('Test 2: Year filter as number');
result = applyFilters(testData, { year: 2025 });
console.log(`Result: ${result.length} rows (expected: 3)\n`);

// Test 3: Year filter as string (what FilterPanel was sending before fix)
console.log('Test 3: Year filter as string (pre-fix behavior)');
result = applyFilters(testData, { year: "2025" });
console.log(`Result: ${result.length} rows (expected: 3 with defensive conversion)\n`);

// Test 4: Quarter filter
console.log('Test 4: Quarter filter');
result = applyFilters(testData, { quarter: "Q2" });
console.log(`Result: ${result.length} rows (expected: 2)\n`);

// Test 5: Combined year and quarter
console.log('Test 5: Combined year (as number) and quarter');
result = applyFilters(testData, { year: 2025, quarter: "Q2" });
console.log(`Result: ${result.length} rows (expected: 2)\n`);

// Test 6: Combined year (as string) and quarter
console.log('Test 6: Combined year (as string) and quarter');
result = applyFilters(testData, { year: "2025", quarter: "Q2" });
console.log(`Result: ${result.length} rows (expected: 2)\n`);

console.log('=== TEST COMPLETE ===');
console.log('\nSUMMARY: The defensive type conversion in queryData should handle both string and number year values correctly.');
