/**
 * Script to verify tooltip scroll functionality
 * Run this in the browser console when hovering over the "Others" column
 */

function verifyTooltipScroll() {
  // Find the tooltip scroll container
  const scrollContainer = document.querySelector('.others-tooltip-scroll');

  if (!scrollContainer) {
    console.error('❌ Tooltip scroll container not found. Make sure you are hovering over the "Others" column.');
    return false;
  }

  console.log('=== TOOLTIP SCROLL DIAGNOSIS ===');

  // 1. Check computed styles
  const computedStyles = window.getComputedStyle(scrollContainer);
  console.log('1. Computed Styles:', {
    overflow: computedStyles.overflow,
    overflowY: computedStyles.overflowY,
    overflowX: computedStyles.overflowX,
    height: computedStyles.height,
    maxHeight: computedStyles.maxHeight,
    minHeight: computedStyles.minHeight,
    display: computedStyles.display,
    position: computedStyles.position
  });

  // 2. Check dimensions
  const hasScrollbar = scrollContainer.scrollHeight > scrollContainer.clientHeight;
  console.log('2. Dimensions:', {
    scrollHeight: scrollContainer.scrollHeight,
    clientHeight: scrollContainer.clientHeight,
    offsetHeight: scrollContainer.offsetHeight,
    hasScrollbar: hasScrollbar,
    scrollbarVisible: hasScrollbar ? '✅ YES' : '❌ NO'
  });

  // 3. Check parent container
  const parentContainer = scrollContainer.parentElement;
  const parentStyles = window.getComputedStyle(parentContainer);
  console.log('3. Parent Container:', {
    display: parentStyles.display,
    flexDirection: parentStyles.flexDirection,
    overflow: parentStyles.overflow,
    height: parentStyles.height,
    maxHeight: parentStyles.maxHeight
  });

  // 4. Test scroll functionality
  const originalScrollTop = scrollContainer.scrollTop;
  scrollContainer.scrollTop = 10;
  const canScroll = scrollContainer.scrollTop !== originalScrollTop;
  scrollContainer.scrollTop = originalScrollTop;

  console.log('4. Scroll Test:', {
    canScroll: canScroll ? '✅ YES' : '❌ NO',
    maxScroll: scrollContainer.scrollHeight - scrollContainer.clientHeight
  });

  // 5. Check CSS classes
  console.log('5. CSS Classes:', scrollContainer.className);

  // 6. Check inline styles
  console.log('6. Inline Styles:', scrollContainer.style.cssText);

  // 7. Diagnosis
  console.log('\n=== DIAGNOSIS ===');

  const issues = [];

  if (computedStyles.overflowY !== 'scroll' && computedStyles.overflowY !== 'auto') {
    issues.push('❌ overflow-y is not set to scroll or auto');
  }

  if (!hasScrollbar) {
    issues.push('❌ Content height does not exceed container height');
  }

  if (!canScroll) {
    issues.push('❌ Container cannot be scrolled programmatically');
  }

  if (computedStyles.height === 'auto' && computedStyles.maxHeight === 'none') {
    issues.push('❌ No height constraint applied');
  }

  if (parentStyles.overflow === 'hidden') {
    issues.push('❌ Parent container has overflow: hidden');
  }

  if (issues.length === 0) {
    console.log('✅ Tooltip scroll is working correctly!');
    return true;
  } else {
    console.log('Issues found:');
    issues.forEach(issue => console.log(issue));
    return false;
  }
}

// Auto-run if tooltip is visible
setTimeout(() => {
  verifyTooltipScroll();
}, 100);

console.log('Tooltip Scroll Verifier loaded. Hover over the "Others" column and the diagnostic will run automatically.');