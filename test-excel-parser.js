// Excel Parser Test Script
// Run this in browser console after navigating to the Upload page

async function testExcelParsing() {
  console.log('=== Excel Parsing Test ===');

  // Test the actual Excel file
  const excelPath = '/Users/haithamdata/Downloads/Mail Downloads/cost_dashboard_vis3/data.xlsx';
  console.log('Testing file:', excelPath);

  // You'll need to upload the file manually or use this test data
  // This script will analyze the parsed data from IndexedDB

  try {
    // 1. Check IndexedDB for existing data
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('CostDashboardDB', 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    const transaction = db.transaction(['costs'], 'readonly');
    const objectStore = transaction.objectStore('costs');
    const getAllRequest = objectStore.getAll();

    const data = await new Promise((resolve, reject) => {
      getAllRequest.onsuccess = () => resolve(getAllRequest.result);
      getAllRequest.onerror = () => reject(getAllRequest.error);
    });

    if (data.length === 0) {
      console.log('❌ No data in IndexedDB. Please upload the Excel file first.');
      return;
    }

    console.log(`✓ Found ${data.length} rows in IndexedDB`);

    // 2. Analyze data structure
    console.log('\n=== Data Structure Analysis ===');
    const firstRow = data[0];
    const lastRow = data[data.length - 1];

    console.log('First row sample:', {
      year: firstRow.year,
      quarter: firstRow.quarter,
      warehouse: firstRow.warehouse,
      totalCost: firstRow.totalIncurredCostGlAccountValue,
      opexCapex: firstRow.opexCapex,
    });

    // 3. Check department costs mapping
    console.log('\n=== Department Cost Mapping ===');
    const hasDepartmentCosts = {
      pharmacies: data.filter(r => r.pharmaciesCost > 0).length,
      distribution: data.filter(r => r.distributionCost > 0).length,
      lastMile: data.filter(r => r.lastMileCost > 0).length,
      warehouse: data.filter(r => r.warehouseCost > 0).length,
      transportation: data.filter(r => r.transportationCost > 0).length,
      proceed3PLWH: data.filter(r => r.proceed3PLWHCost > 0).length,
      proceed3PLTRS: data.filter(r => r.proceed3PLTRSCost > 0).length,
    };

    console.log('Rows with department costs:', hasDepartmentCosts);

    // 4. Check value columns
    console.log('\n=== Value Column Mapping ===');
    const hasValueColumns = {
      valueDmsco: data.filter(r => r.valueDmsco > 0).length,
      valueProceed3PL: data.filter(r => r.valueProceed3PL > 0).length,
      valueAlFaris: data.filter(r => r.valueAlFaris > 0).length,
      valueJaleel: data.filter(r => r.valueJaleel > 0).length,
      valueOthers: data.filter(r => r.valueOthers > 0).length,
    };

    console.log('Rows with value columns:', hasValueColumns);

    // 5. Aggregate by quarter
    console.log('\n=== Quarterly Aggregation ===');
    const quarterMap = new Map();

    data.forEach(row => {
      const key = `${row.year} ${row.quarter}`;
      if (!quarterMap.has(key)) {
        quarterMap.set(key, {
          totalCost: 0,
          pharmaciesCost: 0,
          distributionCost: 0,
          lastMileCost: 0,
          warehouseCost: 0,
          count: 0
        });
      }

      const q = quarterMap.get(key);
      q.totalCost += row.totalIncurredCostGlAccountValue || 0;
      q.pharmaciesCost += row.pharmaciesCost || 0;
      q.distributionCost += row.distributionCost || 0;
      q.lastMileCost += row.lastMileCost || 0;
      q.warehouseCost += row.warehouseCost || 0;
      q.count++;
    });

    quarterMap.forEach((value, key) => {
      console.log(`${key}:`, {
        rows: value.count,
        totalCost: value.totalCost.toFixed(2),
        pharmacies: value.pharmaciesCost.toFixed(2),
        distribution: value.distributionCost.toFixed(2),
        lastMile: value.lastMileCost.toFixed(2),
        warehouse: value.warehouseCost.toFixed(2)
      });
    });

    // 6. Data validation
    console.log('\n=== Data Validation ===');
    const issues = [];

    // Check for missing critical fields
    const missingYear = data.filter(r => !r.year).length;
    const missingQuarter = data.filter(r => !r.quarter).length;
    const missingCost = data.filter(r => !r.totalIncurredCostGlAccountValue || r.totalIncurredCostGlAccountValue <= 0).length;
    const invalidOpexCapex = data.filter(r => r.opexCapex && !['opex', 'capex'].includes(r.opexCapex.toLowerCase())).length;

    if (missingYear > 0) issues.push(`${missingYear} rows missing year`);
    if (missingQuarter > 0) issues.push(`${missingQuarter} rows missing quarter`);
    if (missingCost > 0) issues.push(`${missingCost} rows with invalid/zero total cost`);
    if (invalidOpexCapex > 0) issues.push(`${invalidOpexCapex} rows with invalid OPEX/CAPEX`);

    if (issues.length === 0) {
      console.log('✅ All critical fields are valid');
    } else {
      console.log('⚠️ Issues found:', issues);
    }

    // 7. Check if department costs need fallback mapping
    console.log('\n=== Department Cost Fallback Check ===');
    const needsFallback = hasDepartmentCosts.pharmacies === 0 &&
                          hasDepartmentCosts.distribution === 0 &&
                          hasDepartmentCosts.lastMile === 0;

    if (needsFallback) {
      console.log('⚠️ Department costs not mapped directly. Checking value columns for fallback...');
      if (hasValueColumns.valueOthers > 0 || hasValueColumns.valueAlFaris > 0 || hasValueColumns.valueJaleel > 0) {
        console.log('✅ Value columns available for fallback mapping');
        console.log('Suggested mapping:');
        console.log('- pharmaciesCost → valueOthers (PHs COST VALUE)');
        console.log('- distributionCost → valueAlFaris (Dist. COST VALUE)');
        console.log('- lastMileCost → valueJaleel (Last Mile COST VALUE)');
        console.log('- warehouseCost → valueDmsco (WH COST VALUE)');
      } else {
        console.log('❌ No value columns for fallback. Check Excel column names.');
      }
    } else {
      console.log('✅ Department costs properly mapped');
    }

    // 8. Summary
    console.log('\n=== SUMMARY ===');
    const totalCost = data.reduce((sum, r) => sum + (r.totalIncurredCostGlAccountValue || 0), 0);
    const years = [...new Set(data.map(r => r.year))].sort();
    const quarters = [...new Set(data.map(r => r.quarter))].sort();
    const warehouses = [...new Set(data.map(r => r.warehouse).filter(Boolean))];

    console.log({
      totalRows: data.length,
      totalCost: totalCost.toLocaleString(),
      years: years.join(', '),
      quarters: quarters.join(', '),
      warehouseCount: warehouses.length,
      dataQuality: issues.length === 0 ? '✅ GOOD' : '⚠️ HAS ISSUES'
    });

    if (totalCost > 0 && !needsFallback) {
      console.log('\n✅ Data parsing successful! Dashboard should display correctly.');
    } else if (totalCost > 0 && needsFallback) {
      console.log('\n⚠️ Data parsed but department costs need fallback mapping.');
    } else {
      console.log('\n❌ Data parsing issues detected. Check the analysis above.');
    }

    return {
      success: totalCost > 0,
      needsFallback,
      issues,
      stats: {
        rows: data.length,
        totalCost,
        years,
        quarters,
        warehouses: warehouses.length
      }
    };

  } catch (error) {
    console.error('❌ Error during testing:', error);
    return { success: false, error: error.message };
  }
}

// Run the test
console.log('Starting Excel parsing test...');
testExcelParsing().then(result => {
  console.log('\n📊 Final Result:', result);
  if (!result.success) {
    console.log('\n🔧 Next Steps:');
    console.log('1. Ensure the Excel file has been uploaded');
    console.log('2. Check browser console for parsing errors');
    console.log('3. Verify column names match expected format');
    console.log('4. Check if data appears in Developer Tools > Application > IndexedDB');
  }
});