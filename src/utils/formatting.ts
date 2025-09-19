export function formatCurrency(value: number, compact: boolean = false): string {
  if (compact && value >= 1000000) {
    return `SAR ${(value / 1000000).toFixed(1)}M`;
  }
  if (compact && value >= 1000) {
    return `SAR ${(value / 1000).toFixed(1)}K`;
  }
  return new Intl.NumberFormat('en-SA', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-SA').format(value);
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d);
}