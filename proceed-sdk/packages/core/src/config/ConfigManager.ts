/**
 * ConfigManager - Central configuration management for the SDK
 * Handles configuration loading, validation, and environment variable resolution
 */

import { z } from 'zod';
import { Result, SDKError } from '../contracts';
import { ConfigValidator } from './ConfigValidator';
import { SDKConfig, ConfigSource, ConfigOptions } from './types';
import { defaultConfig } from './defaults';
import { deepMerge } from '../utils/objects';

export class ConfigManager {
  private static instance: ConfigManager;
  private config: SDKConfig;
  private validator: ConfigValidator;
  private sources: Map<string, ConfigSource>;
  private frozen: boolean = false;

  private constructor() {
    this.config = defaultConfig;
    this.validator = new ConfigValidator();
    this.sources = new Map();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  /**
   * Initialize configuration from multiple sources
   */
  public async initialize(options: ConfigOptions): Promise<Result<void>> {
    try {
      if (this.frozen) {
        return {
          success: false,
          error: {
            code: 'CONFIG_FROZEN',
            message: 'Configuration is frozen and cannot be modified',
            solution: 'Initialize configuration before freezing',
          },
        };
      }

      // Load from file if provided
      if (options.configFile) {
        const fileConfig = await this.loadFromFile(options.configFile);
        if (!fileConfig.success) {
          return fileConfig;
        }
        this.addSource('file', { type: 'file', data: fileConfig.data });
      }

      // Load from environment variables
      if (options.loadEnv !== false) {
        const envConfig = this.loadFromEnv();
        this.addSource('env', { type: 'env', data: envConfig });
      }

      // Apply direct configuration
      if (options.config) {
        this.addSource('direct', { type: 'object', data: options.config });
      }

      // Merge all sources
      const mergedConfig = this.mergeSources();

      // Validate merged configuration
      const validation = await this.validator.validate(mergedConfig);
      if (!validation.success) {
        return validation;
      }

      this.config = mergedConfig;

      // Freeze if requested
      if (options.freeze) {
        this.freeze();
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'CONFIG_INIT_ERROR',
          message: `Failed to initialize configuration: ${error}`,
          solution: 'Check configuration sources and format',
        },
      };
    }
  }

  /**
   * Get configuration value by path
   */
  public get<T = unknown>(path?: string): T {
    if (!path) {
      return this.config as T;
    }

    const keys = path.split('.');
    let current: any = this.config;

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return undefined as T;
      }
    }

    return current as T;
  }

  /**
   * Set configuration value
   */
  public set(path: string, value: unknown): Result<void> {
    if (this.frozen) {
      return {
        success: false,
        error: {
          code: 'CONFIG_FROZEN',
          message: 'Cannot modify frozen configuration',
          solution: 'Set configuration before freezing',
        },
      };
    }

    const keys = path.split('.');
    const lastKey = keys.pop()!;
    let current: any = this.config;

    for (const key of keys) {
      if (!(key in current) || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }

    current[lastKey] = value;

    return { success: true };
  }

  /**
   * Freeze configuration to prevent modifications
   */
  public freeze(): void {
    this.frozen = true;
    Object.freeze(this.config);
  }

  /**
   * Check if configuration is frozen
   */
  public isFrozen(): boolean {
    return this.frozen;
  }

  /**
   * Add a configuration source
   */
  private addSource(name: string, source: ConfigSource): void {
    this.sources.set(name, source);
  }

  /**
   * Merge all configuration sources based on priority
   */
  private mergeSources(): SDKConfig {
    const priority = ['file', 'env', 'direct'];
    let merged = { ...defaultConfig };

    for (const sourceName of priority) {
      const source = this.sources.get(sourceName);
      if (source?.data) {
        merged = deepMerge(merged, source.data) as SDKConfig;
      }
    }

    return merged;
  }

  /**
   * Load configuration from file
   */
  private async loadFromFile(filePath: string): Promise<Result<Partial<SDKConfig>>> {
    try {
      // Dynamic import for Node.js environment
      if (typeof window === 'undefined') {
        const fs = await import('fs');
        const path = await import('path');

        const absolutePath = path.resolve(filePath);
        const content = fs.readFileSync(absolutePath, 'utf-8');

        const ext = path.extname(filePath).toLowerCase();
        let data: Partial<SDKConfig>;

        if (ext === '.json') {
          data = JSON.parse(content);
        } else if (ext === '.js' || ext === '.mjs') {
          const module = await import(absolutePath);
          data = module.default || module;
        } else {
          return {
            success: false,
            error: {
              code: 'UNSUPPORTED_FILE_TYPE',
              message: `Unsupported configuration file type: ${ext}`,
              solution: 'Use .json, .js, or .mjs files',
            },
          };
        }

        return { success: true, data };
      } else {
        // Browser environment - fetch from URL
        const response = await fetch(filePath);
        if (!response.ok) {
          throw new Error(`Failed to fetch config: ${response.statusText}`);
        }
        const data = await response.json();
        return { success: true, data };
      }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'CONFIG_LOAD_ERROR',
          message: `Failed to load configuration file: ${error}`,
          solution: 'Check file path and permissions',
        },
      };
    }
  }

  /**
   * Load configuration from environment variables
   */
  private loadFromEnv(): Partial<SDKConfig> {
    const config: any = {};
    const prefix = 'PROCEED_';

    // Check if we're in Node.js environment
    if (typeof process !== 'undefined' && process.env) {
      const env = process.env;

      // Map environment variables to configuration
      const mappings: Record<string, string> = {
        [`${prefix}API_URL`]: 'api.baseUrl',
        [`${prefix}API_TIMEOUT`]: 'api.timeout',
        [`${prefix}API_RETRY_ATTEMPTS`]: 'api.retryAttempts',
        [`${prefix}CACHE_TYPE`]: 'cache.type',
        [`${prefix}CACHE_TTL`]: 'cache.ttl',
        [`${prefix}DB_TYPE`]: 'database.type',
        [`${prefix}DB_HOST`]: 'database.host',
        [`${prefix}DB_PORT`]: 'database.port',
        [`${prefix}DB_NAME`]: 'database.database',
        [`${prefix}DB_USER`]: 'database.username',
        [`${prefix}DB_PASSWORD`]: 'database.password',
        [`${prefix}LOG_LEVEL`]: 'logging.level',
        [`${prefix}LOG_FORMAT`]: 'logging.format',
        [`${prefix}METRICS_ENABLED`]: 'metrics.enabled',
        [`${prefix}METRICS_PROVIDER`]: 'metrics.provider',
      };

      for (const [envKey, configPath] of Object.entries(mappings)) {
        if (env[envKey]) {
          this.setNestedValue(config, configPath, this.parseEnvValue(env[envKey]!));
        }
      }
    }

    return config;
  }

  /**
   * Set nested value in object
   */
  private setNestedValue(obj: any, path: string, value: unknown): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    let current = obj;

    for (const key of keys) {
      if (!(key in current)) {
        current[key] = {};
      }
      current = current[key];
    }

    current[lastKey] = value;
  }

  /**
   * Parse environment variable value
   */
  private parseEnvValue(value: string): unknown {
    // Try to parse as JSON
    try {
      return JSON.parse(value);
    } catch {
      // Return as string if not valid JSON
      return value;
    }
  }

  /**
   * Export configuration for debugging
   */
  public export(): SDKConfig {
    return { ...this.config };
  }

  /**
   * Reset configuration to defaults
   */
  public reset(): void {
    if (!this.frozen) {
      this.config = { ...defaultConfig };
      this.sources.clear();
    }
  }
}