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
import { playgroundRoutes } from './routes/playground';

// Load configuration based on environment
const isProduction = process.env.NODE_ENV === 'production';
const configFileName = isProduction ? 'config.production.json' : 'config.json';
const configPath = path.join(__dirname, '..', configFileName);

// Use environment variables in production, fallback to config file
let config: any = {};
if (fs.existsSync(configPath)) {
  config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
}

function getConfig(path: string) {
  // Check environment variables first (for production)
  const envKey = path.replace(/\./g, '_').toUpperCase();
  if (process.env[envKey]) {
    return process.env[envKey];
  }

  // Fallback to config file
  const keys = path.split('.');
  let value = config;
  for (const key of keys) {
    value = value?.[key];
  }
  return value;
}

async function initializeServer() {
  const app = express();

  console.log('✅ Configuration loaded');

  // Initialize database
  const db = new DatabaseManager();
  const dbPath = process.env.DATABASE_PATH || getConfig('database.path') || getConfig('database');
  await db.initialize(dbPath);
  console.log('✅ Database initialized at', dbPath);

  // Create upload directory if it doesn't exist
  const uploadDir = process.env.UPLOAD_DIR || getConfig('excel.uploadDirectory') || './uploads';
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Middleware
  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);

      // Check if origin is in allowed list
      const allowedOrigins = getConfig('security.corsOrigins') || [];
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Check for Netlify wildcard
      if (origin.endsWith('.netlify.app') || origin === 'https://protco.netlify.app') {
        return callback(null, true);
      }

      // Allow localhost for development
      if (origin.startsWith('http://localhost')) {
        return callback(null, true);
      }

      callback(new Error('Not allowed by CORS'));
    },
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
  app.use('/api/playground', playgroundRoutes());

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
  const port = process.env.PORT || getConfig('server.port') || getConfig('api.port') || 3001;
  const host = process.env.HOST || getConfig('server.host') || '0.0.0.0';

  app.listen(Number(port), host, () => {
    console.log(`🚀 PROCEED Cost Dashboard API running at http://${host}:${port}`);
    if (!isProduction) {
      console.log(`📊 Dashboard available at http://localhost:5173`);
    }
  });
}

// Start the server
initializeServer().catch(console.error);