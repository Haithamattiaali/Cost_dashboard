import { Router, Request, Response } from 'express';
import { DatabaseManager } from '../database/DatabaseManager';
import { CostTransformer } from '../etl/CostTransformer';

export function filterRoutes(): Router {
  const router = Router();

  // Get available filter options
  router.get('/options', async (req: Request, res: Response) => {
    try {
      const db = new DatabaseManager();
      await db.initialize({});

      const data = await db.getAllCostData();
      const transformer = new CostTransformer(data);
      const options = transformer.getFilterOptions();

      res.json({
        success: true,
        options
      });
    } catch (error) {
      console.error('Error fetching filter options:', error);
      res.status(500).json({ error: 'Failed to fetch filter options' });
    }
  });

  // Apply filters and get results
  router.post('/apply', async (req: Request, res: Response) => {
    try {
      const db = new DatabaseManager();
      await db.initialize({});

      const filters = req.body;
      const data = await db.getCostDataByFilters(filters);
      const transformer = new CostTransformer(data);
      const metrics = transformer.getDashboardMetrics();

      res.json({
        success: true,
        filters,
        results: {
          totalRows: data.length,
          metrics,
          data: data.slice(0, 100) // Return first 100 rows for display
        }
      });
    } catch (error) {
      console.error('Error applying filters:', error);
      res.status(500).json({ error: 'Failed to apply filters' });
    }
  });

  return router;
}