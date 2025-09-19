import { Router, Request, Response } from 'express';
import { DatabaseManager } from '../database/DatabaseManager';
import { CostTransformer } from '../etl/CostTransformer';

export function costRoutes(): Router {
  const router = Router();

  // Get all costs with optional filters
  router.get('/', async (req: Request, res: Response) => {
    try {
      const db = new DatabaseManager();
      await db.initialize({});

      const filters = {
        year: req.query.year ? parseInt(req.query.year as string) : undefined,
        quarter: req.query.quarter as string,
        warehouse: req.query.warehouse as string,
        type: req.query.type as string,
        costType: req.query.costType as string,
        opexCapex: req.query.opexCapex as string,
      };

      const data = await db.getCostDataByFilters(filters);
      const transformer = new CostTransformer(data);

      res.json({
        success: true,
        data,
        summary: {
          totalRows: data.length,
          totalCost: data.reduce((sum, row) => sum + row.totalIncurredCost, 0),
          filters: transformer.getFilterOptions()
        }
      });
    } catch (error) {
      console.error('Error fetching costs:', error);
      res.status(500).json({ error: 'Failed to fetch cost data' });
    }
  });

  // Get dashboard metrics
  router.get('/dashboard', async (req: Request, res: Response) => {
    try {
      const db = new DatabaseManager();
      await db.initialize({});

      // Parse filters from query parameters - same as in '/' endpoint
      const filters = {
        year: req.query.year ? parseInt(req.query.year as string) : undefined,
        quarter: req.query.quarter as string,
        warehouse: req.query.warehouse as string,
        type: req.query.type as string,
        costType: req.query.costType as string,
        opexCapex: req.query.opexCapex as string,
      };

      // Log filters for observability
      console.log('Dashboard filters received:', filters);

      // Use filtered data instead of all data
      const data = await db.getCostDataByFilters(filters);

      // Log data count for observability
      console.log(`Filtered data: ${data.length} rows returned`);

      const transformer = new CostTransformer(data);
      const metrics = transformer.getDashboardMetrics();

      res.json({
        success: true,
        metrics
      });
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      res.status(500).json({ error: 'Failed to fetch dashboard metrics' });
    }
  });

  // Get aggregated costs by dimension
  router.get('/aggregate/:dimension', async (req: Request, res: Response) => {
    try {
      const db = new DatabaseManager();
      await db.initialize({});

      const dimension = req.params.dimension;
      const validDimensions = ['year', 'quarter', 'warehouse', 'type', 'costType', 'opexCapex', 'tcoModelCategories'];

      if (!validDimensions.includes(dimension)) {
        return res.status(400).json({ error: 'Invalid dimension' });
      }

      const data = await db.getAllCostData();
      const transformer = new CostTransformer(data);
      const aggregated = transformer.aggregateByDimension(dimension as any);

      res.json({
        success: true,
        dimension,
        data: aggregated
      });
    } catch (error) {
      console.error('Error aggregating costs:', error);
      res.status(500).json({ error: 'Failed to aggregate cost data' });
    }
  });

  // Get filter options
  router.get('/filters', async (req: Request, res: Response) => {
    try {
      const db = new DatabaseManager();
      await db.initialize({});

      const data = await db.getAllCostData();
      const transformer = new CostTransformer(data);
      const filters = transformer.getFilterOptions();

      res.json({
        success: true,
        filters
      });
    } catch (error) {
      console.error('Error fetching filters:', error);
      res.status(500).json({ error: 'Failed to fetch filter options' });
    }
  });

  return router;
}