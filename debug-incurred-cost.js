#!/usr/bin/env node

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'data.xlsx');

console.log('Debugging "total incurred cost" field extraction...\n');

try {
    const buffer = fs.readFileSync(filePath);
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheet = workbook.Sheets['Q2-25 TCO '];

    // Get raw data with headers
    const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    const headers = rawData[0];

    // Find the column index for total incurred cost
    const costColumnIndex = headers.findIndex(h =>
        h && h.toString().toLowerCase().includes('incur')
    );

    console.log('Headers around "incurred cost" column:');
    for (let i = Math.max(0, costColumnIndex - 2); i <= Math.min(headers.length - 1, costColumnIndex + 2); i++) {
        if (headers[i]) {
            console.log(`  Column ${i + 1}: "${headers[i]}" ${i === costColumnIndex ? '<-- THIS ONE' : ''}`);
        }
    }

    // Get data as JSON objects
    const jsonData = XLSX.utils.sheet_to_json(sheet);

    console.log('\nFirst 5 rows with different header variations:\n');

    const variations = [
        'total incured cost',
        'total incurred cost',
        'Total Incurred Cost',
        'Total incured cost',
        'total incured cost (GL account value)',
        'Total Incurred Cost (GL account value)'
    ];

    jsonData.slice(0, 5).forEach((row, idx) => {
        console.log(`Row ${idx + 1}:`);

        // Check all variations
        variations.forEach(variant => {
            if (row[variant] !== undefined) {
                console.log(`  "${variant}": ${row[variant]} ✅`);
            }
        });

        // Also show all keys containing "cost" or "incur"
        const relevantKeys = Object.keys(row).filter(k =>
            k.toLowerCase().includes('cost') || k.toLowerCase().includes('incur')
        );

        if (relevantKeys.length > 0) {
            console.log('  Other cost-related fields:');
            relevantKeys.forEach(key => {
                if (!variations.includes(key)) {
                    console.log(`    "${key}": ${row[key]}`);
                }
            });
        }
        console.log();
    });

    // Check the exact header
    console.log('Exact header check:');
    const firstDataRow = jsonData[0];
    Object.keys(firstDataRow).forEach(key => {
        if (key.toLowerCase().includes('incur') || key.toLowerCase().includes('total') && key.toLowerCase().includes('cost')) {
            console.log(`  Found: "${key}" = ${firstDataRow[key]}`);
        }
    });

} catch (error) {
    console.error('Error:', error.message);
}