/**
 * Grid utilities for managing visualization layouts
 */

import { GridWidth, GridWidthOption } from '../types';

/**
 * Grid width options for visualization layout
 */
export const GRID_WIDTH_OPTIONS: GridWidthOption[] = [
  {
    value: 1,
    label: 'Full',
    icon: '⬜',
    description: 'Full width (12 columns)',
  },
  {
    value: 2,
    label: 'Half',
    icon: '◻◻',
    description: 'Half width (6 columns)',
  },
  {
    value: 3,
    label: 'Third',
    icon: '▫▫▫',
    description: 'One third width (4 columns)',
  },
  {
    value: 4,
    label: 'Quarter',
    icon: '▪▪▪▪',
    description: 'One quarter width (3 columns)',
  },
];

/**
 * Get the appropriate CSS class for a given grid width
 */
export function getGridClassName(width: GridWidth): string {
  switch (width) {
    case 1:
      return 'col-span-12';
    case 2:
      return 'col-span-12 lg:col-span-6';
    case 3:
      return 'col-span-12 md:col-span-6 lg:col-span-4';
    case 4:
      return 'col-span-12 sm:col-span-6 md:col-span-4 lg:col-span-3';
    default:
      return 'col-span-12';
  }
}

/**
 * Calculate optimal grid width based on container size and item count
 */
export function calculateOptimalGridWidth(
  containerWidth: number,
  itemCount: number
): GridWidth {
  if (itemCount <= 1) return 1;
  if (itemCount === 2) return 2;

  if (containerWidth >= 1536) {
    // 2xl screens
    if (itemCount <= 4) return Math.min(itemCount, 4) as GridWidth;
    return 4;
  } else if (containerWidth >= 1280) {
    // xl screens
    if (itemCount <= 3) return Math.min(itemCount, 3) as GridWidth;
    return 3;
  } else if (containerWidth >= 1024) {
    // lg screens
    if (itemCount <= 2) return 2;
    return 3;
  } else {
    // md and smaller screens
    return 1;
  }
}