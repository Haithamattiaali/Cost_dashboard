/**
 * @proceed/components - React UI component library for Proceed SDK
 * Production-ready, customizable components for building revenue dashboards
 */

// Chart Components
export * from './charts';
export { LineChart } from './charts/LineChart';
export { BarChart } from './charts/BarChart';
export { AreaChart } from './charts/AreaChart';
export { PieChart } from './charts/PieChart';
export { GaugeChart } from './charts/GaugeChart';
export { ComposedChart } from './charts/ComposedChart';

// Card Components
export * from './cards';
export { MetricCard } from './cards/MetricCard';
export { StatsCard } from './cards/StatsCard';
export { SummaryCard } from './cards/SummaryCard';
export { ComparisonCard } from './cards/ComparisonCard';

// Layout Components
export * from './layout';
export { Dashboard } from './layout/Dashboard';
export { Sidebar } from './layout/Sidebar';
export { Header } from './layout/Header';
export { Footer } from './layout/Footer';
export { Container } from './layout/Container';
export { Grid } from './layout/Grid';

// Form Components
export * from './forms';
export { Input } from './forms/Input';
export { Select } from './forms/Select';
export { Checkbox } from './forms/Checkbox';
export { RadioGroup } from './forms/RadioGroup';
export { DatePicker } from './forms/DatePicker';
export { FileUpload } from './forms/FileUpload';
export { Form } from './forms/Form';

// Table Components
export * from './tables';
export { DataTable } from './tables/DataTable';
export { SortableTable } from './tables/SortableTable';
export { VirtualizedTable } from './tables/VirtualizedTable';

// Button Components
export * from './buttons';
export { Button } from './buttons/Button';
export { IconButton } from './buttons/IconButton';
export { ButtonGroup } from './buttons/ButtonGroup';

// Feedback Components
export * from './feedback';
export { Alert } from './feedback/Alert';
export { Toast } from './feedback/Toast';
export { Modal } from './feedback/Modal';
export { Spinner } from './feedback/Spinner';
export { Progress } from './feedback/Progress';
export { Skeleton } from './feedback/Skeleton';

// Navigation Components
export * from './navigation';
export { Tabs } from './navigation/Tabs';
export { Breadcrumb } from './navigation/Breadcrumb';
export { Pagination } from './navigation/Pagination';
export { Menu } from './navigation/Menu';

// Data Display Components
export * from './display';
export { Badge } from './display/Badge';
export { Chip } from './display/Chip';
export { Tag } from './display/Tag';
export { Tooltip } from './display/Tooltip';
export { Avatar } from './display/Avatar';

// Utility Components
export * from './utils';
export { ThemeProvider } from './utils/ThemeProvider';
export { ErrorBoundary } from './utils/ErrorBoundary';

// Hooks
export * from './hooks';
export { useTheme } from './hooks/useTheme';
export { useBreakpoint } from './hooks/useBreakpoint';
export { useLocalStorage } from './hooks/useLocalStorage';
export { useDebounce } from './hooks/useDebounce';
export { useIntersectionObserver } from './hooks/useIntersectionObserver';

// Types
export * from './types';

// Version
export const VERSION = '1.0.0';