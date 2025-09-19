/**
 * Example backend server using Proceed SDK
 */

import { createServer, startServer } from '@proceed/backend/server';
import { DatabaseManager } from '@proceed/backend/database';
import { ConfigManager } from '@proceed/core/config';
import { Logger } from '@proceed/core/logging';

// API Routes
import { revenueRoutes } from './routes/revenue';
import { uploadRoutes } from './routes/upload';
import { reportRoutes } from './routes/reports';

async function main() {
  const logger = new Logger('Main');

  try {
    // Initialize configuration
    const config = ConfigManager.getInstance();
    await config.initialize({
      configFile: '../config.json',
      loadEnv: true,
    });

    logger.info('Configuration loaded');

    // Initialize database
    const db = new DatabaseManager();
    const dbResult = await db.initialize(config.get('database'));

    if (!dbResult.success) {
      throw new Error(`Database initialization failed: ${dbResult.error?.message}`);
    }

    logger.info('Database initialized');

    // Run migrations
    if (config.get('database.migrations.enabled')) {
      const migrationResult = await db.runMigrations();
      if (!migrationResult.success) {
        logger.warn(`Migration warning: ${migrationResult.error?.message}`);
      }
    }

    // Create server
    const serverResult = await createServer({
      port: config.get('api.port'),
      cors: {
        enabled: config.get('security.corsEnabled'),
        origins: config.get('security.corsOrigins'),
      },
      routes: [
        ...revenueRoutes,
        ...uploadRoutes,
        ...reportRoutes,
      ],
      middleware: [],
      gracefulShutdown: true,
    });

    if (!serverResult.success) {
      throw new Error(`Server creation failed: ${serverResult.error?.message}`);
    }

    const app = serverResult.data!;

    // Start server
    const startResult = await startServer(app);

    if (!startResult.success) {
      throw new Error(`Server start failed: ${startResult.error?.message}`);
    }

    const { port, host } = startResult.data!;
    logger.info(`Server running at http://${host}:${port}`);
    logger.info('Revenue Dashboard API is ready');

  } catch (error) {
    logger.error('Failed to start application', error as Error);
    process.exit(1);
  }
}

// Run the application
main();