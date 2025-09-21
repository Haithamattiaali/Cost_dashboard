// Search and filtering utilities for accurate, interactive data table search
import type { FilterFn } from '@tanstack/react-table';

export type Row = { id: string | number; [key: string]: any };

export type Column = {
  id: string;
  accessor: (row: Row) => unknown;
  searchable?: boolean;
  header?: string;
};

export type SearchState = {
  global: string;
  byColumn: Record<string, string>;
};

// Remove Latin diacritics and Arabic tashkeel for accurate matching
export function stripDiacritics(str: string): string {
  return str
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '') // Remove Latin diacritics
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, ''); // Remove Arabic marks/tashkeel
}

// Convert any value to comparable text (normalized)
export function toComparable(value: unknown): string {
  return stripDiacritics(String(value ?? ''))
    .toLowerCase()
    .replace(/[\s,]+/g, ' ') // Collapse spaces and commas
    .trim();
}

// Normalized comparison for progressive search
export const norm = (v: unknown) =>
  stripDiacritics(String(v ?? '')).toLowerCase().replace(/\s+/g, ' ').trim();

// Check if text matches at word boundaries (for progressive shortlisting)
const wordStarts = (text: string, q: string) =>
  new RegExp(`(?:^|\\b|_|-|\\/|\\.)${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(text);

// Progressive text matching: starts-with > word-start > contains
export const matchText = (cell: unknown, query: string) => {
  const t = norm(cell), q = norm(query);
  if (!q) return true;
  // Progressive "shortlisting": starts-with > word start > contains
  return t.startsWith(q) || wordStarts(t, q) || t.includes(q);
};

// TanStack Table filterFn for progressive text filtering
export const progressiveTextFilter: FilterFn<any> = (row, columnId, filterValue) => {
  const cellValue = row.getValue(columnId);
  // Convert numbers to string for progressive matching (e.g., "20" matches "2025")
  const cellText = String(cellValue ?? '');
  const query = String(filterValue ?? '').toLowerCase().trim();

  if (!query) return true;

  const normalizedCell = cellText.toLowerCase();
  // Progressive matching: starts-with > word-boundary > contains
  return normalizedCell.startsWith(query) ||
         wordStarts(normalizedCell, query) ||
         normalizedCell.includes(query);
};

// Extract tokens from search query
export function tokenize(query: string): string[] {
  return toComparable(query).split(/\s+/).filter(Boolean);
}

// Normalize numbers (remove currency symbols, separators)
export function toComparableNumber(value: unknown): string {
  return String(value ?? '').replace(/[^\d.-]/g, '');
}

// Check if a value matches search tokens
function matchesTokens(value: unknown, tokens: string[]): boolean {
  if (tokens.length === 0) return true;

  const text = toComparable(value);
  const numText = toComparableNumber(value);

  return tokens.every(token => {
    const numToken = toComparableNumber(token);
    return (
      text.includes(token) ||
      (numText && numToken && numText.includes(numToken))
    );
  });
}

// Apply search and filters to rows
export function applySearchAndFilters(
  rows: Row[],
  search: SearchState,
  columns: Column[],
  existingFilters?: any
): Row[] {
  if (!rows || rows.length === 0) return [];

  const searchableCols = columns.filter(c => c.searchable !== false);

  // Start with all rows
  let filteredRows = [...rows];

  // Apply existing filters first if any
  if (existingFilters) {
    // Apply any existing filter logic here
    // For now, pass through
  }

  // Apply column-level search
  if (search.byColumn) {
    Object.entries(search.byColumn).forEach(([colId, query]) => {
      const tokens = tokenize(query);
      if (tokens.length === 0) return;

      const column = columns.find(c => c.id === colId);
      const accessor = column?.accessor || ((row: Row) => row[colId]);

      filteredRows = filteredRows.filter(row => {
        const value = accessor(row);
        return matchesTokens(value, tokens);
      });
    });
  }

  // Apply global search (AND across tokens, OR across columns)
  const globalTokens = tokenize(search.global);
  if (globalTokens.length > 0) {
    filteredRows = filteredRows.filter(row => {
      return globalTokens.every(token => {
        // Check if any searchable column contains this token
        return searchableCols.some(col => {
          const value = col.accessor(row);
          return matchesTokens(value, [token]);
        });
      });
    });
  }

  return filteredRows;
}

// Debounce function for search inputs
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

// Get all row IDs from filtered rows
export function getFilteredRowIds(rows: Row[]): Set<string | number> {
  return new Set(rows.map(row => row.id));
}

// Format display value for search (preserve original for display)
export function formatForDisplay(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value);
}

// Check if search state has any active searches
export function hasActiveSearch(search: SearchState): boolean {
  if (search.global && search.global.trim().length > 0) return true;
  if (search.byColumn) {
    return Object.values(search.byColumn).some(val => val && val.trim().length > 0);
  }
  return false;
}

// Clear all searches
export function clearSearchState(): SearchState {
  return {
    global: '',
    byColumn: {}
  };
}

// Update column search
export function updateColumnSearch(
  search: SearchState,
  columnId: string,
  value: string
): SearchState {
  return {
    ...search,
    byColumn: {
      ...search.byColumn,
      [columnId]: value
    }
  };
}

// Remove column search
export function removeColumnSearch(
  search: SearchState,
  columnId: string
): SearchState {
  const { [columnId]: _, ...rest } = search.byColumn;
  return {
    ...search,
    byColumn: rest
  };
}