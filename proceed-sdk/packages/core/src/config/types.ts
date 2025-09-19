/**
 * Configuration type definitions for the Proceed SDK
 */

import { z } from 'zod';
import {
  SDKConfigSchema,
  APIConfigSchema,
  DatabaseConfigSchema,
  CacheConfigSchema,
  StateConfigSchema,
  LoggingConfigSchema,
  MetricsConfigSchema,
  UIConfigSchema,
  FeaturesConfigSchema,
  SecurityConfigSchema,
  PerformanceConfigSchema,
} from './schemas';

// Infer types from schemas
export type SDKConfig = z.infer<typeof SDKConfigSchema>;
export type APIConfig = z.infer<typeof APIConfigSchema>;
export type DatabaseConfig = z.infer<typeof DatabaseConfigSchema>;
export type CacheConfig = z.infer<typeof CacheConfigSchema>;
export type StateConfig = z.infer<typeof StateConfigSchema>;
export type LoggingConfig = z.infer<typeof LoggingConfigSchema>;
export type MetricsConfig = z.infer<typeof MetricsConfigSchema>;
export type UIConfig = z.infer<typeof UIConfigSchema>;
export type FeaturesConfig = z.infer<typeof FeaturesConfigSchema>;
export type SecurityConfig = z.infer<typeof SecurityConfigSchema>;
export type PerformanceConfig = z.infer<typeof PerformanceConfigSchema>;

// Configuration source types
export interface ConfigSource {
  type: 'file' | 'env' | 'object' | 'remote';
  data: Partial<SDKConfig>;
  priority?: number;
}

// Configuration options for initialization
export interface ConfigOptions {
  config?: Partial<SDKConfig>;
  configFile?: string;
  loadEnv?: boolean;
  validate?: boolean;
  freeze?: boolean;
  override?: boolean;
}

// Configuration presets
export type ConfigPreset = 'minimal' | 'default' | 'full' | 'production' | 'development';

// Module configuration interface
export interface ModuleConfig {
  name: string;
  enabled: boolean;
  config: Record<string, unknown>;
  dependencies?: string[];
}

// Environment configuration
export interface EnvironmentConfig {
  development: Partial<SDKConfig>;
  staging: Partial<SDKConfig>;
  production: Partial<SDKConfig>;
}

// Config change event
export interface ConfigChangeEvent {
  path: string;
  oldValue: unknown;
  newValue: unknown;
  timestamp: number;
}

// Config validation result
export interface ConfigValidationResult {
  valid: boolean;
  errors?: Array<{
    path: string;
    message: string;
    expected?: string;
    received?: string;
  }>;
  warnings?: Array<{
    path: string;
    message: string;
  }>;
}