/**
 * VirtualizedGrid Component
 * Virtualizes grid items for performance with many visualizations
 */

import React, { ReactNode, useMemo } from 'react';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import { useLazyLoad } from '../hooks/useLazyLoad';

interface VirtualizedGridItemProps {
  children: ReactNode;
  index: number;
  enableVirtualization: boolean;
}

export function VirtualizedGridItem({
  children,
  index,
  enableVirtualization,
}: VirtualizedGridItemProps) {
  const { ref, isVisible } = useIntersectionObserver({
    enabled: enableVirtualization,
    threshold: 0.01,
    rootMargin: '200px',
  });

  const [shouldRender] = useLazyLoad(
    isVisible || !enableVirtualization,
    index * 50 // Stagger loading by 50ms per item
  );

  if (!enableVirtualization) {
    return <>{children}</>;
  }

  return (
    <div ref={ref} className="min-h-[300px]">
      {shouldRender ? (
        children
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-[300px] animate-pulse">
          <div className="p-6">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-100 rounded w-1/2"></div>
            <div className="mt-8 h-48 bg-gray-100 rounded"></div>
          </div>
        </div>
      )}
    </div>
  );
}

interface VirtualizedGridProps {
  items: any[];
  renderItem: (item: any, index: number) => ReactNode;
  threshold?: number;
}

export function VirtualizedGrid({
  items,
  renderItem,
  threshold = 10,
}: VirtualizedGridProps) {
  const enableVirtualization = items.length > threshold;

  const gridItems = useMemo(() => {
    return items.map((item, index) => (
      <VirtualizedGridItem
        key={item.id || index}
        index={index}
        enableVirtualization={enableVirtualization}
      >
        {renderItem(item, index)}
      </VirtualizedGridItem>
    ));
  }, [items, renderItem, enableVirtualization]);

  return <>{gridItems}</>;
}