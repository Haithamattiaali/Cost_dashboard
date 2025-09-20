// Script to check if DataTable is working properly
// Run this in browser console on http://localhost:5174/

(function checkDataTable() {
    console.log('🔍 Checking DataTable implementation...\n');

    // Check if React is loaded
    if (typeof React !== 'undefined') {
        console.log('✅ React is loaded');
    }

    // Look for DataTable elements
    const tables = document.querySelectorAll('table');
    console.log(`📊 Found ${tables.length} tables on page`);

    // Check for data-table-container
    const dataTableContainers = document.querySelectorAll('.data-table-container');
    if (dataTableContainers.length > 0) {
        console.log(`✅ Found ${dataTableContainers.length} DataTable container(s)`);

        dataTableContainers.forEach((container, idx) => {
            const rows = container.querySelectorAll('tbody tr');
            const headers = container.querySelectorAll('thead th');
            console.log(`   Table ${idx + 1}: ${headers.length} columns, ${rows.length} rows`);
        });
    } else {
        console.log('⚠️  No DataTable containers found - checking for old DataGrid...');

        const gridContainers = document.querySelectorAll('[class*="grid"], [class*="Grid"]');
        console.log(`   Found ${gridContainers.length} potential grid containers`);
    }

    // Check for checkboxes
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    console.log(`☑️  Found ${checkboxes.length} checkboxes`);

    // Check for filter inputs
    const filterInputs = document.querySelectorAll('input[type="text"][placeholder*="ilter"], input[placeholder*="earch"]');
    console.log(`🔍 Found ${filterInputs.length} filter/search inputs`);

    // Check for pagination
    const paginationButtons = document.querySelectorAll('button:has-text("Next"), button:has-text("Previous")');
    console.log(`📄 Found pagination controls: ${paginationButtons.length > 0 ? 'Yes' : 'No'}`);

    // Check React DevTools
    console.log('\n📝 To inspect React components:');
    console.log('1. Install React DevTools extension');
    console.log('2. Look for "DataTable" component in Components tab');
    console.log('3. Check props: data, columns, pageSize, etc.');

    // Check for errors
    const errorElements = document.querySelectorAll('.error, [class*="error"]');
    if (errorElements.length > 0) {
        console.warn(`⚠️  Found ${errorElements.length} error elements on page`);
    }

    // Summary
    console.log('\n📊 DataTable Status Summary:');
    if (dataTableContainers.length > 0 && tables.length > 0) {
        console.log('✅ DataTable appears to be working!');
        console.log('   - Container found');
        console.log('   - Table elements rendered');
        console.log('   - Ready for interaction');
    } else {
        console.log('❌ DataTable may not be rendering properly');
        console.log('   - Check browser console for errors');
        console.log('   - Verify data is being passed correctly');
        console.log('   - Check network tab for API calls');
    }

    // Return diagnostic info
    return {
        tablesFound: tables.length,
        dataTableContainers: dataTableContainers.length,
        checkboxes: checkboxes.length,
        filterInputs: filterInputs.length,
        hasErrors: errorElements.length > 0
    };
})();