#!/usr/bin/env ts-node

import { ExcelProcessor } from './backend/etl/ExcelProcessor';
import * as path from 'path';

async function testExcelExtraction() {
    console.log('='.repeat(80));
    console.log('TESTING EXCEL DATA EXTRACTION WITH EXACT HEADERS');
    console.log('='.repeat(80));

    const processor = new ExcelProcessor();
    const filePath = path.join(__dirname, 'data.xlsx');

    console.log(`\nLoading file: ${filePath}`);

    // Load the file
    const loadResult = await processor.loadFile(filePath);
    if (!loadResult.success) {
        console.error('❌ Failed to load file:', loadResult.error);
        process.exit(1);
    }
    console.log('✅ File loaded successfully');

    // Parse the data
    console.log('\nParsing data from sheet "Q2-25 TCO "...');
    const parseResult = await processor.parseData('Q2-25 TCO ');

    if (!parseResult.success) {
        console.error('❌ Failed to parse data:', parseResult.error);
        process.exit(1);
    }

    console.log(`✅ Successfully parsed ${parseResult.data?.length} rows`);

    // Display first 3 rows with detailed mapping
    if (parseResult.data && parseResult.data.length > 0) {
        console.log('\n' + '-'.repeat(80));
        console.log('FIRST 3 ROWS (DETAILED VIEW):');
        console.log('-'.repeat(80));

        const rowsToShow = Math.min(3, parseResult.data.length);

        for (let i = 0; i < rowsToShow; i++) {
            const row = parseResult.data[i];
            console.log(`\nROW ${i + 1}:`);
            console.log('------');

            // Show key fields
            console.log(`  Basic Info:`);
            console.log(`    Year: ${row.year}`);
            console.log(`    Quarter: ${row.quarter}`);
            console.log(`    Warehouse: "${row.warehouse}"`);
            console.log(`    Type: "${row.type}"`);

            console.log(`  GL Account:`);
            console.log(`    No: "${row.glAccountNo}"`);
            console.log(`    Name: "${row.glAccountName}"`);

            console.log(`  Categories:`);
            console.log(`    Cost Type: "${row.costType}"`);
            console.log(`    TCO Model: "${row.tcoModelCategories}"`);
            console.log(`    OpEx/CapEx: "${row.opexCapex}"`);

            console.log(`  Financial:`);
            console.log(`    Total Incurred Cost: ${row.totalIncurredCost}`);

            console.log(`  Shares (%):`);
            console.log(`    WH: ${row.shareWH}`);
            console.log(`    TRS: ${row.shareTRS}`);
            console.log(`    Distribution: ${row.shareDistribution}`);
            console.log(`    Last Mile: ${row.shareLastMile}`);
            console.log(`    Proceed 3PL WH: ${row.shareProceed3PLWH}`);
            console.log(`    Proceed 3PL TRS: ${row.shareProceed3PLTRS}`);

            console.log(`  Values:`);
            console.log(`    WH: ${row.valueWH}`);
            console.log(`    TRS: ${row.valueTRS}`);
            console.log(`    Distribution: ${row.valueDistribution}`);
            console.log(`    Last Mile: ${row.valueLastMile}`);
            console.log(`    Proceed 3PL WH: ${row.valueProceed3PLWH}`);
            console.log(`    Proceed 3PL TRS: ${row.valueProceed3PLTRS}`);

            console.log(`  Totals:`);
            console.log(`    Pharmacy/Dist/LM: ${row.totalPharmacyDistLM}`);
            console.log(`    Proceed 3PL: ${row.totalProceed3PL}`);
            console.log(`    Total Distribution Cost: ${row.totalDistributionCost}`);
        }
    }

    // Validate data
    console.log('\n' + '-'.repeat(80));
    console.log('DATA VALIDATION:');
    console.log('-'.repeat(80));

    const validation = processor.validateData();
    if (validation.isValid) {
        console.log('✅ Data validation passed');
    } else {
        console.log('❌ Data validation failed:');
        validation.errors.forEach(error => {
            console.log(`  - ${error}`);
        });
    }

    // Get summary
    const summary = processor.getDataSummary();
    if (summary) {
        console.log('\n' + '-'.repeat(80));
        console.log('DATA SUMMARY:');
        console.log('-'.repeat(80));
        console.log(`  Total Rows: ${summary.totalRows}`);
        console.log(`  Date Range: ${summary.dataRange.minYear} - ${summary.dataRange.maxYear}`);
        console.log(`  Total Cost: ${summary.totalCost.toLocaleString()}`);
        console.log(`  Average Cost per Row: ${summary.avgCostPerRow.toLocaleString()}`);
        console.log(`  Unique Warehouses: ${summary.warehouses.length}`);
        console.log(`  Unique Quarters: ${summary.quarters.length}`);
        console.log(`  Unique Categories: ${summary.categories.length}`);

        console.log('\n  Warehouses:');
        summary.warehouses.slice(0, 5).forEach(w => console.log(`    - ${w}`));
        if (summary.warehouses.length > 5) {
            console.log(`    ... and ${summary.warehouses.length - 5} more`);
        }
    }

    console.log('\n' + '='.repeat(80));
    console.log('TEST COMPLETED SUCCESSFULLY');
    console.log('='.repeat(80));
}

testExcelExtraction().catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
});