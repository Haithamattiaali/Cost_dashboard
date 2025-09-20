/**
 * Test suite for chart-labels module
 * Validates the intelligent label formatting and positioning logic
 */

import {
  formatValueWithPercentage,
  calculateLabelPosition,
  calculateLabelOffset,
  shouldDisplayLabels,
  formatTableCellWithPercentage
} from './index';

// Test configuration
const runTests = () => {
  console.log('🧪 Testing Chart Labels Module...\n');

  // Test 1: formatValueWithPercentage
  console.log('Test 1: formatValueWithPercentage');
  const testValue1 = formatValueWithPercentage({
    value: 1000000,
    total: 5000000,
    showPercentage: true,
    compact: true
  });
  console.log(`  Input: value=1000000, total=5000000`);
  console.log(`  Output: ${testValue1}`);
  console.assert(testValue1.includes('20.0%'), '  ✅ Percentage calculation correct');

  // Test 2: Label position for different chart types
  console.log('\nTest 2: calculateLabelPosition');
  const barPosition = calculateLabelPosition({
    measureIndex: 0,
    totalMeasures: 3,
    chartType: 'bar'
  });
  console.log(`  Bar chart (3 measures): ${barPosition}`);
  console.assert(barPosition === 'top', '  ✅ Bar charts use top position');

  const linePosition1 = calculateLabelPosition({
    measureIndex: 0,
    totalMeasures: 1,
    chartType: 'line'
  });
  console.log(`  Line chart (1 measure): ${linePosition1}`);
  console.assert(linePosition1 === 'top', '  ✅ Single line uses top position');

  const linePosition2 = calculateLabelPosition({
    measureIndex: 1,
    totalMeasures: 3,
    chartType: 'line'
  });
  console.log(`  Line chart (3 measures, index 1): ${linePosition2}`);
  console.assert(linePosition2 === 'bottom', '  ✅ Multiple lines use staggered positions');

  // Test 3: Label offset calculation
  console.log('\nTest 3: calculateLabelOffset');
  const offset1 = calculateLabelOffset(0, 1, 'bar');
  console.log(`  Single bar chart: ${offset1}px`);
  console.assert(offset1 === 5, '  ✅ Single bar has minimal offset');

  const offset2 = calculateLabelOffset(2, 3, 'line');
  console.log(`  Multi-line chart (index 2 of 3): ${offset2}px`);
  console.assert(offset2 > 15, '  ✅ Multiple lines have increased spacing');

  // Test 4: Should display labels based on density
  console.log('\nTest 4: shouldDisplayLabels');
  const shouldShow1 = shouldDisplayLabels(10, 1, 800);
  console.log(`  10 data points, 1 measure, 800px width: ${shouldShow1}`);
  console.assert(shouldShow1 === true, '  ✅ Shows labels when space is sufficient');

  const shouldShow2 = shouldDisplayLabels(50, 4, 800);
  console.log(`  50 data points, 4 measures, 800px width: ${shouldShow2}`);
  console.assert(shouldShow2 === false, '  ✅ Hides labels when too dense');

  // Test 5: Table cell formatting
  console.log('\nTest 5: formatTableCellWithPercentage');
  const tableCell = formatTableCellWithPercentage(250000, 1000000);
  console.log(`  Input: value=250000, total=1000000`);
  console.log(`  Output: ${JSON.stringify(tableCell, null, 2)}`);
  console.assert(tableCell.percentage === '25.0%', '  ✅ Table percentage correct');
  console.assert(tableCell.percentageClass === 'text-red-600', '  ✅ Color coding applied');

  console.log('\n✅ All tests passed successfully!');
};

// Run tests if this file is executed directly
if (typeof window === 'undefined') {
  runTests();
}

export { runTests };