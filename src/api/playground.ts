const API_BASE_URL = '/api';

export interface PlaygroundDataResponse {
  success: boolean;
  data: Array<{
    name: string;
    value: number;
  }>;
  dimension: string;
  measure: string;
  totalRows: number;
}

/**
 * Fetch aggregated data for playground visualization
 * @param dimension - The dimension to group by
 * @param measure - The measure to aggregate
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