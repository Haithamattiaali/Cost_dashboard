/**
 * API Configuration
 * Dynamically determines API URL based on environment
 */

// Determine API URL based on environment
const getApiUrl = (): string => {
  // Check for environment variable first (set during build)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // In production, use the production API URL
  if (import.meta.env.PROD) {
    return 'https://proceed-cost-dashboard-api.onrender.com';
  }

  // In development, use proxy (configured in vite.config.ts)
  return '';
};

export const API_CONFIG = {
  baseUrl: getApiUrl(),
  endpoints: {
    // Dashboard
    metrics: '/api/costs/dashboard-metrics',
    filters: '/api/filters/options',

    // Upload
    upload: '/api/upload',
    uploadStatus: '/api/upload/status',

    // Comparisons
    comparisons: '/api/comparisons',

    // Data playground
    playground: '/api/playground',

    // Health
    health: '/api/health',
  },

  // Request configuration
  requestConfig: {
    timeout: 30000, // 30 seconds
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json',
    },
  },
};

// Helper function to build full API URL
export const buildApiUrl = (endpoint: string): string => {
  const baseUrl = API_CONFIG.baseUrl;

  // If endpoint already includes /api, don't add baseUrl in development
  if (!baseUrl && endpoint.startsWith('/api')) {
    return endpoint;
  }

  return `${baseUrl}${endpoint}`;
};

// Export environment info for debugging
export const ENV_INFO = {
  mode: import.meta.env.MODE,
  isProd: import.meta.env.PROD,
  isDev: import.meta.env.DEV,
  apiUrl: API_CONFIG.baseUrl,
};