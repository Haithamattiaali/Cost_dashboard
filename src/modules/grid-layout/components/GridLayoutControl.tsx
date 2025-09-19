/**
 * GridLayoutControl Component
 * Provides controls for adjusting visualization grid width
 */

import React from 'react';
import { GridWidth } from '../types';
import { GRID_WIDTH_OPTIONS } from '../utils/gridUtils';
import { Maximize2, Minimize2 } from 'lucide-react';

interface GridLayoutControlProps {
  currentWidth: GridWidth;
  onChange: (width: GridWidth) => void;
  compact?: boolean;
}

export function GridLayoutControl({
  currentWidth,
  onChange,
  compact = false,
}: GridLayoutControlProps) {
  if (compact) {
    // Compact version with icon buttons
    return (
      <div className="flex items-center space-x-1">
        <button
          onClick={() => onChange(Math.max(1, currentWidth - 1) as GridWidth)}
          disabled={currentWidth === 1}
          className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Increase width"
        >
          <Maximize2 className="h-4 w-4 text-gray-600" />
        </button>
        <span className="text-xs text-gray-500 font-medium px-1">
          {GRID_WIDTH_OPTIONS.find((opt) => opt.value === currentWidth)?.label}
        </span>
        <button
          onClick={() => onChange(Math.min(4, currentWidth + 1) as GridWidth)}
          disabled={currentWidth === 4}
          className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Decrease width"
        >
          <Minimize2 className="h-4 w-4 text-gray-600" />
        </button>
      </div>
    );
  }

  // Full version with labeled buttons
  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm font-medium text-gray-700">Width:</span>
      <div className="flex rounded-lg border border-gray-200 overflow-hidden">
        {GRID_WIDTH_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`
              px-3 py-1.5 text-xs font-medium transition-colors
              ${
                currentWidth === option.value
                  ? 'bg-gradient-to-r from-[#9e1f63] to-[#721548] text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }
              ${option.value !== 1 ? 'border-l border-gray-200' : ''}
            `}
            title={option.description}
          >
            <span className="mr-1">{option.icon}</span>
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}