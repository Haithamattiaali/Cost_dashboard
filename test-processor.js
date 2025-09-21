// Test script to verify DataProcessor fixes
// Run this in the browser console at http://localhost:5174

async function testDataProcessor() {
    console.log('=== Testing DataProcessor ===');

    // Test 1: Check IndexedDB data
    console.log('\n1. Checking IndexedDB...');
    const dbRequest = indexedDB.open('CostDashboardDB', 1);

    dbRequest.onsuccess = async () => {
        const db = dbRequest.result;
        const transaction = db.transaction(['costs'], 'readonly');
        const objectStore = transaction.objectStore('costs');
        const getAllRequest = objectStore.getAll();

        getAllRequest.onsuccess = async () => {
            const data = getAllRequest.result;
            console.log(`Found ${data.length} rows in IndexedDB`);

            if (data.length > 0) {
                console.log('Sample row:', data[0]);

                // Test 2: Process metrics
                console.log('\n2. Testing calculateMetrics...');

                // Simulate what the API does
                const metrics = {
                    totalCost: data.reduce((sum, row) => sum + (row.totalIncurredCostGlAccountValue || 0), 0),
                    totalOpex: data.filter(row => row.opexCapex?.toLowerCase() === 'opex')
                        .reduce((sum, row) => sum + (row.totalIncurredCostGlAccountValue || 0), 0),
                    totalCapex: data.filter(row => row.opexCapex?.toLowerCase() === 'capex')
                        .reduce((sum, row) => sum + (row.totalIncurredCostGlAccountValue || 0), 0),
                    topExpenses: data
                        .filter(row => row.totalIncurredCostGlAccountValue > 0)
                        .sort((a, b) => (b.totalIncurredCostGlAccountValue || 0) - (a.totalIncurredCostGlAccountValue || 0))
                        .slice(0, 100)
                        .map(row => ({
                            ...row,
                            totalIncurredCost: row.totalIncurredCostGlAccountValue,
                            quarter: row.quarter?.toUpperCase() || row.quarter
                        }))
                };

                console.log('Metrics calculated:');
                console.log('- Total Cost:', metrics.totalCost);
                console.log('- Total OpEx:', metrics.totalOpex);
                console.log('- Total CapEx:', metrics.totalCapex);
                console.log('- Top Expenses Count:', metrics.topExpenses.length);

                // Test 3: Check topExpenses format
                console.log('\n3. Checking topExpenses format...');
                if (metrics.topExpenses.length > 0) {
                    const sample = metrics.topExpenses[0];
                    console.log('Sample topExpense:', sample);

                    // Check required fields for DataGrid
                    const requiredFields = [
                        'year', 'quarter', 'warehouse', 'glAccountNo',
                        'glAccountName', 'totalIncurredCost', 'opexCapex'
                    ];

                    const missingFields = requiredFields.filter(field => !(field in sample));
                    if (missingFields.length > 0) {
                        console.error('Missing required fields:', missingFields);
                    } else {
                        console.log('✓ All required fields present');
                    }
                }

                // Test 4: Check GL Account aggregation
                console.log('\n4. Testing GL Account aggregation...');
                const glMap = new Map();
                data.forEach(row => {
                    const glKey = row.glAccountName || row.glAccountNo || 'Unknown';
                    glMap.set(glKey, (glMap.get(glKey) || 0) + (row.totalIncurredCostGlAccountValue || 0));
                });
                const costByGLAccount = Array.from(glMap.entries())
                    .map(([value, totalCost]) => ({ value, totalCost }))
                    .sort((a, b) => b.totalCost - a.totalCost)
                    .slice(0, 5);

                console.log('Top 5 GL Accounts:', costByGLAccount);
            } else {
                console.log('No data in IndexedDB. Please upload an Excel file first.');
            }

            db.close();
        };
    };

    dbRequest.onerror = () => {
        console.error('Failed to open IndexedDB');
    };
}

// Instructions
console.log('Run testDataProcessor() to test the data processing fixes');
console.log('Or copy and paste the entire function into the browser console');

// Auto-run if in browser
if (typeof window !== 'undefined') {
    window.testDataProcessor = testDataProcessor;
    console.log('Test function loaded. Run: testDataProcessor()');
}