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

  // CORS Configuration - MUST be before all routes
  const allowedOrigins = [
    'https://protco.netlify.app',
    'https://proceed-cost-dashboard.netlify.app',
    'http://localhost:5173',
    'http://localhost:3000'
  ];

  // More robust CORS configuration for Render deployment
  const corsOptions = {
    origin: function(origin, callback) {
      // Allow requests with no origin (mobile apps, Postman, etc)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else if (process.env.NODE_ENV === 'development') {
        // In development, allow any origin
        callback(null, true);
      } else {
        // In production, check if CORS_ORIGIN env var allows all
        if (process.env.CORS_ORIGIN === '*') {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 86400, // 24 hours
    preflightContinue: false,
    optionsSuccessStatus: 204
  };

  app.use(cors(corsOptions));

  // Handle preflight OPTIONS requests explicitly for all routes
  app.options('*', cors(corsOptions));

  // Add custom middleware to ensure CORS headers are always set
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && (allowedOrigins.includes(origin) || process.env.CORS_ORIGIN === '*')) {
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Access-Control-Allow-Credentials', 'true');
    }

    // Ensure headers are set for OPTIONS requests
    if (req.method === 'OPTIONS') {
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD, PATCH');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
      res.header('Access-Control-Max-Age', '86400');
      return res.sendStatus(204);
    }

    next();
  });

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Configure multer for file uploads with better error handling
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      // Ensure upload directory exists
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
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
      const allowedTypes = getConfig('excel.allowedTypes') || ['.xlsx', '.xls'];
      const ext = path.extname(file.originalname).toLowerCase();
      if (allowedTypes.includes(ext)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Only Excel files (.xlsx, .xls) are allowed.'));
      }
    },
    limits: {
      fileSize: getConfig('excel.maxFileSize') || 50 * 1024 * 1024, // Default 50MB
    }
  });

  // Routes
  app.use('/api/upload', uploadRoutes(upload));
  app.use('/api/costs', costRoutes());
  app.use('/api/comparisons', comparisonRoutes());
  app.use('/api/filters', filterRoutes());
  app.use('/api/playground', playgroundRoutes());

  // Health check with CORS headers verification
  app.get('/api/health', (req, res) => {
    const origin = req.headers.origin;
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'PROCEED Cost Dashboard API',
      cors: {
        origin: origin || 'no-origin',
        headers: {
          'access-control-allow-origin': res.getHeaders()['access-control-allow-origin'] || 'not-set',
          'access-control-allow-credentials': res.getHeaders()['access-control-allow-credentials'] || 'not-set'
        }
      }
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