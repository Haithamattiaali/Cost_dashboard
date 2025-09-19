/**
 * @proceed/backend - Backend services and modules for Proceed SDK
 * Production-ready server components for building revenue analytics APIs
 */

// Server Components
export * from './server';
export { createServer } from './server/createServer';
export { ServerConfig } from './server/types';

// Database Module
export * from './database';
export { DatabaseManager } from './database/DatabaseManager';
export { Migration } from './database/Migration';
export { QueryBuilder } from './database/QueryBuilder';
export { Repository } from './database/Repository';

// API Module
export * from './api';
export { Router } from './api/Router';
export { Controller } from './api/Controller';
export { Middleware } from './api/Middleware';
export { Validator } from './api/Validator';

// ETL Module
export * from './etl';
export { ETLPipeline } from './etl/ETLPipeline';
export { DataTransformer } from './etl/DataTransformer';
export { DataValidator } from './etl/DataValidator';
export { FileProcessor } from './etl/FileProcessor';

// Authentication Module
export * from './auth';
export { AuthService } from './auth/AuthService';
export { JWTProvider } from './auth/JWTProvider';
export { PermissionManager } from './auth/PermissionManager';

// Services
export * from './services';
export { CacheService } from './services/CacheService';
export { EmailService } from './services/EmailService';
export { StorageService } from './services/StorageService';
export { QueueService } from './services/QueueService';

// Middleware
export * from './middleware';
export { corsMiddleware } from './middleware/cors';
export { authMiddleware } from './middleware/auth';
export { rateLimitMiddleware } from './middleware/rateLimit';
export { errorMiddleware } from './middleware/error';
export { loggingMiddleware } from './middleware/logging';

// Utils
export * from './utils';
export { createLogger } from './utils/logger';
export { createMetricsCollector } from './utils/metrics';

// Types
export * from './types';

// Version
export const VERSION = '1.0.0';