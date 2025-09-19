/**
 * @proceed/core - Core utilities and abstractions for Proceed SDK
 * Enterprise-grade foundation for building revenue analytics dashboards
 */

// Configuration Management
export * from './config';
export { ConfigManager } from './config/ConfigManager';
export { ConfigValidator } from './config/ConfigValidator';
export { ConfigSchema } from './config/schemas';

// Contract Definitions
export * from './contracts';
export type {
  IDataProvider,
  ICacheProvider,
  IStateProvider,
  IEventBus,
  IOrchestrator,
  IConnectionManager,
  ILogger,
  IMetricsCollector,
} from './contracts';

// Orchestration Layer
export * from './orchestrators';
export { BaseOrchestrator } from './orchestrators/BaseOrchestrator';
export { DataOrchestrator } from './orchestrators/DataOrchestrator';
export { StateOrchestrator } from './orchestrators/StateOrchestrator';

// State Management
export * from './state';
export { StateManager } from './state/StateManager';
export { StateStore } from './state/StateStore';

// Utilities
export * from './utils';
export { retry } from './utils/retry';
export { debounce, throttle } from './utils/timing';
export { deepMerge, deepClone } from './utils/objects';
export { formatCurrency, formatPercentage, formatNumber } from './utils/formatting';
export { calculateMetrics } from './utils/metrics';

// Event System
export { EventBus } from './events/EventBus';
export { EventEmitter } from './events/EventEmitter';

// Error Handling
export { SDKError, ErrorCodes } from './errors/SDKError';
export { ErrorHandler } from './errors/ErrorHandler';

// Connection Management
export { ConnectionManager } from './connection/ConnectionManager';
export { HealthChecker } from './connection/HealthChecker';

// Logging
export { Logger } from './logging/Logger';
export { LogLevel } from './logging/types';

// Types
export * from './types';

// Constants
export * from './constants';

// Version
export const VERSION = '1.0.0';