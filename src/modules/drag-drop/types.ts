/**
 * Type definitions for drag-drop module
 */

import { ReactNode } from 'react';

export interface DragDropConfig {
  items: string[];
  onReorder: (items: string[]) => void;
  dragHandleClassName?: string;
  activeOpacity?: number;
}

export interface SortableItemProps {
  id: string;
  children: ReactNode;
  dragHandleClassName?: string;
  isOverlay?: boolean;
}