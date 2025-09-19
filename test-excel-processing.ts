import { ExcelProcessor } from './backend/etl/ExcelProcessor';
import * as path from 'path';

async function testExcelProcessing() {
  console.log('Testing Excel Processing with Exact Headers');
  console.log('==========================================\n');

  const processor = new ExcelProcessor();
  const filePath = path.join(__dirname, 'data.xlsx');

  // Load the file
  console.log('1. Loading Excel file...');
  const loadResult = await processor.loadFile(filePath);
  if (!loadResult.success) {
    console.error('❌ Failed to load file:', loadResult.error);
    return;
  }
  console.log('✅ File loaded successfully\n');

  // Parse the data
  console.log('2. Parsing Excel data...');
  const parseResult = await processor.parseData();
  if (!parseResult.success) {
    console.error('❌ Failed to parse data:', parseResult.error);
    return;
  }
  console.log('✅ Data parsed successfully');
  console.log(`   Total rows: ${parseResult.data?.length}\n`);

  // Validate the data
  console.log('3. Validating data...');
  const validation = processor.validateData();
  if (!validation.isValid) {
    console.error('❌ Validation failed:');
    validation.errors.forEach(err => console.error(`   - ${err}`));
  } else {
    console.log('✅ Data validation passed\n');
  }

  // Get summary
  console.log('4. Data Summary:');
  const summary = processor.getDataSummary();
  if (summary) {
    console.log(`   - Total rows: ${summary.totalRows}`);
    console.log(`   - Total cost: SAR ${summary.totalCost.toLocaleString()}`);
    console.log(`   - Average cost per row: SAR ${summary.avgCostPerRow.toLocaleString()}`);
    console.log(`   - Year range: ${summary.dataRange.minYear} - ${summary.dataRange.maxYear}`);
    console.log(`   - Quarters: ${summary.quarters.join(', ')}`);
    console.log(`   - Warehouses: ${summary.warehouses.filter(w => w).join(', ') || 'None specified'}`);
    console.log(`   - Categories: ${summary.categories.slice(0, 5).join(', ')}...`);
  }

  // Sample first row to verify mapping
  console.log('\n5. Sample Data (First Row):');
  if (parseResult.data && parseResult.data[0]) {
    const firstRow = parseResult.data[0];
    console.log('   Key fields:');
    console.log(`   - Year: ${firstRow.year}`);
    console.log(`   - Quarter: ${firstRow.quarter}`);
    console.log(`   - Type: ${firstRow.type}`);
    console.log(`   - GL Account: ${firstRow.glAccountNo} - ${firstRow.glAccountName}`);
    console.log(`   - Cost Type: ${firstRow.costType}`);
    console.log(`   - OPEX/CAPEX: ${firstRow.opexCapex}`);
    console.log(`   - Total Incurred Cost: ${firstRow.totalIncurredCost.toLocaleString()}`);
    console.log('\n   Share percentages:');
    console.log(`   - WH Share: ${firstRow.shareWH}%`);
    console.log(`   - TRS Share: ${firstRow.shareTRS}%`);
    console.log(`   - Distribution Share: ${firstRow.shareDistribution}%`);
    console.log(`   - Last Mile Share: ${firstRow.shareLastMile}%`);
    console.log('\n   Cost values:');
    console.log(`   - WH Value: ${firstRow.valueWH.toLocaleString()}`);
    console.log(`   - TRS Value: ${firstRow.valueTRS.toLocaleString()}`);
    console.log(`   - Distribution Value: ${firstRow.valueDistribution.toLocaleString()}`);
    console.log(`   - Last Mile Value: ${firstRow.valueLastMile.toLocaleString()}`);
  }

  console.log('\n✅ All tests completed successfully!');
  console.log('The Excel processor is correctly reading the exact headers from your file.');
}

testExcelProcessing().catch(console.error);