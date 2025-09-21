// Test Script for Dashboard Functionality
// Run this in browser console after uploading Excel file

async function testDashboard() {
  console.log('=== Dashboard Test Script ===');

  // 1. Check IndexedDB data
  console.log('\n1. Checking IndexedDB data...');
  try {
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

    console.log(`✓ Found ${data.length} rows in IndexedDB`);

    if (data.length > 0) {
      // Check data structure
      const firstRow = data[0];
      console.log('\n2. First row structure:');
      console.log('- year:', firstRow.year);
      console.log('- quarter:', firstRow.quarter);
      console.log('- warehouse:', firstRow.warehouse);
      console.log('- totalIncurredCostGlAccountValue:', firstRow.totalIncurredCostGlAccountValue);
      console.log('- opexCapex:', firstRow.opexCapex);
      console.log('- valueDmasco:', firstRow.valueDmasco);
      console.log('- valueProceed3PL:', firstRow.valueProceed3PL);
      console.log('- pharmaciesCost:', firstRow.pharmaciesCost);
      console.log('- distributionCost:', firstRow.distributionCost);
      console.log('- lastMileCost:', firstRow.lastMileCost);

      // Check aggregations
      console.log('\n3. Data aggregations:');

      const totalCost = data.reduce((sum, row) => sum + (row.totalIncurredCostGlAccountValue || 0), 0);
      console.log('- Total Cost:', totalCost.toLocaleString());

      const opexTotal = data
        .filter(row => row.opexCapex?.toLowerCase() === 'opex')
        .reduce((sum, row) => sum + (row.totalIncurredCostGlAccountValue || 0), 0);
      console.log('- OPEX Total:', opexTotal.toLocaleString());

      const capexTotal = data
        .filter(row => row.opexCapex?.toLowerCase() === 'capex')
        .reduce((sum, row) => sum + (row.totalIncurredCostGlAccountValue || 0), 0);
      console.log('- CAPEX Total:', capexTotal.toLocaleString());

      const years = [...new Set(data.map(r => r.year))].sort();
      console.log('- Years:', years.join(', '));

      const quarters = [...new Set(data.map(r => r.quarter))].sort();
      console.log('- Quarters:', quarters.join(', '));

      const warehouses = [...new Set(data.map(r => r.warehouse).filter(Boolean))];
      console.log('- Warehouses:', warehouses.length, 'unique');

      const categories = [...new Set(data.map(r => r.tcoModelCategories).filter(Boolean))];
      console.log('- TCO Categories:', categories.length, 'unique');

      // Check department costs
      console.log('\n4. Department costs check:');
      const hasPharma = data.filter(r => r.pharmaciesCost > 0).length;
      const hasDist = data.filter(r => r.distributionCost > 0).length;
      const hasLastMile = data.filter(r => r.lastMileCost > 0).length;
      const hasProceed = data.filter(r => r.valueProceed3PL > 0).length;

      console.log('- Rows with pharmaciesCost:', hasPharma);
      console.log('- Rows with distributionCost:', hasDist);
      console.log('- Rows with lastMileCost:', hasLastMile);
      console.log('- Rows with proceed3PL values:', hasProceed);

      // Check for potential issues
      console.log('\n5. Data quality checks:');
      const invalidCosts = data.filter(r => !r.totalIncurredCostGlAccountValue || r.totalIncurredCostGlAccountValue <= 0);
      console.log('- Rows with invalid/zero costs:', invalidCosts.length);

      const missingQuarters = data.filter(r => !r.quarter);
      console.log('- Rows with missing quarters:', missingQuarters.length);

      const missingYears = data.filter(r => !r.year);
      console.log('- Rows with missing years:', missingYears.length);

      const invalidOpexCapex = data.filter(r => r.opexCapex && r.opexCapex.toLowerCase() !== 'opex' && r.opexCapex.toLowerCase() !== 'capex');
      console.log('- Rows with invalid OPEX/CAPEX values:', invalidOpexCapex.length);

      // Summary
      console.log('\n=== Test Summary ===');
      if (totalCost > 0 && years.length > 0 && quarters.length > 0) {
        console.log('✅ Data looks good! Dashboard should display correctly.');
      } else {
        console.log('⚠️ Data may have issues. Check the warnings above.');
      }

      // Return summary for further analysis
      return {
        rowCount: data.length,
        totalCost,
        opexTotal,
        capexTotal,
        years,
        quarters,
        warehouseCount: warehouses.length,
        categoryCount: categories.length,
        departmentCosts: {
          pharmacies: hasPharma,
          distribution: hasDist,
          lastMile: hasLastMile,
          proceed3PL: hasProceed
        }
      };
    } else {
      console.log('❌ No data in IndexedDB. Please upload an Excel file first.');
      return null;
    }
  } catch (error) {
    console.error('❌ Error accessing IndexedDB:', error);
    return null;
  }
}

// Run the test
testDashboard().then(result => {
  if (result) {
    console.log('\n📊 Test Results:', result);
  }
});