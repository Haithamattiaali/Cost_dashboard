import { ExcelProcessor } from './backend/etl/ExcelProcessor';
import { DatabaseManager } from './backend/database/DatabaseManager';
import path from 'path';

async function reimportData() {
  console.log('Starting data re-import process...');

  const processor = new ExcelProcessor();
  const db = new DatabaseManager();

  try {
    // Initialize database
    const dbResult = await db.initialize({});
    if (!dbResult.success) {
      console.error('Failed to initialize database:', dbResult.error);
      return;
    }
    console.log('✅ Database initialized');

    // Clear existing data
    console.log('Clearing existing data...');
    await db.clearAllData();
    console.log('✅ Existing data cleared');

    // Load Excel file
    const excelPath = path.join(__dirname, 'data.xlsx');
    console.log('Loading Excel file from:', excelPath);

    const loadResult = await processor.loadFile(excelPath);
    if (!loadResult.success) {
      console.error('Failed to load Excel file:', loadResult.error);
      return;
    }
    console.log('✅ Excel file loaded');

    // Parse data
    const parseResult = await processor.parseData();
    if (!parseResult.success || !parseResult.data) {
      console.error('Failed to parse Excel data:', parseResult.error);
      return;
    }
    console.log(`✅ Parsed ${parseResult.data.length} rows from Excel`);

    // Check for new fields in first few rows
    console.log('\nSample data with new fields:');
    parseResult.data.slice(0, 3).forEach((row, index) => {
      console.log(`Row ${index + 1}:`);
      console.log(`  GL Account Name: ${row.glAccountName}`);
      console.log(`  GL Accounts Group: ${row.glAccountsGroup || '(empty)'}`);
      console.log(`  Main Categories: ${row.mainCategories || '(empty)'}`);
    });

    // Validate data
    const validation = processor.validateData();
    if (validation.warnings.length > 0) {
      console.log('\n⚠️ Data validation warnings:');
      validation.warnings.forEach(warning => console.log(`  - ${warning}`));
    }

    // Save to database
    console.log('\nSaving data to database...');
    const saveResult = await processor.saveToDatabase(db);
    if (!saveResult.success) {
      console.error('Failed to save to database:', saveResult.error);
      return;
    }
    console.log(`✅ Successfully imported ${saveResult.rowsInserted} rows to database`);

    // Get data summary
    const summary = processor.getDataSummary();
    if (summary) {
      console.log('\n📊 Data Summary:');
      console.log(`  Total rows: ${summary.totalRows}`);
      console.log(`  Total cost: $${summary.totalCost.toLocaleString()}`);
      console.log(`  Warehouses: ${summary.warehouses.join(', ')}`);
      console.log(`  Date range: ${summary.dataRange.minYear} - ${summary.dataRange.maxYear}`);
    }

  } catch (error) {
    console.error('Error during import:', error);
  } finally {
    db.close();
    console.log('\nData re-import complete!');
  }
}

// Run the import
reimportData().catch(console.error);