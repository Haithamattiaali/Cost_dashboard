import { buildApiUrl } from './config';

const API_BASE_URL = '/api';

export async function fetchDashboardMetrics(filters?: any) {
  const params = new URLSearchParams();
  if (filters) {
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== '') {
        params.append(key, filters[key]);
      }
    });
  }
  const response = await fetch(buildApiUrl(`${API_BASE_URL}/costs/dashboard?${params}`), {
    credentials: 'include'
  });
  if (!response.ok) throw new Error('Failed to fetch dashboard metrics');
  const data = await response.json();
  return data.metrics;
}

export async function fetchFilterOptions() {
  const response = await fetch(buildApiUrl(`${API_BASE_URL}/filters/options`), {
    credentials: 'include'
  });
  if (!response.ok) throw new Error('Failed to fetch filter options');
  const data = await response.json();
  return data.options;
}

export async function fetchCostData(filters?: any) {
  const params = new URLSearchParams();
  if (filters) {
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== '') {
        params.append(key, filters[key]);
      }
    });
  }
  const response = await fetch(buildApiUrl(`${API_BASE_URL}/costs?${params}`), {
    credentials: 'include'
  });
  if (!response.ok) throw new Error('Failed to fetch cost data');
  return response.json();
}

export async function fetchAggregatedData(dimension: string) {
  const response = await fetch(buildApiUrl(`${API_BASE_URL}/costs/aggregate/${dimension}`));
  if (!response.ok) throw new Error('Failed to fetch aggregated data');
  return response.json();
}

export async function compareQuarters(params: {
  currentYear: number;
  currentQuarter: string;
  previousYear: number;
  previousQuarter: string;
}) {
  const queryParams = new URLSearchParams(params as any);
  const response = await fetch(buildApiUrl(`${API_BASE_URL}/comparisons/quarters?${queryParams}`));
  if (!response.ok) throw new Error('Failed to compare quarters');
  return response.json();
}

export async function compareYearOverYear(currentYear: number, previousYear?: number) {
  const params = new URLSearchParams({
    currentYear: currentYear.toString(),
    ...(previousYear && { previousYear: previousYear.toString() })
  });
  const response = await fetch(buildApiUrl(`${API_BASE_URL}/comparisons/year-over-year?${params}`));
  if (!response.ok) throw new Error('Failed to compare years');
  return response.json();
}

export async function uploadExcelFile(file: File, clearExisting: boolean = false) {
  const formData = new FormData();
  formData.append('file', file);
  if (clearExisting) {
    formData.append('clearExisting', 'true');
  }

  try {
    console.log('[Upload] Starting file upload...');
    console.log('[Upload] File details:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    const apiUrl = buildApiUrl(`${API_BASE_URL}/upload/excel`);
    console.log('[Upload] API URL:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'POST',
      body: formData,
      credentials: 'include', // Important for CORS with credentials
      // Don't set Content-Type header - browser will set it with boundary for multipart/form-data
    });

    console.log('[Upload] Response status:', response.status);
    console.log('[Upload] Response headers:', response.headers);

    if (!response.ok) {
      let errorMessage = `Upload failed with status ${response.status}`;

      try {
        const error = await response.json();
        errorMessage = error.error || error.message || errorMessage;
        console.error('[Upload] Server error:', error);
      } catch (parseError) {
        console.error('[Upload] Failed to parse error response:', parseError);
        // If we can't parse the JSON, try to get text
        try {
          const errorText = await response.text();
          console.error('[Upload] Error text:', errorText);
          if (errorText) {
            errorMessage = errorText;
          }
        } catch (textError) {
          console.error('[Upload] Failed to get error text:', textError);
        }
      }

      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log('[Upload] Success:', result);
    return result;

  } catch (error) {
    console.error('[Upload] Network or fetch error:', error);

    // Check if it's a network error
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('Network error: Unable to reach the server. Please check if the API is running and CORS is configured.');
    }

    throw error;
  }
}

export async function getUploadStatus() {
  const response = await fetch(buildApiUrl(`${API_BASE_URL}/upload/status`), {
    credentials: 'include'
  });
  if (!response.ok) throw new Error('Failed to get upload status');
  return response.json();
}