#!/usr/bin/env node

/**
 * EXCEL HEADER MAPPING VALIDATION
 * ================================
 * This script validates that all Excel headers are correctly mapped
 * and documents the exact mappings for the dashboard application.
 */

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// EXACT HEADER MAPPINGS FROM EXCEL FILE
// These include all spaces and special characters as they appear in the Excel file
const HEADER_MAPPINGS = {
    // Basic fields
    'Year': 'year',
    'quarter': 'quarter',
    'Warehouse ': 'warehouse', // Note trailing space
    'Type': 'type',
    'GL Account No.': 'glAccountNo',
    'GL Account Name': 'glAccountName',
    'Cost Type': 'costType',
    'TCO Model Categories': 'tcoModelCategories',
    'OpEx /CapEx': 'opexCapex', // Note space before /

    // Financial value (with spaces!)
    ' total incured cost ': 'totalIncurredCost', // Note: spaces and typo "incured"

    // Share percentages
    'WH COST SHARE ': 'shareWH',
    'TRS COST SHARE ': 'shareTRS',
    'Dist. COST SHARE ': 'shareDistribution',
    'Last Mile (TRS) COST SHARE ': 'shareLastMile',
    'Proceed 3PL (WH) COST SHARE ': 'shareProceed3PLWH',
    'Proceed 3PL (TRS) COST SHARE ': 'shareProceed3PLTRS',

    // Cost values (all have leading/trailing spaces!)
    ' WH COST VALUE ': 'valueWH',
    ' TRS COST VALUE  ': 'valueTRS', // Two trailing spaces
    ' Dist. COST VALUE  ': 'valueDistribution',
    ' Last Mile COST VALUE  ': 'valueLastMile',
    ' Proceed 3PL (WH) COST VALUE  ': 'valueProceed3PLWH',
    ' Proceed 3PL (TRS) COST VALUE  ': 'valueProceed3PLTRS',
    ' PHs COST VALUE  ': 'totalPharmacyDistLM',
    ' PROCEED 3pl COST VALUE  ': 'totalProceed3PL', // Note: lowercase "3pl"
};

function validateMapping() {
    console.log('='.repeat(80));
    console.log('EXCEL HEADER MAPPING VALIDATION REPORT');
    console.log('='.repeat(80));
    console.log(`\nDate: ${new Date().toISOString()}`);
    console.log(`File: data.xlsx`);
    console.log(`Sheet: Q2-25 TCO\n`);

    const filePath = path.join(__dirname, 'data.xlsx');

    try {
        const buffer = fs.readFileSync(filePath);
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheet = workbook.Sheets['Q2-25 TCO '];
        const jsonData = XLSX.utils.sheet_to_json(sheet);

        if (jsonData.length === 0) {
            console.error('❌ No data found in Excel file');
            return;
        }

        const firstRow = jsonData[0];
        const actualHeaders = Object.keys(firstRow);

        console.log('-'.repeat(80));
        console.log('HEADER VALIDATION STATUS:');
        console.log('-'.repeat(80) + '\n');

        let matchCount = 0;
        let mismatchCount = 0;

        // Check each expected mapping
        for (const [excelHeader, fieldName] of Object.entries(HEADER_MAPPINGS)) {
            if (actualHeaders.includes(excelHeader)) {
                console.log(`✅ ${fieldName.padEnd(25)} <- "${excelHeader}"`);
                matchCount++;
            } else {
                console.log(`❌ ${fieldName.padEnd(25)} <- "${excelHeader}" (NOT FOUND)`);
                mismatchCount++;
            }
        }

        // Check for unmapped headers
        console.log('\n' + '-'.repeat(80));
        console.log('UNMAPPED EXCEL HEADERS:');
        console.log('-'.repeat(80) + '\n');

        const mappedHeaders = Object.keys(HEADER_MAPPINGS);
        const unmappedHeaders = actualHeaders.filter(h => !mappedHeaders.includes(h));

        if (unmappedHeaders.length > 0) {
            unmappedHeaders.forEach(h => {
                console.log(`⚠️  "${h}" - not mapped to any field`);
            });
        } else {
            console.log('✅ All Excel headers are mapped');
        }

        // Sample data verification
        console.log('\n' + '-'.repeat(80));
        console.log('SAMPLE DATA VERIFICATION:');
        console.log('-'.repeat(80) + '\n');

        const sampleRow = firstRow;
        console.log('First row data (mapped fields only):');

        for (const [excelHeader, fieldName] of Object.entries(HEADER_MAPPINGS)) {
            const value = sampleRow[excelHeader];
            if (value !== undefined) {
                const displayValue = typeof value === 'number'
                    ? value.toLocaleString()
                    : `"${value}"`;
                console.log(`  ${fieldName.padEnd(25)}: ${displayValue}`);
            }
        }

        // Summary
        console.log('\n' + '-'.repeat(80));
        console.log('VALIDATION SUMMARY:');
        console.log('-'.repeat(80) + '\n');

        const totalMappings = Object.keys(HEADER_MAPPINGS).length;
        const successRate = (matchCount / totalMappings * 100).toFixed(1);

        console.log(`Total Expected Mappings: ${totalMappings}`);
        console.log(`Successfully Mapped: ${matchCount}`);
        console.log(`Failed Mappings: ${mismatchCount}`);
        console.log(`Success Rate: ${successRate}%`);
        console.log(`Unmapped Excel Headers: ${unmappedHeaders.length}`);

        if (matchCount === totalMappings) {
            console.log('\n✅ ALL HEADER MAPPINGS ARE VALID!');
            console.log('The Excel file structure matches the expected format.');
        } else {
            console.log('\n❌ HEADER MAPPING ISSUES DETECTED!');
            console.log('Please review the failed mappings above.');
        }

        // Generate TypeScript interface documentation
        console.log('\n' + '='.repeat(80));
        console.log('TYPESCRIPT INTERFACE DOCUMENTATION:');
        console.log('='.repeat(80) + '\n');

        console.log('// Exact header mappings for Excel processing');
        console.log('// IMPORTANT: Headers contain spaces and must match exactly!');
        console.log('export const EXCEL_HEADERS = {');
        for (const [excelHeader, fieldName] of Object.entries(HEADER_MAPPINGS)) {
            console.log(`  '${fieldName}': '${excelHeader}',`);
        }
        console.log('};');

        console.log('\n' + '='.repeat(80));
        console.log('VALIDATION COMPLETE');
        console.log('='.repeat(80));

    } catch (error) {
        console.error('❌ Validation failed:', error.message);
    }
}

validateMapping();