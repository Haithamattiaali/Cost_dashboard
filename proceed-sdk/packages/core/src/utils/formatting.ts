/**
 * Formatting utilities for numbers, currency, dates, and more
 */

export interface FormatOptions {
  locale?: string;
  currency?: string;
  decimals?: number;
  thousandsSeparator?: string;
  decimalSeparator?: string;
  prefix?: string;
  suffix?: string;
  compact?: boolean;
}

/**
 * Format number with locale and custom options
 */
export function formatNumber(
  value: number | string,
  options: FormatOptions = {}
): string {
  const {
    locale = 'en-US',
    decimals = 0,
    compact = false,
    prefix = '',
    suffix = '',
  } = options;

  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(num)) {
    return 'N/A';
  }

  let formatted: string;

  if (compact) {
    formatted = formatCompactNumber(num, locale);
  } else {
    formatted = new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num);
  }

  return `${prefix}${formatted}${suffix}`;
}

/**
 * Format currency value
 */
export function formatCurrency(
  value: number | string,
  options: FormatOptions = {}
): string {
  const {
    locale = 'en-US',
    currency = 'USD',
    decimals = 2,
    compact = false,
  } = options;

  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(num)) {
    return 'N/A';
  }

  if (compact && Math.abs(num) >= 1000) {
    const compactValue = formatCompactNumber(num, locale);
    const currencySymbol = getCurrencySymbol(currency, locale);
    return `${currencySymbol}${compactValue}`;
  }

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

/**
 * Format percentage value
 */
export function formatPercentage(
  value: number | string,
  options: FormatOptions = {}
): string {
  const { locale = 'en-US', decimals = 1 } = options;

  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(num)) {
    return 'N/A';
  }

  // Check if value is already in percentage form (0-100) or decimal form (0-1)
  const percentValue = Math.abs(num) <= 1 ? num : num / 100;

  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(percentValue);
}

/**
 * Format compact number (1K, 1M, 1B, etc.)
 */
export function formatCompactNumber(value: number, locale: string = 'en-US'): string {
  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  if (absValue >= 1e12) {
    return sign + (absValue / 1e12).toFixed(1) + 'T';
  } else if (absValue >= 1e9) {
    return sign + (absValue / 1e9).toFixed(1) + 'B';
  } else if (absValue >= 1e6) {
    return sign + (absValue / 1e6).toFixed(1) + 'M';
  } else if (absValue >= 1e3) {
    return sign + (absValue / 1e3).toFixed(1) + 'K';
  }

  return new Intl.NumberFormat(locale).format(value);
}

/**
 * Get currency symbol for a currency code
 */
export function getCurrencySymbol(currency: string, locale: string = 'en-US'): string {
  try {
    const formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

    return formatter.format(0).replace(/[0-9]/g, '').trim();
  } catch {
    // Fallback for common currencies
    const symbols: Record<string, string> = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      JPY: '¥',
      CNY: '¥',
      INR: '₹',
      KRW: '₩',
      AUD: 'A$',
      CAD: 'C$',
    };

    return symbols[currency] || currency;
  }
}

/**
 * Format bytes to human readable format
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Format duration in milliseconds to human readable format
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Format date to locale string
 */
export function formatDate(
  date: Date | string | number,
  format: string = 'MM/dd/yyyy',
  locale: string = 'en-US'
): string {
  const d = date instanceof Date ? date : new Date(date);

  if (isNaN(d.getTime())) {
    return 'Invalid Date';
  }

  // Simple format replacements
  const formatMap: Record<string, Intl.DateTimeFormatOptions> = {
    'MM/dd/yyyy': { month: '2-digit', day: '2-digit', year: 'numeric' },
    'dd/MM/yyyy': { day: '2-digit', month: '2-digit', year: 'numeric' },
    'yyyy-MM-dd': { year: 'numeric', month: '2-digit', day: '2-digit' },
    'MMM dd, yyyy': { month: 'short', day: 'numeric', year: 'numeric' },
    'MMMM dd, yyyy': { month: 'long', day: 'numeric', year: 'numeric' },
    short: { month: 'short', day: 'numeric' },
    medium: { month: 'short', day: 'numeric', year: 'numeric' },
    long: { month: 'long', day: 'numeric', year: 'numeric' },
    full: { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' },
  };

  const options = formatMap[format] || formatMap['MM/dd/yyyy'];

  return new Intl.DateTimeFormat(locale, options).format(d);
}

/**
 * Format time to locale string
 */
export function formatTime(
  date: Date | string | number,
  format: '12h' | '24h' = '12h',
  locale: string = 'en-US'
): string {
  const d = date instanceof Date ? date : new Date(date);

  if (isNaN(d.getTime())) {
    return 'Invalid Time';
  }

  const options: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: format === '12h',
  };

  return new Intl.DateTimeFormat(locale, options).format(d);
}

/**
 * Format relative time (e.g., "2 hours ago", "in 3 days")
 */
export function formatRelativeTime(
  date: Date | string | number,
  locale: string = 'en-US'
): string {
  const d = date instanceof Date ? date : new Date(date);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  if (Math.abs(diffDay) >= 30) {
    return rtf.format(Math.floor(diffDay / 30), 'month');
  } else if (Math.abs(diffDay) >= 7) {
    return rtf.format(Math.floor(diffDay / 7), 'week');
  } else if (Math.abs(diffDay) >= 1) {
    return rtf.format(diffDay, 'day');
  } else if (Math.abs(diffHour) >= 1) {
    return rtf.format(diffHour, 'hour');
  } else if (Math.abs(diffMin) >= 1) {
    return rtf.format(diffMin, 'minute');
  } else {
    return rtf.format(diffSec, 'second');
  }
}

/**
 * Truncate string with ellipsis
 */
export function truncate(str: string, maxLength: number, suffix: string = '...'): string {
  if (str.length <= maxLength) {
    return str;
  }

  return str.slice(0, maxLength - suffix.length) + suffix;
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  return formatBytes(bytes, 1);
}

/**
 * Format plural
 */
export function pluralize(count: number, singular: string, plural?: string): string {
  if (count === 1) {
    return `${count} ${singular}`;
  }

  return `${count} ${plural || singular + 's'}`;
}

/**
 * Format list with proper conjunctions
 */
export function formatList(
  items: string[],
  conjunction: 'and' | 'or' = 'and',
  locale: string = 'en-US'
): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];

  if (typeof Intl.ListFormat !== 'undefined') {
    return new Intl.ListFormat(locale, {
      style: 'long',
      type: conjunction === 'and' ? 'conjunction' : 'disjunction',
    }).format(items);
  }

  // Fallback for older browsers
  if (items.length === 2) {
    return `${items[0]} ${conjunction} ${items[1]}`;
  }

  const allButLast = items.slice(0, -1).join(', ');
  const last = items[items.length - 1];
  return `${allButLast}, ${conjunction} ${last}`;
}