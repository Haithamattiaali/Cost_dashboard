#!/usr/bin/env node

/**
 * Test script to verify OPEX/CAPEX filter functionality
 */

const http = require('http');

function testEndpoint(path, description) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: `/api${path}`,
      method: 'GET'
    };

    http.get(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          console.log(`\n✅ ${description}`);
          console.log(`   Path: ${path}`);

          if (json.metrics) {
            console.log(`   Total Cost: $${json.metrics.totalCost?.toLocaleString() || 0}`);
            console.log(`   OPEX: $${json.metrics.totalOpex?.toLocaleString() || 0}`);
            console.log(`   CAPEX: $${json.metrics.totalCapex?.toLocaleString() || 0}`);
            console.log(`   Data rows: ${json.metrics.topExpenses?.length || 0}`);
          } else if (json.options) {
            console.log(`   OPEX/CAPEX values: ${JSON.stringify(json.options.opexCapex)}`);
          }
          resolve(true);
        } catch (e) {
          console.error(`❌ ${description} - Failed to parse response`);
          resolve(false);
        }
      });
    }).on('error', (err) => {
      console.error(`❌ ${description} - Request failed: ${err.message}`);
      resolve(false);
    });
  });
}

async function runTests() {
  console.log('================================');
  console.log('OPEX/CAPEX Filter Test Suite');
  console.log('================================');

  // Test 1: Get filter options
  await testEndpoint('/filters/options', 'Get Filter Options');

  // Test 2: Dashboard without filters
  await testEndpoint('/costs/dashboard', 'Dashboard - No Filters');

  // Test 3: Dashboard with OpEx filter
  await testEndpoint('/costs/dashboard?opexCapex=OpEx', 'Dashboard - OpEx Filter');

  // Test 4: Dashboard with CapEx filter
  await testEndpoint('/costs/dashboard?opexCapex=CapEx', 'Dashboard - CapEx Filter');

  // Test 5: Dashboard with incorrect case
  await testEndpoint('/costs/dashboard?opexCapex=OPEX', 'Dashboard - OPEX (uppercase)');
  await testEndpoint('/costs/dashboard?opexCapex=CAPEX', 'Dashboard - CAPEX (uppercase)');

  // Test 6: Combined filters
  await testEndpoint('/costs/dashboard?opexCapex=OpEx&year=2025', 'Dashboard - OpEx + Year 2025');

  console.log('\n================================');
  console.log('Test Suite Completed');
  console.log('================================\n');
}

runTests();