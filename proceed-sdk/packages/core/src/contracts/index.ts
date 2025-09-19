/**
 * Core contract definitions for the Proceed SDK
 * All modules must implement these interfaces for proper orchestration
 */

import { z } from 'zod';

// Result type for all operations
export interface Result<T> {
  success: boolean;
  data?: T;
  error?: SDKError;
  metadata?: Record<string, unknown>;
}

// SDK Error structure
export interface SDKError {
  code: string;
  message: string;
  details?: unknown;
  solution?: string;
  documentationUrl?: string;
}

// Data Provider Interface
export interface IDataProvider {
  name: string;
  initialize(config: DataProviderConfig): Promise<Result<void>>;
  fetch<T>(query: DataQuery): Promise<Result<T>>;
  save<T>(data: T, options?: SaveOptions): Promise<Result<void>>;
  delete(query: DataQuery): Promise<Result<void>>;
  healthCheck(): Promise<Result<HealthStatus>>;
}

// Cache Provider Interface
export interface ICacheProvider {
  name: string;
  initialize(config: CacheProviderConfig): Promise<Result<void>>;
  get<T>(key: string): Promise<Result<T | null>>;
  set<T>(key: string, value: T, ttl?: number): Promise<Result<void>>;
  delete(key: string): Promise<Result<void>>;
  clear(): Promise<Result<void>>;
  has(key: string): Promise<Result<boolean>>;
}

// State Provider Interface
export interface IStateProvider {
  name: string;
  initialize(config: StateProviderConfig): Promise<Result<void>>;
  getState<T>(key: string): Promise<Result<T | null>>;
  setState<T>(key: string, value: T): Promise<Result<void>>;
  deleteState(key: string): Promise<Result<void>>;
  subscribe(key: string, callback: StateChangeCallback): () => void;
}

// Event Bus Interface
export interface IEventBus {
  emit(event: string, data?: unknown): void;
  on(event: string, handler: EventHandler): () => void;
  once(event: string, handler: EventHandler): void;
  off(event: string, handler?: EventHandler): void;
  removeAllListeners(event?: string): void;
}

// Orchestrator Interface
export interface IOrchestrator {
  name: string;
  initialize(config: OrchestratorConfig): Promise<Result<void>>;
  execute<T>(operation: Operation): Promise<Result<T>>;
  healthCheck(): Promise<Result<HealthStatus>>;
}

// Connection Manager Interface
export interface IConnectionManager {
  initialize(config: ConnectionConfig): Promise<Result<void>>;
  request<T>(options: RequestOptions): Promise<Result<T>>;
  healthCheck(endpoint?: string): Promise<Result<HealthStatus>>;
  getStatus(): ConnectionStatus;
}

// Logger Interface
export interface ILogger {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, error?: Error, context?: LogContext): void;
  setLevel(level: LogLevel): void;
}

// Metrics Collector Interface
export interface IMetricsCollector {
  initialize(config: MetricsConfig): Promise<Result<void>>;
  recordMetric(name: string, value: number, tags?: Record<string, string>): void;
  recordDuration(name: string, duration: number, tags?: Record<string, string>): void;
  incrementCounter(name: string, tags?: Record<string, string>): void;
  getMetrics(): Promise<Result<MetricsSnapshot>>;
}

// Configuration Types
export interface DataProviderConfig {
  type: 'sqlite' | 'postgres' | 'mysql' | 'mongodb' | 'api';
  connectionString?: string;
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  ssl?: boolean;
  poolSize?: number;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

export interface CacheProviderConfig {
  type: 'memory' | 'redis' | 'memcached';
  host?: string;
  port?: number;
  password?: string;
  ttl?: number;
  maxSize?: number;
  evictionPolicy?: 'lru' | 'lfu' | 'fifo';
}

export interface StateProviderConfig {
  type: 'memory' | 'redis' | 'localStorage' | 'sessionStorage';
  namespace?: string;
  persistenceEnabled?: boolean;
  encryptionEnabled?: boolean;
}

export interface OrchestratorConfig {
  modules: Record<string, unknown>;
  middleware?: Middleware[];
  errorHandler?: ErrorHandler;
  metricsEnabled?: boolean;
}

export interface ConnectionConfig {
  baseUrl: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  headers?: Record<string, string>;
  healthCheckInterval?: number;
  healthCheckEndpoint?: string;
}

export interface MetricsConfig {
  enabled: boolean;
  provider?: 'console' | 'prometheus' | 'datadog' | 'custom';
  endpoint?: string;
  apiKey?: string;
  interval?: number;
  tags?: Record<string, string>;
}

// Operation Types
export interface DataQuery {
  table?: string;
  collection?: string;
  filters?: Record<string, unknown>;
  sort?: SortOptions;
  limit?: number;
  offset?: number;
  fields?: string[];
}

export interface SaveOptions {
  upsert?: boolean;
  validate?: boolean;
  transaction?: boolean;
}

export interface Operation {
  type: string;
  payload?: unknown;
  context?: OperationContext;
}

export interface OperationContext {
  userId?: string;
  tenantId?: string;
  requestId?: string;
  metadata?: Record<string, unknown>;
}

// Status Types
export interface HealthStatus {
  healthy: boolean;
  timestamp: number;
  details?: Record<string, unknown>;
  dependencies?: Record<string, HealthStatus>;
}

export interface ConnectionStatus {
  connected: boolean;
  lastCheck: number;
  responseTime?: number;
  error?: string;
}

// Event Types
export type EventHandler = (data?: unknown) => void | Promise<void>;
export type StateChangeCallback = (newValue: unknown, oldValue: unknown) => void;

// Logging Types
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  module?: string;
  operation?: string;
  userId?: string;
  requestId?: string;
  metadata?: Record<string, unknown>;
}

// Metrics Types
export interface MetricsSnapshot {
  timestamp: number;
  metrics: Record<string, MetricValue>;
  counters: Record<string, number>;
  durations: Record<string, DurationMetric>;
}

export interface MetricValue {
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
}

export interface DurationMetric {
  count: number;
  min: number;
  max: number;
  avg: number;
  p50: number;
  p95: number;
  p99: number;
}

// Middleware Types
export type Middleware = (
  operation: Operation,
  next: () => Promise<Result<unknown>>
) => Promise<Result<unknown>>;

export type ErrorHandler = (error: SDKError, context?: OperationContext) => void;

// Sort Options
export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

// Validation Schemas
export const DataProviderConfigSchema = z.object({
  type: z.enum(['sqlite', 'postgres', 'mysql', 'mongodb', 'api']),
  connectionString: z.string().optional(),
  host: z.string().optional(),
  port: z.number().optional(),
  database: z.string().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
  ssl: z.boolean().optional(),
  poolSize: z.number().optional(),
  timeout: z.number().optional(),
  retryAttempts: z.number().optional(),
  retryDelay: z.number().optional(),
});

export const CacheProviderConfigSchema = z.object({
  type: z.enum(['memory', 'redis', 'memcached']),
  host: z.string().optional(),
  port: z.number().optional(),
  password: z.string().optional(),
  ttl: z.number().optional(),
  maxSize: z.number().optional(),
  evictionPolicy: z.enum(['lru', 'lfu', 'fifo']).optional(),
});

export const StateProviderConfigSchema = z.object({
  type: z.enum(['memory', 'redis', 'localStorage', 'sessionStorage']),
  namespace: z.string().optional(),
  persistenceEnabled: z.boolean().optional(),
  encryptionEnabled: z.boolean().optional(),
});