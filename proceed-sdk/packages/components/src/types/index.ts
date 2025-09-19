/**
 * Type definitions for Proceed Components
 */

import { ReactNode, CSSProperties } from 'react';

// Chart Types
export interface ChartConfig {
  theme?: 'light' | 'dark';
  animate?: boolean;
  showGrid?: boolean;
  showTooltip?: boolean;
  showLegend?: boolean;
  margins?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
  colors?: string[];
  formatters?: {
    value?: (value: number) => string;
    label?: (label: string) => string;
  };
}

export interface DataPoint {
  [key: string]: any;
}

export interface LineConfig {
  dataKey: string;
  name?: string;
  color?: string;
  type?: 'basis' | 'basisClosed' | 'basisOpen' | 'linear' | 'linearClosed' | 'natural' | 'monotone' | 'step';
  strokeWidth?: number;
  strokeDasharray?: string;
  dashed?: boolean;
  showDots?: boolean;
  showActiveDot?: boolean;
  format?: 'currency' | 'percentage' | 'number' | 'date';
  hide?: boolean;
}

export interface AxisConfig {
  dataKey?: string;
  format?: 'currency' | 'percentage' | 'number' | 'date';
  angle?: number;
  textAnchor?: 'start' | 'middle' | 'end';
  height?: number;
  width?: number;
  hide?: boolean;
  showGridLines?: boolean;
  domain?: [number | 'auto' | 'dataMin' | 'dataMax', number | 'auto' | 'dataMin' | 'dataMax'];
}

// Card Types
export interface CardProps {
  title?: string;
  subtitle?: string;
  value?: string | number;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon?: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
  loading?: boolean;
  error?: Error | null;
  className?: string;
  onClick?: () => void;
}

// Form Types
export interface FormField {
  name: string;
  label?: string;
  type: 'text' | 'number' | 'email' | 'password' | 'select' | 'checkbox' | 'radio' | 'date' | 'file';
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  value?: any;
  defaultValue?: any;
  options?: SelectOption[];
  validation?: ValidationRule[];
  onChange?: (value: any) => void;
  onBlur?: () => void;
  onFocus?: () => void;
}

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
  icon?: ReactNode;
}

export interface ValidationRule {
  type: 'required' | 'min' | 'max' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
  value?: any;
  message: string;
  validate?: (value: any) => boolean;
}

// Table Types
export interface TableColumn<T = any> {
  key: string;
  header: string | ReactNode;
  accessor?: string | ((row: T) => any);
  sortable?: boolean;
  filterable?: boolean;
  width?: number | string;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, row: T, index: number) => ReactNode;
  headerClassName?: string;
  cellClassName?: string | ((row: T) => string);
}

export interface TableProps<T = any> {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  error?: Error | null;
  emptyMessage?: string;
  sortable?: boolean;
  filterable?: boolean;
  paginated?: boolean;
  pageSize?: number;
  selectable?: boolean;
  onRowClick?: (row: T, index: number) => void;
  onSelectionChange?: (selected: T[]) => void;
  className?: string;
  striped?: boolean;
  hover?: boolean;
  compact?: boolean;
}

// Button Types
export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'outline' | 'ghost';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  children?: ReactNode;
}

// Layout Types
export interface LayoutProps {
  children: ReactNode;
  sidebar?: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  className?: string;
  sidebarCollapsed?: boolean;
  onSidebarToggle?: () => void;
}

export interface GridProps {
  children: ReactNode;
  cols?: number | { xs?: number; sm?: number; md?: number; lg?: number; xl?: number };
  gap?: number | string;
  className?: string;
}

// Theme Types
export interface Theme {
  colors: {
    primary: string;
    secondary: string;
    success: string;
    danger: string;
    warning: string;
    info: string;
    light: string;
    dark: string;
    background: string;
    surface: string;
    text: string;
    textLight: string;
    border: string;
  };
  fonts: {
    sans: string;
    serif: string;
    mono: string;
  };
  sizes: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  borderRadius: {
    none: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    full: string;
  };
  shadows: {
    none: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  transitions: {
    fast: string;
    normal: string;
    slow: string;
  };
}

// Modal Types
export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnBackdrop?: boolean;
  closeOnEsc?: boolean;
  className?: string;
}

// Toast/Alert Types
export interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  position?: 'top' | 'bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  onClose?: () => void;
}

export interface AlertProps {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  icon?: ReactNode;
  closeable?: boolean;
  onClose?: () => void;
  className?: string;
}

// Navigation Types
export interface TabItem {
  key: string;
  label: string;
  icon?: ReactNode;
  content: ReactNode;
  disabled?: boolean;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: ReactNode;
  onClick?: () => void;
}

export interface MenuItem {
  key: string;
  label: string;
  icon?: ReactNode;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  children?: MenuItem[];
}

// Pagination Types
export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize?: number;
  totalItems?: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  showPageSize?: boolean;
  pageSizeOptions?: number[];
  className?: string;
}