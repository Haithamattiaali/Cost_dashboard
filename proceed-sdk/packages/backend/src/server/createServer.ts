/**
 * Server factory for creating configurable Express servers
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { ConfigManager } from '@proceed/core/config';
import { Logger } from '@proceed/core/logging';
import { Result } from '@proceed/core/contracts';
import { ServerConfig, ServerOptions, RouteDefinition } from './types';
import { corsMiddleware } from '../middleware/cors';
import { errorMiddleware } from '../middleware/error';
import { loggingMiddleware } from '../middleware/logging';
import { healthCheckRoute } from './healthCheck';

/**
 * Create a configured Express server
 */
export async function createServer(options: ServerOptions): Promise<Result<Express>> {
  try {
    const app = express();
    const config = ConfigManager.getInstance();
    const logger = new Logger('Server');

    // Load server configuration
    const serverConfig: ServerConfig = {
      port: options.port || config.get('api.port') || 3001,
      host: options.host || config.get('api.host') || 'localhost',
      cors: options.cors || config.get('api.cors') || {},
      middleware: options.middleware || [],
      routes: options.routes || [],
      errorHandler: options.errorHandler,
      gracefulShutdown: options.gracefulShutdown !== false,
      trustProxy: options.trustProxy || false,
      maxRequestSize: options.maxRequestSize || '10mb',
      timeout: options.timeout || 30000,
    };

    // Configure Express settings
    app.set('trust proxy', serverConfig.trustProxy);
    app.set('x-powered-by', false);

    // Apply global middleware
    app.use(express.json({ limit: serverConfig.maxRequestSize }));
    app.use(express.urlencoded({ extended: true, limit: serverConfig.maxRequestSize }));

    // Apply CORS
    if (serverConfig.cors) {
      app.use(corsMiddleware(serverConfig.cors));
    }

    // Apply logging
    app.use(loggingMiddleware({ logger }));

    // Apply custom middleware
    for (const middleware of serverConfig.middleware) {
      app.use(middleware);
    }

    // Apply timeout to all routes
    app.use((req: Request, res: Response, next: NextFunction) => {
      req.setTimeout(serverConfig.timeout);
      res.setTimeout(serverConfig.timeout);
      next();
    });

    // Health check endpoint
    app.get('/health', healthCheckRoute);

    // Register routes
    for (const route of serverConfig.routes) {
      registerRoute(app, route);
    }

    // 404 handler
    app.use((req: Request, res: Response) => {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Route ${req.method} ${req.path} not found`,
        },
      });
    });

    // Error handling middleware (must be last)
    app.use(errorMiddleware({
      logger,
      includeStack: config.get('environment') === 'development',
      customHandler: serverConfig.errorHandler,
    }));

    // Graceful shutdown handler
    if (serverConfig.gracefulShutdown) {
      setupGracefulShutdown(app, logger);
    }

    logger.info(`Server configured on ${serverConfig.host}:${serverConfig.port}`);

    return { success: true, data: app };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'SERVER_CREATION_ERROR',
        message: `Failed to create server: ${error}`,
        solution: 'Check server configuration and dependencies',
      },
    };
  }
}

/**
 * Register a route with the Express app
 */
function registerRoute(app: Express, route: RouteDefinition): void {
  const { method, path, handler, middleware = [] } = route;

  // Convert method to lowercase for Express
  const expressMethod = method.toLowerCase() as keyof Express;

  // Apply route with middleware
  if (middleware.length > 0) {
    (app as any)[expressMethod](path, ...middleware, handler);
  } else {
    (app as any)[expressMethod](path, handler);
  }
}

/**
 * Setup graceful shutdown handling
 */
function setupGracefulShutdown(app: Express, logger: Logger): void {
  let server: any;
  const connections = new Set();

  // Track connections
  app.on('connection', (connection: any) => {
    connections.add(connection);
    connection.on('close', () => {
      connections.delete(connection);
    });
  });

  // Shutdown handler
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}, starting graceful shutdown...`);

    // Stop accepting new connections
    if (server) {
      server.close(() => {
        logger.info('HTTP server closed');
      });
    }

    // Close existing connections
    for (const connection of connections) {
      (connection as any).end();
    }

    // Force close after timeout
    setTimeout(() => {
      for (const connection of connections) {
        (connection as any).destroy();
      }
    }, 5000);

    // Exit process
    setTimeout(() => {
      logger.info('Graceful shutdown complete');
      process.exit(0);
    }, 6000);
  };

  // Register shutdown handlers
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Store server reference when app starts listening
  const originalListen = app.listen;
  app.listen = function (...args: any[]) {
    server = originalListen.apply(this, args);
    return server;
  };
}

/**
 * Start the server
 */
export async function startServer(
  app: Express,
  port?: number,
  host?: string
): Promise<Result<{ port: number; host: string }>> {
  const config = ConfigManager.getInstance();
  const logger = new Logger('Server');

  const serverPort = port || config.get('api.port') || 3001;
  const serverHost = host || config.get('api.host') || 'localhost';

  return new Promise((resolve) => {
    const server = app.listen(serverPort, serverHost, () => {
      logger.info(`Server started on http://${serverHost}:${serverPort}`);
      resolve({
        success: true,
        data: { port: serverPort, host: serverHost },
      });
    });

    server.on('error', (error: any) => {
      logger.error('Failed to start server', error);
      resolve({
        success: false,
        error: {
          code: 'SERVER_START_ERROR',
          message: `Failed to start server: ${error.message}`,
          solution: error.code === 'EADDRINUSE'
            ? `Port ${serverPort} is already in use. Try a different port.`
            : 'Check server configuration and network settings',
        },
      });
    });
  });
}