const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Read the Excel file
const filePath = path.join(__dirname, 'data.xlsx');
const workbook = XLSX.readFile(filePath);

// Get the first sheet
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];

// Convert to JSON to get headers and sample data
const jsonData = XLSX.utils.sheet_to_json(sheet);

// Get headers
const headers = Object.keys(jsonData[0] || {});

console.log('Excel Headers Found:');
console.log('===================');
headers.forEach((header, index) => {
  console.log(`${index + 1}. "${header}"`);
});

console.log('\n\nSample Data (First Row):');
console.log('========================');
if (jsonData[0]) {
  Object.entries(jsonData[0]).forEach(([key, value]) => {
    console.log(`"${key}": ${value} (${typeof value})`);
  });
}

console.log('\n\nTotal Rows:', jsonData.length);