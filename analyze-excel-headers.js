#!/usr/bin/env node

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'data.xlsx');

console.log('='.repeat(80));
console.log('EXCEL FILE HEADER ANALYSIS');
console.log('='.repeat(80));
console.log(`\nAnalyzing file: ${filePath}\n`);

try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
        console.error('ERROR: data.xlsx not found at', filePath);
        process.exit(1);
    }

    // Read the file
    const buffer = fs.readFileSync(filePath);
    const workbook = XLSX.read(buffer, { type: 'buffer' });

    // Display sheet names
    console.log('Available sheets:', workbook.SheetNames);
    console.log('\n' + '-'.repeat(80) + '\n');

    // Process each sheet
    workbook.SheetNames.forEach((sheetName, index) => {
        console.log(`SHEET ${index + 1}: "${sheetName}"`);
        console.log('-'.repeat(40));

        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        if (jsonData.length === 0) {
            console.log('No data in this sheet\n');
            return;
        }

        // Get headers (first row)
        const headers = jsonData[0];

        console.log('\nEXACT COLUMN HEADERS:');
        console.log('---------------------');
        headers.forEach((header, idx) => {
            if (header !== undefined && header !== null && header !== '') {
                console.log(`Column ${idx + 1}: "${header}"`);
            }
        });

        // Get sample data (first 3 rows after headers)
        console.log('\nSAMPLE DATA (first 3 data rows):');
        console.log('--------------------------------');

        for (let rowIdx = 1; rowIdx <= Math.min(3, jsonData.length - 1); rowIdx++) {
            console.log(`\nRow ${rowIdx}:`);
            const row = jsonData[rowIdx];
            headers.forEach((header, colIdx) => {
                if (header && row[colIdx] !== undefined && row[colIdx] !== null && row[colIdx] !== '') {
                    const value = row[colIdx];
                    const displayValue = typeof value === 'string'
                        ? `"${value.substring(0, 50)}${value.length > 50 ? '...' : ''}"`
                        : value;
                    console.log(`  ${header}: ${displayValue}`);
                }
            });
        }

        // Create header mapping comparison
        console.log('\n\nHEADER MAPPING COMPARISON:');
        console.log('--------------------------');
        console.log('Expected in Code -> Actual in Excel:');

        const expectedHeaders = {
            'Year': null,
            'Quarter': null,
            'Warehouse': null,
            'Type': null,
            'GL Account No': null,
            'GL Account Name': null,
            'Cost Type': null,
            'TCO Model Categories': null,
            'Opex/Capex': null,
            'Total Incurred Cost (GL account value)': null,
            'Share-WH': null,
            'Share-TRS': null,
            'Share-Distribution': null,
            'Share-Last Mile': null,
            'Share-Proceed 3PL -WH': null,
            'Share-Proceed 3PL-TRS': null,
            'Value-WH': null,
            'Value-TRS': null,
            'Value-Distribution': null,
            'Value-Last Mile': null,
            'Value-Proceed 3PL -WH': null,
            'Value-Proceed 3PL-TRS': null,
            'Total - Pharmacy,Dist,LM': null,
            'Total-Proceed 3PL': null,
            'Current Expected Cost': null,
            'Total Distribution Cost': null
        };

        // Find actual headers
        headers.forEach(header => {
            if (header) {
                for (const expected in expectedHeaders) {
                    // Case-insensitive partial match
                    if (header.toString().toLowerCase().includes(expected.toLowerCase().substring(0, 10))) {
                        expectedHeaders[expected] = header;
                        break;
                    }
                }
            }
        });

        // Show mapping
        for (const [expected, actual] of Object.entries(expectedHeaders)) {
            if (actual) {
                if (expected !== actual) {
                    console.log(`  ❌ "${expected}" -> "${actual}" (DIFFERENT)`);
                } else {
                    console.log(`  ✅ "${expected}" -> "${actual}" (MATCH)`);
                }
            } else {
                // Try to find similar header
                const similar = headers.find(h => h && h.toString().toLowerCase().includes(expected.toLowerCase().substring(0, 5)));
                if (similar) {
                    console.log(`  ⚠️  "${expected}" -> NOT FOUND (similar: "${similar}")`);
                } else {
                    console.log(`  ❌ "${expected}" -> NOT FOUND`);
                }
            }
        }

        // List unmatched headers from Excel
        console.log('\n\nUNMATCHED HEADERS IN EXCEL:');
        console.log('---------------------------');
        const matchedActual = new Set(Object.values(expectedHeaders).filter(v => v));
        headers.forEach(header => {
            if (header && !matchedActual.has(header)) {
                console.log(`  • "${header}"`);
            }
        });

        console.log('\n' + '='.repeat(80) + '\n');
    });

    // Generate TypeScript mapping code
    console.log('\nGENERATED TYPESCRIPT MAPPING CODE:');
    console.log('-----------------------------------');
    console.log('// Copy this to ExcelProcessor.ts transformRow method:\n');

    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    const headers = jsonData[0];

    console.log('private transformRow(row: any): CostDataRow {');
    console.log('  // Exact headers from Excel file:');
    headers.forEach((header, idx) => {
        if (header) {
            console.log(`  // Column ${idx + 1}: "${header}"`);
        }
    });
    console.log('\n  return {');

    // Generate mapping based on actual headers
    const mappings = [
        { field: 'year', header: headers.find(h => h && h.toString().toLowerCase().includes('year')) },
        { field: 'quarter', header: headers.find(h => h && h.toString().toLowerCase().includes('quarter')) },
        { field: 'warehouse', header: headers.find(h => h && h.toString().toLowerCase().includes('warehouse')) },
        { field: 'type', header: headers.find(h => h && h.toString().toLowerCase().includes('type') && !h.toString().toLowerCase().includes('cost')) },
        { field: 'glAccountNo', header: headers.find(h => h && h.toString().toLowerCase().includes('gl') && h.toString().toLowerCase().includes('no')) },
        { field: 'glAccountName', header: headers.find(h => h && h.toString().toLowerCase().includes('gl') && h.toString().toLowerCase().includes('name')) },
        { field: 'costType', header: headers.find(h => h && h.toString().toLowerCase().includes('cost') && h.toString().toLowerCase().includes('type')) },
        { field: 'tcoModelCategories', header: headers.find(h => h && h.toString().toLowerCase().includes('tco')) },
        { field: 'opexCapex', header: headers.find(h => h && h.toString().toLowerCase().includes('opex') || h.toString().toLowerCase().includes('capex')) },
        { field: 'totalIncurredCost', header: headers.find(h => h && h.toString().toLowerCase().includes('total') && h.toString().toLowerCase().includes('incurred')) },
        { field: 'shareWH', header: headers.find(h => h && h.toString().toLowerCase().includes('share') && h.toString().toLowerCase().includes('wh')) },
        { field: 'shareTRS', header: headers.find(h => h && h.toString().toLowerCase().includes('share') && h.toString().toLowerCase().includes('trs')) },
        { field: 'shareDistribution', header: headers.find(h => h && h.toString().toLowerCase().includes('share') && h.toString().toLowerCase().includes('dist')) },
        { field: 'shareLastMile', header: headers.find(h => h && h.toString().toLowerCase().includes('share') && h.toString().toLowerCase().includes('last')) },
        { field: 'shareProceed3PLWH', header: headers.find(h => h && h.toString().toLowerCase().includes('share') && h.toString().toLowerCase().includes('proceed') && h.toString().toLowerCase().includes('wh')) },
        { field: 'shareProceed3PLTRS', header: headers.find(h => h && h.toString().toLowerCase().includes('share') && h.toString().toLowerCase().includes('proceed') && h.toString().toLowerCase().includes('trs')) },
        { field: 'valueWH', header: headers.find(h => h && h.toString().toLowerCase().includes('value') && h.toString().toLowerCase().includes('wh')) },
        { field: 'valueTRS', header: headers.find(h => h && h.toString().toLowerCase().includes('value') && h.toString().toLowerCase().includes('trs')) },
        { field: 'valueDistribution', header: headers.find(h => h && h.toString().toLowerCase().includes('value') && h.toString().toLowerCase().includes('dist')) },
        { field: 'valueLastMile', header: headers.find(h => h && h.toString().toLowerCase().includes('value') && h.toString().toLowerCase().includes('last')) },
        { field: 'valueProceed3PLWH', header: headers.find(h => h && h.toString().toLowerCase().includes('value') && h.toString().toLowerCase().includes('proceed') && h.toString().toLowerCase().includes('wh')) },
        { field: 'valueProceed3PLTRS', header: headers.find(h => h && h.toString().toLowerCase().includes('value') && h.toString().toLowerCase().includes('proceed') && h.toString().toLowerCase().includes('trs')) },
        { field: 'totalPharmacyDistLM', header: headers.find(h => h && h.toString().toLowerCase().includes('pharmacy')) },
        { field: 'totalProceed3PL', header: headers.find(h => h && h.toString().toLowerCase().includes('total') && h.toString().toLowerCase().includes('proceed')) },
        { field: 'currentExpectedCost', header: headers.find(h => h && h.toString().toLowerCase().includes('current') && h.toString().toLowerCase().includes('expected')) },
        { field: 'totalDistributionCost', header: headers.find(h => h && h.toString().toLowerCase().includes('total') && h.toString().toLowerCase().includes('distribution') && h.toString().toLowerCase().includes('cost')) }
    ];

    mappings.forEach(({ field, header }) => {
        const method = field.startsWith('share') || field.startsWith('value') || field.includes('Cost') || field.includes('total')
            ? (field.startsWith('share') ? 'this.parsePercentage' : 'this.parseNumber')
            : 'String';

        if (header) {
            console.log(`    ${field}: ${method}(row['${header}']${method === 'String' ? ' || \'\'' : ''}),`);
        } else {
            console.log(`    ${field}: ${method === 'String' ? '\'\'' : '0'}, // WARNING: Header not found in Excel`);
        }
    });

    console.log('  };');
    console.log('}');

} catch (error) {
    console.error('ERROR:', error.message);
    process.exit(1);
}