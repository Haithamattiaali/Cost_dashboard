/**
 * Default configuration values for the Proceed SDK
 */

import { SDKConfig } from './types';

export const defaultConfig: SDKConfig = {
  name: 'Proceed SDK',
  version: '1.0.0',
  environment: 'development',

  api: {
    baseUrl: 'http://localhost:3001/api',
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000,
    headers: {},
    healthCheckInterval: 30000,
    healthCheckEndpoint: '/health',
  },

  database: {
    type: 'sqlite',
    connectionString: undefined,
    host: undefined,
    port: undefined,
    database: undefined,
    username: undefined,
    password: undefined,
    ssl: false,
    poolSize: 10,
    timeout: 5000,
    retryAttempts: 3,
    retryDelay: 1000,
    migrations: {
      enabled: true,
      directory: './migrations',
      tableName: 'migrations',
    },
  },

  cache: {
    type: 'memory',
    host: undefined,
    port: undefined,
    password: undefined,
    ttl: 300000, // 5 minutes
    maxSize: 100,
    evictionPolicy: 'lru',
    namespace: 'proceed',
  },

  state: {
    type: 'memory',
    namespace: 'proceed-state',
    persistenceEnabled: false,
    encryptionEnabled: false,
    encryptionKey: undefined,
    syncInterval: 5000,
  },

  logging: {
    level: 'info',
    format: 'json',
    output: 'console',
    filePath: undefined,
    maxFileSize: 10485760, // 10MB
    maxFiles: 5,
    timestamp: true,
    colorize: false,
  },

  metrics: {
    enabled: false,
    provider: 'console',
    endpoint: undefined,
    apiKey: undefined,
    interval: 60000, // 1 minute
    tags: {},
    includeSystemMetrics: true,
    includeProcessMetrics: true,
  },

  ui: {
    theme: 'light',
    primaryColor: '#1E40AF',
    secondaryColor: '#DB2777',
    fontFamily: 'Inter, system-ui, sans-serif',
    borderRadius: 'md',
    animationsEnabled: true,
    compactMode: false,
    locale: 'en-US',
    dateFormat: 'MM/dd/yyyy',
    timeFormat: 'HH:mm:ss',
    numberFormat: {
      decimals: 2,
      thousandsSeparator: ',',
      decimalSeparator: '.',
      currencySymbol: '$',
      currencyPosition: 'before',
    },
  },

  features: {
    dashboard: true,
    analytics: true,
    reporting: true,
    export: true,
    import: true,
    notifications: false,
    collaboration: false,
    audit: false,
    experimental: false,
  },

  security: {
    authEnabled: false,
    authProvider: undefined,
    jwtSecret: undefined,
    jwtExpiration: '24h',
    corsEnabled: true,
    corsOrigins: ['*'],
    rateLimiting: {
      enabled: false,
      windowMs: 60000,
      maxRequests: 100,
    },
    encryption: {
      algorithm: 'aes-256-gcm',
      keyDerivation: 'pbkdf2',
      iterations: 100000,
    },
  },

  performance: {
    lazyLoading: true,
    virtualScrolling: true,
    debounceMs: 300,
    throttleMs: 100,
    maxConcurrentRequests: 6,
    requestQueueSize: 100,
    compressionEnabled: true,
    cacheStrategy: 'memory',
  },

  custom: {},
};

// Environment-specific presets
export const presets = {
  minimal: {
    features: {
      dashboard: true,
      analytics: false,
      reporting: false,
      export: false,
      import: false,
      notifications: false,
      collaboration: false,
      audit: false,
      experimental: false,
    },
    metrics: {
      enabled: false,
    },
    logging: {
      level: 'error' as const,
    },
  },

  development: {
    environment: 'development' as const,
    logging: {
      level: 'debug' as const,
      format: 'pretty' as const,
      colorize: true,
    },
    features: {
      experimental: true,
    },
    security: {
      corsOrigins: ['http://localhost:3000', 'http://localhost:5173'],
    },
  },

  production: {
    environment: 'production' as const,
    logging: {
      level: 'warn' as const,
      format: 'json' as const,
      output: 'both' as const,
      filePath: './logs/proceed.log',
    },
    metrics: {
      enabled: true,
      provider: 'prometheus' as const,
    },
    security: {
      authEnabled: true,
      corsEnabled: true,
      corsOrigins: [],
      rateLimiting: {
        enabled: true,
        windowMs: 60000,
        maxRequests: 100,
      },
    },
    performance: {
      compressionEnabled: true,
      cacheStrategy: 'persistent' as const,
    },
    features: {
      experimental: false,
      audit: true,
    },
  },

  full: {
    features: {
      dashboard: true,
      analytics: true,
      reporting: true,
      export: true,
      import: true,
      notifications: true,
      collaboration: true,
      audit: true,
      experimental: true,
    },
    metrics: {
      enabled: true,
    },
    logging: {
      level: 'debug' as const,
      output: 'both' as const,
    },
  },
};

/**
 * Get configuration preset
 */
export function getPreset(name: keyof typeof presets): Partial<SDKConfig> {
  return presets[name] || {};
}

/**
 * Merge preset with base configuration
 */
export function applyPreset(base: SDKConfig, presetName: keyof typeof presets): SDKConfig {
  const preset = getPreset(presetName);
  return deepMergeConfig(base, preset);
}

/**
 * Deep merge configuration objects
 */
function deepMergeConfig(base: any, override: any): any {
  const result = { ...base };

  for (const key in override) {
    if (override.hasOwnProperty(key)) {
      if (override[key] && typeof override[key] === 'object' && !Array.isArray(override[key])) {
        result[key] = deepMergeConfig(base[key] || {}, override[key]);
      } else {
        result[key] = override[key];
      }
    }
  }

  return result;
}