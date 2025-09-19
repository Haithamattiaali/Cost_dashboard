/**
 * ConfigValidator - Validates SDK configuration against schemas
 */

import { z } from 'zod';
import { Result } from '../contracts';
import { SDKConfig } from './types';
import { SDKConfigSchema } from './schemas';

export class ConfigValidator {
  private schema: z.ZodSchema<SDKConfig>;
  private customValidators: Map<string, (value: unknown) => Result<void>>;

  constructor() {
    this.schema = SDKConfigSchema;
    this.customValidators = new Map();
    this.registerDefaultValidators();
  }

  /**
   * Validate configuration against schema
   */
  public async validate(config: unknown): Promise<Result<SDKConfig>> {
    try {
      // Validate against Zod schema
      const parsed = await this.schema.parseAsync(config);

      // Run custom validators
      for (const [path, validator] of this.customValidators) {
        const value = this.getValueByPath(parsed, path);
        const result = validator(value);
        if (!result.success) {
          return result as Result<SDKConfig>;
        }
      }

      return { success: true, data: parsed };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Configuration validation failed',
            details: error.errors,
            solution: this.generateSolution(error),
          },
        };
      }

      return {
        success: false,
        error: {
          code: 'UNKNOWN_VALIDATION_ERROR',
          message: `Validation failed: ${error}`,
          solution: 'Check configuration format',
        },
      };
    }
  }

  /**
   * Register a custom validator for a specific path
   */
  public registerValidator(path: string, validator: (value: unknown) => Result<void>): void {
    this.customValidators.set(path, validator);
  }

  /**
   * Register default validators
   */
  private registerDefaultValidators(): void {
    // Validate API URL format
    this.registerValidator('api.baseUrl', (value) => {
      if (typeof value === 'string' && value) {
        try {
          new URL(value);
          return { success: true };
        } catch {
          return {
            success: false,
            error: {
              code: 'INVALID_URL',
              message: `Invalid API URL: ${value}`,
              solution: 'Provide a valid URL starting with http:// or https://',
            },
          };
        }
      }
      return { success: true };
    });

    // Validate database connection
    this.registerValidator('database', (value) => {
      const db = value as any;
      if (db?.type === 'sqlite' && !db.connectionString && !db.database) {
        return {
          success: false,
          error: {
            code: 'MISSING_DB_PATH',
            message: 'SQLite requires either connectionString or database path',
            solution: 'Provide database.connectionString or database.database',
          },
        };
      }
      if (db?.type !== 'sqlite' && !db?.host && !db?.connectionString) {
        return {
          success: false,
          error: {
            code: 'MISSING_DB_HOST',
            message: 'Database requires either connectionString or host',
            solution: 'Provide database.connectionString or database.host',
          },
        };
      }
      return { success: true };
    });

    // Validate cache configuration
    this.registerValidator('cache', (value) => {
      const cache = value as any;
      if (cache?.type === 'redis' && !cache?.host) {
        return {
          success: false,
          error: {
            code: 'MISSING_REDIS_HOST',
            message: 'Redis cache requires host configuration',
            solution: 'Provide cache.host for Redis',
          },
        };
      }
      if (cache?.maxSize && cache.maxSize < 1) {
        return {
          success: false,
          error: {
            code: 'INVALID_CACHE_SIZE',
            message: 'Cache maxSize must be greater than 0',
            solution: 'Set cache.maxSize to a positive number',
          },
        };
      }
      return { success: true };
    });

    // Validate feature flags
    this.registerValidator('features', (value) => {
      const features = value as any;
      if (features?.experimental && process.env.NODE_ENV === 'production') {
        console.warn('WARNING: Experimental features enabled in production');
      }
      return { success: true };
    });
  }

  /**
   * Get value by path from object
   */
  private getValueByPath(obj: any, path: string): unknown {
    const keys = path.split('.');
    let current = obj;

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return undefined;
      }
    }

    return current;
  }

  /**
   * Generate helpful solution message from Zod error
   */
  private generateSolution(error: z.ZodError): string {
    const issues = error.errors.map((issue) => {
      const path = issue.path.join('.');
      switch (issue.code) {
        case 'invalid_type':
          return `${path}: Expected ${issue.expected}, got ${issue.received}`;
        case 'invalid_enum_value':
          return `${path}: Must be one of: ${(issue as any).options.join(', ')}`;
        case 'too_small':
          return `${path}: Value too small (minimum: ${(issue as any).minimum})`;
        case 'too_big':
          return `${path}: Value too large (maximum: ${(issue as any).maximum})`;
        default:
          return `${path}: ${issue.message}`;
      }
    });

    return issues.join('; ');
  }

  /**
   * Validate partial configuration (for updates)
   */
  public validatePartial(config: unknown): Result<Partial<SDKConfig>> {
    try {
      const partialSchema = this.schema.partial();
      const parsed = partialSchema.parse(config);
      return { success: true, data: parsed };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: {
            code: 'PARTIAL_VALIDATION_ERROR',
            message: 'Partial configuration validation failed',
            details: error.errors,
            solution: this.generateSolution(error),
          },
        };
      }

      return {
        success: false,
        error: {
          code: 'UNKNOWN_VALIDATION_ERROR',
          message: `Validation failed: ${error}`,
          solution: 'Check configuration format',
        },
      };
    }
  }
}