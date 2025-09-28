/**
 * Utility to ensure tooltip scroll functionality
 * Forces proper scrolling behavior for tooltip containers
 */
import React from 'react';

export const ensureTooltipScroll = (element: HTMLElement | null): void => {
  if (!element) return;

  // Force reflow to ensure styles are applied
  element.style.display = 'none';
  element.offsetHeight; // Trigger reflow
  element.style.display = '';

  // Explicitly set overflow properties
  element.style.overflowY = 'scroll';
  element.style.overflowX = 'hidden';

  // Ensure height constraint is applied
  const computedHeight = window.getComputedStyle(element).maxHeight;
  if (computedHeight && computedHeight !== 'none') {
    element.style.height = computedHeight;
    element.style.maxHeight = computedHeight;
  }

  // Force scrollbar visibility on webkit browsers
  element.style.webkitOverflowScrolling = 'touch';

  // Log for debugging
  console.log('Tooltip scroll debug:', {
    scrollHeight: element.scrollHeight,
    clientHeight: element.clientHeight,
    hasScrollbar: element.scrollHeight > element.clientHeight,
    computedStyles: {
      overflow: window.getComputedStyle(element).overflowY,
      maxHeight: window.getComputedStyle(element).maxHeight,
      height: window.getComputedStyle(element).height
    }
  });
};

/**
 * React hook to ensure tooltip scroll on mount and updates
 */
export const useTooltipScroll = (ref: React.RefObject<HTMLDivElement>, dependency?: any): void => {
  React.useEffect(() => {
    if (ref.current) {
      // Small delay to ensure DOM is fully rendered
      const timeoutId = setTimeout(() => {
        ensureTooltipScroll(ref.current);
      }, 10);

      return () => clearTimeout(timeoutId);
    }
  }, [ref, dependency]);
};