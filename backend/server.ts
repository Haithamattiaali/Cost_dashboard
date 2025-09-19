import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { DatabaseManager } from './database/DatabaseManager';
import { ExcelProcessor } from './etl/ExcelProcessor';
import { CostTransformer } from './etl/CostTransformer';
import { costRoutes } from './routes/costs';
import { uploadRoutes } from './routes/upload';
import { comparisonRoutes } from './routes/comparisons';
import { filterRoutes } from './routes/filters';

// Load configuration directly
const configPath = path.join(__dirname, '../config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

function getConfig(path: string) {
  const keys = path.split('.');
  let value = config;
  for (const key of keys) {
    value = value[key];
  }
  return value;
}

async function initializeServer() {
  const app = express();

  console.log('✅ Configuration loaded');

  // Initialize database
  const db = new DatabaseManager();
  await db.initialize(getConfig('database'));
  console.log('✅ Database initialized');

  // Create upload directory if it doesn't exist
  const uploadDir = getConfig('excel.uploadDirectory');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Middleware
  app.use(cors({
    origin: getConfig('security.corsOrigins'),
    credentials: true,
  }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Configure multer for file uploads
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, 'cost-data-' + uniqueSuffix + path.extname(file.originalname));
    }
  });

  const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
      const allowedTypes = getConfig('excel.allowedTypes');
      const ext = path.extname(file.originalname).toLowerCase();
      if (allowedTypes.includes(ext)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Only Excel files are allowed.'));
      }
    },
    limits: {
      fileSize: getConfig('excel.maxFileSize'),
    }
  });

  // Routes
  app.use('/api/upload', uploadRoutes(upload));
  app.use('/api/costs', costRoutes());
  app.use('/api/comparisons', comparisonRoutes());
  app.use('/api/filters', filterRoutes());

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'PROCEED Cost Dashboard API',
    });
  });

  // Error handling middleware
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
      error: err.message || 'Internal server error',
      status: err.status || 500,
    });
  });

  // Start server
  const port = getConfig('api.port') || 3001;
  app.listen(port, () => {
    console.log(`🚀 PROCEED Cost Dashboard API running at http://localhost:${port}`);
    console.log(`📊 Dashboard available at http://localhost:5173`);
  });
}

// Start the server
initializeServer().catch(console.error);