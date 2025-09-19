import { Router, Request, Response } from 'express';
import { ExcelProcessor } from '../etl/ExcelProcessor';
import { DatabaseManager } from '../database/DatabaseManager';
import path from 'path';
import fs from 'fs';

export function uploadRoutes(upload: any): Router {
  const router = Router();

  router.post('/excel', upload.single('file'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
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

      // Clear existing data (optional - based on your requirements)
      const clearOnUpload = req.body?.clearExisting === 'true';
      if (clearOnUpload) {
        await db.clearAllData();
      }

      const saveResult = await processor.saveToDatabase(db);
      if (!saveResult.success) {
        fs.unlinkSync(filePath);
        return res.status(500).json({ error: saveResult.error });
      }

      // Clean up uploaded file
      fs.unlinkSync(filePath);

      res.json({
        success: true,
        message: 'Excel file processed successfully',
        summary: {
          ...summary,
          rowsInserted: saveResult.rowsInserted
        }
      });

    } catch (error) {
      console.error('Upload error:', error);
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