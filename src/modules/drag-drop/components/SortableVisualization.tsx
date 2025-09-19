/**
 * SortableVisualization Component
 * Makes a visualization item sortable with drag handle
 */

import React, { ReactNode, CSSProperties } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

interface SortableVisualizationProps {
  id: string;
  children: ReactNode;
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

  // If this is the drag overlay, render without drag handle
  if (isDragOverlay) {
    return <div className="relative">{children}</div>;
  }

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="absolute top-4 left-2 z-10 p-1 rounded hover:bg-gray-100 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
        title="Drag to reorder"
      >
        <GripVertical className="h-5 w-5 text-gray-500" />
      </button>

      {/* Visualization Content */}
      {children}
    </div>
  );
}