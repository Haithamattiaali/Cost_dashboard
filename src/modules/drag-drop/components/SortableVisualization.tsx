/**
 * SortableVisualization Component
 * Makes a visualization item sortable with drag handle
 */

import React, { ReactNode, CSSProperties } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableVisualizationProps {
  id: string;
  children: (dragHandleProps?: { attributes?: any; listeners?: any }) => ReactNode;
  isDragOverlay?: boolean;
}

export function SortableVisualization({
  id,
  children,
  isDragOverlay = false,
}: SortableVisualizationProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? 'grabbing' : 'default',
  };

  // If this is the drag overlay, render without drag handle props
  if (isDragOverlay) {
    return <div className="relative">{typeof children === 'function' ? children() : children}</div>;
  }

  // Pass drag handle props to children through render prop pattern
  const dragHandleProps = {
    attributes,
    listeners,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      {/* Render children with drag handle props */}
      {typeof children === 'function' ? children(dragHandleProps) : children}
    </div>
  );
}