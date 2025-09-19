const API_BASE_URL = '/api';

export async function fetchDashboardMetrics(filters?: any) {
  const params = new URLSearchParams(filters);
  const response = await fetch(`${API_BASE_URL}/costs/dashboard?${params}`);
  if (!response.ok) throw new Error('Failed to fetch dashboard metrics');
  const data = await response.json();
  return data.metrics;
}

export async function fetchFilterOptions() {
  const response = await fetch(`${API_BASE_URL}/filters/options`);
  if (!response.ok) throw new Error('Failed to fetch filter options');
  const data = await response.json();
  return data.options;
}

export async function fetchCostData(filters?: any) {
  const params = new URLSearchParams(filters);
  const response = await fetch(`${API_BASE_URL}/costs?${params}`);
  if (!response.ok) throw new Error('Failed to fetch cost data');
  return response.json();
}

export async function fetchAggregatedData(dimension: string) {
  const response = await fetch(`${API_BASE_URL}/costs/aggregate/${dimension}`);
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
  const response = await fetch(`${API_BASE_URL}/comparisons/quarters?${queryParams}`);
  if (!response.ok) throw new Error('Failed to compare quarters');
  return response.json();
}

export async function compareYearOverYear(currentYear: number, previousYear?: number) {
  const params = new URLSearchParams({
    currentYear: currentYear.toString(),
    ...(previousYear && { previousYear: previousYear.toString() })
  });
  const response = await fetch(`${API_BASE_URL}/comparisons/year-over-year?${params}`);
  if (!response.ok) throw new Error('Failed to compare years');
  return response.json();
}

export async function uploadExcelFile(file: File, clearExisting: boolean = false) {
  const formData = new FormData();
  formData.append('file', file);
  if (clearExisting) {
    formData.append('clearExisting', 'true');
  }

  const response = await fetch(`${API_BASE_URL}/upload/excel`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to upload file');
  }

  return response.json();
}

export async function getUploadStatus() {
  const response = await fetch(`${API_BASE_URL}/upload/status`);
  if (!response.ok) throw new Error('Failed to get upload status');
  return response.json();
}