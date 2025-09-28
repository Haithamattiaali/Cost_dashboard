// Test script to verify the Others tooltip scrollability fix
// Run this in the browser console when hovering over the "Others" bar

(() => {
  console.log('=== Testing Others Tooltip Scrollability ===');

  // Look for Recharts tooltips
  const tooltips = document.querySelectorAll('.recharts-default-tooltip, .recharts-custom-tooltip');
  console.log(`Found ${tooltips.length} Recharts tooltip(s)`);

  // Look for our custom scrollable container
  const scrollContainers = document.querySelectorAll('.others-tooltip-scroll');
  console.log(`Found ${scrollContainers.length} scrollable container(s)`);

  scrollContainers.forEach((container, index) => {
    console.group(`Scrollable Container ${index + 1}:`);

    const styles = window.getComputedStyle(container);
    const hasVerticalScroll = container.scrollHeight > container.clientHeight;

    console.log('Element:', container);
    console.log('Classes:', container.className);
    console.log('ScrollHeight:', container.scrollHeight, 'px');
    console.log('ClientHeight:', container.clientHeight, 'px');
    console.log('OffsetHeight:', container.offsetHeight, 'px');
    console.log('Has Vertical Overflow:', hasVerticalScroll);
    console.log('Style overflow-y:', styles.overflowY);
    console.log('Style height:', styles.height);
    console.log('Style max-height:', styles.maxHeight);
    console.log('Style flex:', styles.flex);
    console.log('Children count:', container.children.length);

    // Check if scrollbar is visible
    const scrollbarVisible = hasVerticalScroll && styles.overflowY === 'auto';
    console.log('Scrollbar should be visible:', scrollbarVisible);

    if (scrollbarVisible) {
      console.log('✅ SCROLLBAR IS ACTIVE');

      // Test actual scrolling
      const originalScrollTop = container.scrollTop;
      container.scrollTop = 50;
      const scrollWorking = container.scrollTop > 0;
      container.scrollTop = originalScrollTop;

      console.log('Scroll test:', scrollWorking ? '✅ WORKING' : '❌ NOT WORKING');
    } else {
      console.log('❌ SCROLLBAR NOT VISIBLE');
      console.log('Possible issues:');
      if (!hasVerticalScroll) {
        console.log('  - Content does not exceed container height');
        console.log('  - Need more items in the "Others" category');
      }
      if (styles.overflowY !== 'auto') {
        console.log('  - overflow-y is not set to "auto"');
        console.log('  - CSS might not be applied correctly');
      }
    }

    // Check parent constraints
    const parent = container.parentElement;
    if (parent) {
      const parentStyles = window.getComputedStyle(parent);
      console.log('Parent element:');
      console.log('  - overflow:', parentStyles.overflow);
      console.log('  - max-height:', parentStyles.maxHeight);
      console.log('  - display:', parentStyles.display);
    }

    console.groupEnd();
  });

  // Instructions for manual testing
  console.log('\n📋 Manual Testing Instructions:');
  console.log('1. Navigate to the dashboard');
  console.log('2. Look for the "Cost By GL Account" chart');
  console.log('3. Hover over the "Others" bar (if present)');
  console.log('4. The tooltip should show a scrollable list if there are > 5 GL accounts');
  console.log('5. Try scrolling with mouse wheel or scrollbar');
  console.log('\nIf no "Others" bar is visible, the dataset may not have enough GL accounts.');

  return '✅ Test complete - check console output above';
})();