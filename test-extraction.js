#!/usr/bin/env node

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

function parseNumber(value) {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
        const cleaned = value.replace(/[^0-9.-]/g, '');
        const num = parseFloat(cleaned);
        return isNaN(num) ? 0 : num;
    }
    return 0;
}

function parsePercentage(value) {
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

function transformRow(row) {
    const transformed = {
        year: parseNumber(row['Year']),
        quarter: String(row['quarter'] || '').toLowerCase(),
        warehouse: String(row['Warehouse '] || '').trim(),
        type: String(row['Type'] || ''),
        glAccountNo: String(row['GL Account No.'] || ''),
        glAccountName: String(row['GL Account Name'] || ''),
        costType: String(row['Cost Type'] || ''),
        tcoModelCategories: String(row['TCO Model Categories'] || ''),
        opexCapex: String(row['OpEx /CapEx'] || ''),
        totalIncurredCost: parseNumber(row[' total incured cost ']), // Note spaces!
        shareWH: parsePercentage(row['WH COST SHARE ']),
        shareTRS: parsePercentage(row['TRS COST SHARE ']),
        shareDistribution: parsePercentage(row['Dist. COST SHARE ']),
        shareLastMile: parsePercentage(row['Last Mile (TRS) COST SHARE ']),
        shareProceed3PLWH: parsePercentage(row['Proceed 3PL (WH) COST SHARE ']),
        shareProceed3PLTRS: parsePercentage(row['Proceed 3PL (TRS) COST SHARE ']),
        valueWH: parseNumber(row[' WH COST VALUE ']), // Note spaces!
        valueTRS: parseNumber(row[' TRS COST VALUE  ']), // Note spaces!
        valueDistribution: parseNumber(row[' Dist. COST VALUE  ']), // Note spaces!
        valueLastMile: parseNumber(row[' Last Mile COST VALUE  ']), // Note spaces!
        valueProceed3PLWH: parseNumber(row[' Proceed 3PL (WH) COST VALUE  ']), // Note spaces!
        valueProceed3PLTRS: parseNumber(row[' Proceed 3PL (TRS) COST VALUE  ']), // Note spaces!
        totalPharmacyDistLM: parseNumber(row[' PHs COST VALUE  ']), // Note spaces!
        totalProceed3PL: parseNumber(row[' PROCEED 3pl COST VALUE  ']), // Note spaces!
        currentExpectedCost: 0,
        totalDistributionCost: 0
    };

    // Calculate total distribution cost
    transformed.totalDistributionCost =
        transformed.totalPharmacyDistLM +
        transformed.valueDistribution +
        transformed.valueLastMile +
        transformed.totalProceed3PL;

    return transformed;
}

async function testExtraction() {
    console.log('='.repeat(80));
    console.log('TESTING EXCEL EXTRACTION WITH EXACT HEADERS');
    console.log('='.repeat(80));

    const filePath = path.join(__dirname, 'data.xlsx');
    console.log(`\nReading: ${filePath}\n`);

    try {
        if (!fs.existsSync(filePath)) {
            console.error('❌ File not found');
            return;
        }

        const buffer = fs.readFileSync(filePath);
        const workbook = XLSX.read(buffer, { type: 'buffer' });

        const sheetName = 'Q2-25 TCO ';
        const sheet = workbook.Sheets[sheetName];

        if (!sheet) {
            console.error('❌ Sheet not found:', sheetName);
            console.log('Available sheets:', workbook.SheetNames);
            return;
        }

        const jsonData = XLSX.utils.sheet_to_json(sheet);
        console.log(`✅ Successfully read ${jsonData.length} rows\n`);

        // Transform all rows
        const transformedData = jsonData.map(transformRow);

        // Show first 3 transformed rows
        console.log('-'.repeat(80));
        console.log('FIRST 3 TRANSFORMED ROWS:');
        console.log('-'.repeat(80));

        for (let i = 0; i < Math.min(3, transformedData.length); i++) {
            const row = transformedData[i];
            console.log(`\n[Row ${i + 1}]`);
            console.log('Basic Info:');
            console.log(`  Year: ${row.year}, Quarter: ${row.quarter}`);
            console.log(`  Warehouse: "${row.warehouse}"`);
            console.log(`  Type: "${row.type}"`);
            console.log(`  GL Account: ${row.glAccountNo} - ${row.glAccountName}`);
            console.log('Categories:');
            console.log(`  Cost Type: "${row.costType}"`);
            console.log(`  TCO Model: "${row.tcoModelCategories}"`);
            console.log(`  OpEx/CapEx: "${row.opexCapex}"`);
            console.log('Financial:');
            console.log(`  Total Incurred Cost: ${row.totalIncurredCost.toLocaleString()}`);
            console.log('Shares (%):');
            console.log(`  WH: ${row.shareWH}%, TRS: ${row.shareTRS}%`);
            console.log(`  Distribution: ${row.shareDistribution}%, Last Mile: ${row.shareLastMile}%`);
            console.log(`  Proceed 3PL WH: ${row.shareProceed3PLWH}%, TRS: ${row.shareProceed3PLTRS}%`);
            console.log('Values:');
            console.log(`  WH: ${row.valueWH.toLocaleString()}, TRS: ${row.valueTRS.toLocaleString()}`);
            console.log(`  Distribution: ${row.valueDistribution.toLocaleString()}`);
            console.log(`  Last Mile: ${row.valueLastMile.toLocaleString()}`);
            console.log(`  Proceed 3PL WH: ${row.valueProceed3PLWH.toLocaleString()}`);
            console.log(`  Proceed 3PL TRS: ${row.valueProceed3PLTRS.toLocaleString()}`);
            console.log('Totals:');
            console.log(`  Pharmacy/Dist/LM: ${row.totalPharmacyDistLM.toLocaleString()}`);
            console.log(`  Proceed 3PL: ${row.totalProceed3PL.toLocaleString()}`);
            console.log(`  Total Distribution Cost: ${row.totalDistributionCost.toLocaleString()}`);
        }

        // Summary statistics
        console.log('\n' + '-'.repeat(80));
        console.log('SUMMARY STATISTICS:');
        console.log('-'.repeat(80));

        const totalCost = transformedData.reduce((sum, row) => sum + row.totalIncurredCost, 0);
        const warehouses = [...new Set(transformedData.map(r => r.warehouse))];
        const quarters = [...new Set(transformedData.map(r => `${r.year} ${r.quarter}`))];
        const categories = [...new Set(transformedData.map(r => r.tcoModelCategories))];

        console.log(`Total Rows: ${transformedData.length}`);
        console.log(`Total Cost: ${totalCost.toLocaleString()}`);
        console.log(`Average Cost per Row: ${(totalCost / transformedData.length).toLocaleString()}`);
        console.log(`Unique Warehouses: ${warehouses.length}`);
        console.log(`Unique Quarters: ${quarters.length}`);
        console.log(`Unique TCO Categories: ${categories.length}`);

        // Show some unique values
        console.log('\nWarehouses (first 5):');
        warehouses.slice(0, 5).forEach(w => console.log(`  - ${w || '(empty)'}`));
        if (warehouses.length > 5) console.log(`  ... and ${warehouses.length - 5} more`);

        console.log('\nQuarters:');
        quarters.forEach(q => console.log(`  - ${q}`));

        console.log('\nTCO Categories (first 5):');
        categories.slice(0, 5).forEach(c => console.log(`  - ${c || '(empty)'}`));
        if (categories.length > 5) console.log(`  ... and ${categories.length - 5} more`);

        // Data quality check
        console.log('\n' + '-'.repeat(80));
        console.log('DATA QUALITY CHECK:');
        console.log('-'.repeat(80));

        let errors = 0;
        let warnings = 0;

        transformedData.forEach((row, index) => {
            if (!row.year || row.year < 2020 || row.year > 2030) {
                console.log(`❌ Row ${index + 2}: Invalid year: ${row.year}`);
                errors++;
            }
            if (!row.quarter) {
                console.log(`❌ Row ${index + 2}: Missing quarter`);
                errors++;
            }
            if (row.totalIncurredCost < 0) {
                console.log(`⚠️  Row ${index + 2}: Negative total cost: ${row.totalIncurredCost}`);
                warnings++;
            }
        });

        if (errors === 0 && warnings === 0) {
            console.log('✅ All data quality checks passed');
        } else {
            console.log(`\nFound ${errors} errors and ${warnings} warnings`);
        }

        console.log('\n' + '='.repeat(80));
        console.log('TEST COMPLETED SUCCESSFULLY');
        console.log('Data is ready for database insertion with correct header mappings');
        console.log('='.repeat(80));

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testExtraction();