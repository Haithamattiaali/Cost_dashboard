import { Router, Request, Response } from 'express';
import { ExcelProcessor } from '../etl/ExcelProcessor';
import { DatabaseManager } from '../database/DatabaseManager';
import path from 'path';
import fs from 'fs';

export function uploadRoutes(upload: any): Router {
  const router = Router();

  // Add middleware to log incoming requests for debugging
  router.use((req, res, next) => {
    console.log(`[Upload Route] ${req.method} ${req.path}`);
    console.log('[Upload Route] Headers:', req.headers);
    next();
  });

  router.post('/excel', upload.single('file'), async (req: Request, res: Response) => {
    try {
      console.log('[Upload] Processing file upload request');
      console.log('[Upload] File received:', req.file ? 'Yes' : 'No');

      if (!req.file) {
        console.error('[Upload] No file in request');
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const filePath = req.file.path;
      const processor = new ExcelProcessor();

      // Load and parse Excel file
      const loadResult = await processor.loadFile(filePath);
      if (!loadResult.success) {
        // Clean up uploaded file
        fs.unlinkSync(filePath);
        return res.status(400).json({ error: loadResult.error });
      }

      const parseResult = await processor.parseData();
      if (!parseResult.success) {
        fs.unlinkSync(filePath);
        return res.status(400).json({ error: parseResult.error });
      }

      // Validate data
      const validation = processor.validateData();
      if (!validation.isValid) {
        fs.unlinkSync(filePath);
        return res.status(400).json({
          error: 'Data validation failed',
          validationErrors: validation.errors
        });
      }

      // Get data summary
      const summary = processor.getDataSummary();

      // Save to database
      const db = new DatabaseManager();
      await db.initialize({});

      // ALWAYS clear existing data before uploading new data to prevent duplicates
      console.log('Clearing existing data before upload...');
      const clearResult = await db.clearAllData();
      if (!clearResult.success) {
        console.error('Failed to clear existing data:', clearResult.error);
        return res.status(500).json({ error: 'Failed to clear existing data before upload' });
      }
      console.log('Existing data cleared successfully');

      const saveResult = await processor.saveToDatabase(db);
      if (!saveResult.success) {
        fs.unlinkSync(filePath);
        return res.status(500).json({ error: saveResult.error });
      }

      // Clean up uploaded file
      fs.unlinkSync(filePath);

      // Ensure CORS headers are set on successful response
      const origin = req.headers.origin;
      if (origin) {
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Access-Control-Allow-Credentials', 'true');
      }

      res.json({
        success: true,
        message: 'Excel file processed successfully',
        summary: {
          ...summary,
          rowsInserted: saveResult.rowsInserted
        }
      });

    } catch (error) {
      console.error('[Upload] Error processing upload:', error);

      // Ensure CORS headers are set on error response
      const origin = req.headers.origin;
      if (origin) {
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Access-Control-Allow-Credentials', 'true');
      }

      // Check if it's a multer error
      if (error instanceof Error && error.message.includes('file type')) {
        return res.status(400).json({
          error: error.message,
          details: 'Please upload only Excel files (.xlsx or .xls)'
        });
      }

      res.status(500).json({
        error: 'Failed to process upload',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  router.get('/status', async (req: Request, res: Response) => {
    try {
      const db = new DatabaseManager();
      await db.initialize({});
      const data = await db.getAllCostData();

      res.json({
        hasData: data.length > 0,
        rowCount: data.length,
        lastUpload: data.length > 0 ? new Date().toISOString() : null
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get upload status' });
    }
  });

  return router;
}