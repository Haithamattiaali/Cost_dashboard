const API_BASE_URL = '/api';

export interface PlaygroundDataResponse {
  success: boolean;
  data: Array<{
    name: string;
    value?: number; // For backward compatibility with single measure
    [measureKey: string]: string | number | undefined; // Support multiple measure values
  }>;
  dimension: string;
  measure?: string; // For backward compatibility
  measures?: string[]; // New: array of measures
  totalRows: number;
}

/**
 * Fetch aggregated data for playground visualization
 * @param dimension - The dimension to group by
 * @param measure - The measure to aggregate (deprecated, use measures)
 * @returns Aggregated data for visualization
 */
export async function fetchPlaygroundData(
  dimension: string,
  measure: string
): Promise<PlaygroundDataResponse> {
  const params = new URLSearchParams({
    dimension,
    measure,
  });

  const response = await fetch(`${API_BASE_URL}/playground/aggregate?${params}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch data' }));
    throw new Error(error.error || 'Failed to fetch playground data');
  }

  return response.json();
}

/**
 * Fetch aggregated data for multiple measures
 * @param dimension - The dimension to group by
 * @param measures - Array of measures to aggregate
 * @returns Aggregated data for visualization with multiple measures
 */
export async function fetchMultiMeasureData(
  dimension: string,
  measures: string[]
): Promise<PlaygroundDataResponse> {
  const params = new URLSearchParams({
    dimension,
    measures: measures.join(','), // Send as comma-separated string
  });

  const response = await fetch(`${API_BASE_URL}/playground/aggregate-multi?${params}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch data' }));
    throw new Error(error.error || 'Failed to fetch multi-measure data');
  }

  return response.json();
}

/**
 * Fetch filtered playground data with custom filters
 * @param dimension - The dimension to group by
 * @param measure - The measure to aggregate
 * @param filters - Additional filters to apply
 * @returns Filtered aggregated data
 */
export async function fetchFilteredPlaygroundData(
  dimension: string,
  measure: string,
  filters?: Record<string, any>
): Promise<PlaygroundDataResponse> {
  const params = new URLSearchParams({
    dimension,
    measure,
    ...(filters || {}),
  });

  const response = await fetch(`${API_BASE_URL}/playground/aggregate?${params}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch data' }));
    throw new Error(error.error || 'Failed to fetch filtered playground data');
  }

  return response.json();
}

/**
 * Fetch filtered data for multiple measures
 * @param dimension - The dimension to group by
 * @param measures - Array of measures to aggregate
 * @param filters - Additional filters to apply
 * @returns Filtered aggregated data with multiple measures
 */
export async function fetchFilteredMultiMeasureData(
  dimension: string,
  measures: string[],
  filters?: Record<string, any>
): Promise<PlaygroundDataResponse> {
  const params = new URLSearchParams({
    dimension,
    measures: measures.join(','),
    ...(filters || {}),
  });

  const response = await fetch(`${API_BASE_URL}/playground/aggregate-multi?${params}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch data' }));
    throw new Error(error.error || 'Failed to fetch filtered multi-measure data');
  }

  return response.json();
}