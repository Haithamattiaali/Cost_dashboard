/**
 * Configuration schemas for the Proceed SDK
 */

import { z } from 'zod';

// API Configuration Schema
export const APIConfigSchema = z.object({
  baseUrl: z.string().default('http://localhost:3001/api'),
  timeout: z.number().min(1000).max(60000).default(30000),
  retryAttempts: z.number().min(0).max(5).default(3),
  retryDelay: z.number().min(100).max(5000).default(1000),
  headers: z.record(z.string()).default({}),
  healthCheckInterval: z.number().min(5000).max(300000).default(30000),
  healthCheckEndpoint: z.string().default('/health'),
});

// Database Configuration Schema
export const DatabaseConfigSchema = z.object({
  type: z.enum(['sqlite', 'postgres', 'mysql', 'mongodb']).default('sqlite'),
  connectionString: z.string().optional(),
  host: z.string().optional(),
  port: z.number().optional(),
  database: z.string().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
  ssl: z.boolean().default(false),
  poolSize: z.number().min(1).max(100).default(10),
  timeout: z.number().min(1000).max(60000).default(5000),
  retryAttempts: z.number().min(0).max(5).default(3),
  retryDelay: z.number().min(100).max(5000).default(1000),
  migrations: z.object({
    enabled: z.boolean().default(true),
    directory: z.string().default('./migrations'),
    tableName: z.string().default('migrations'),
  }).default({}),
});

// Cache Configuration Schema
export const CacheConfigSchema = z.object({
  type: z.enum(['memory', 'redis', 'memcached']).default('memory'),
  host: z.string().optional(),
  port: z.number().optional(),
  password: z.string().optional(),
  ttl: z.number().min(0).default(300000), // 5 minutes default
  maxSize: z.number().min(1).default(100),
  evictionPolicy: z.enum(['lru', 'lfu', 'fifo']).default('lru'),
  namespace: z.string().default('proceed'),
});

// State Configuration Schema
export const StateConfigSchema = z.object({
  type: z.enum(['memory', 'redis', 'localStorage', 'sessionStorage']).default('memory'),
  namespace: z.string().default('proceed-state'),
  persistenceEnabled: z.boolean().default(false),
  encryptionEnabled: z.boolean().default(false),
  encryptionKey: z.string().optional(),
  syncInterval: z.number().min(1000).max(60000).default(5000),
});

// Logging Configuration Schema
export const LoggingConfigSchema = z.object({
  level: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  format: z.enum(['json', 'text', 'pretty']).default('json'),
  output: z.enum(['console', 'file', 'both']).default('console'),
  filePath: z.string().optional(),
  maxFileSize: z.number().min(1024).default(10485760), // 10MB default
  maxFiles: z.number().min(1).default(5),
  timestamp: z.boolean().default(true),
  colorize: z.boolean().default(false),
});

// Metrics Configuration Schema
export const MetricsConfigSchema = z.object({
  enabled: z.boolean().default(false),
  provider: z.enum(['console', 'prometheus', 'datadog', 'custom']).default('console'),
  endpoint: z.string().optional(),
  apiKey: z.string().optional(),
  interval: z.number().min(1000).max(300000).default(60000), // 1 minute default
  tags: z.record(z.string()).default({}),
  includeSystemMetrics: z.boolean().default(true),
  includeProcessMetrics: z.boolean().default(true),
});

// UI Configuration Schema
export const UIConfigSchema = z.object({
  theme: z.enum(['light', 'dark', 'auto']).default('light'),
  primaryColor: z.string().default('#1E40AF'),
  secondaryColor: z.string().default('#DB2777'),
  fontFamily: z.string().default('Inter, system-ui, sans-serif'),
  borderRadius: z.enum(['none', 'sm', 'md', 'lg', 'xl']).default('md'),
  animationsEnabled: z.boolean().default(true),
  compactMode: z.boolean().default(false),
  locale: z.string().default('en-US'),
  dateFormat: z.string().default('MM/dd/yyyy'),
  timeFormat: z.string().default('HH:mm:ss'),
  numberFormat: z.object({
    decimals: z.number().min(0).max(10).default(2),
    thousandsSeparator: z.string().default(','),
    decimalSeparator: z.string().default('.'),
    currencySymbol: z.string().default('$'),
    currencyPosition: z.enum(['before', 'after']).default('before'),
  }).default({}),
});

// Features Configuration Schema
export const FeaturesConfigSchema = z.object({
  dashboard: z.boolean().default(true),
  analytics: z.boolean().default(true),
  reporting: z.boolean().default(true),
  export: z.boolean().default(true),
  import: z.boolean().default(true),
  notifications: z.boolean().default(false),
  collaboration: z.boolean().default(false),
  audit: z.boolean().default(false),
  experimental: z.boolean().default(false),
});

// Security Configuration Schema
export const SecurityConfigSchema = z.object({
  authEnabled: z.boolean().default(false),
  authProvider: z.enum(['jwt', 'oauth', 'saml', 'custom']).optional(),
  jwtSecret: z.string().optional(),
  jwtExpiration: z.string().default('24h'),
  corsEnabled: z.boolean().default(true),
  corsOrigins: z.array(z.string()).default(['*']),
  rateLimiting: z.object({
    enabled: z.boolean().default(false),
    windowMs: z.number().default(60000),
    maxRequests: z.number().default(100),
  }).default({}),
  encryption: z.object({
    algorithm: z.string().default('aes-256-gcm'),
    keyDerivation: z.string().default('pbkdf2'),
    iterations: z.number().default(100000),
  }).default({}),
});

// Performance Configuration Schema
export const PerformanceConfigSchema = z.object({
  lazyLoading: z.boolean().default(true),
  virtualScrolling: z.boolean().default(true),
  debounceMs: z.number().min(0).max(1000).default(300),
  throttleMs: z.number().min(0).max(1000).default(100),
  maxConcurrentRequests: z.number().min(1).max(20).default(6),
  requestQueueSize: z.number().min(10).max(1000).default(100),
  compressionEnabled: z.boolean().default(true),
  cacheStrategy: z.enum(['none', 'memory', 'persistent']).default('memory'),
});

// Complete SDK Configuration Schema
export const SDKConfigSchema = z.object({
  name: z.string().default('Proceed SDK'),
  version: z.string().default('1.0.0'),
  environment: z.enum(['development', 'staging', 'production']).default('development'),
  api: APIConfigSchema.default({}),
  database: DatabaseConfigSchema.default({}),
  cache: CacheConfigSchema.default({}),
  state: StateConfigSchema.default({}),
  logging: LoggingConfigSchema.default({}),
  metrics: MetricsConfigSchema.default({}),
  ui: UIConfigSchema.default({}),
  features: FeaturesConfigSchema.default({}),
  security: SecurityConfigSchema.default({}),
  performance: PerformanceConfigSchema.default({}),
  custom: z.record(z.unknown()).default({}),
});

// Config Schema for specific modules
export const ConfigSchema = {
  api: APIConfigSchema,
  database: DatabaseConfigSchema,
  cache: CacheConfigSchema,
  state: StateConfigSchema,
  logging: LoggingConfigSchema,
  metrics: MetricsConfigSchema,
  ui: UIConfigSchema,
  features: FeaturesConfigSchema,
  security: SecurityConfigSchema,
  performance: PerformanceConfigSchema,
  sdk: SDKConfigSchema,
};