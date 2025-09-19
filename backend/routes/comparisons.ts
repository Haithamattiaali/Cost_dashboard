import { Router, Request, Response } from 'express';
import { DatabaseManager } from '../database/DatabaseManager';
import { CostTransformer } from '../etl/CostTransformer';

export function comparisonRoutes(): Router {
  const router = Router();

  // Compare two quarters
  router.get('/quarters', async (req: Request, res: Response) => {
    try {
      const db = new DatabaseManager();
      await db.initialize({});

      const currentYear = parseInt(req.query.currentYear as string);
      const currentQuarter = req.query.currentQuarter as string;
      const previousYear = parseInt(req.query.previousYear as string);
      const previousQuarter = req.query.previousQuarter as string;

      if (!currentYear || !currentQuarter || !previousYear || !previousQuarter) {
        return res.status(400).json({
          error: 'Missing required parameters: currentYear, currentQuarter, previousYear, previousQuarter'
        });
      }

      const data = await db.getAllCostData();
      const transformer = new CostTransformer(data);

      const comparison = transformer.comparePeriods(
        row => row.year === currentYear && row.quarter === currentQuarter,
        row => row.year === previousYear && row.quarter === previousQuarter
      );

      // Calculate summary metrics
      const currentTotal = comparison.reduce((sum, item) => sum + item.current.totalCost, 0);
      const previousTotal = comparison.reduce((sum, item) => sum + (item.previous?.totalCost || 0), 0);

      res.json({
        success: true,
        comparison: {
          current: { year: currentYear, quarter: currentQuarter, total: currentTotal },
          previous: { year: previousYear, quarter: previousQuarter, total: previousTotal },
          change: {
            amount: currentTotal - previousTotal,
            percentage: previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal) * 100 : 0
          },
          details: comparison
        }
      });
    } catch (error) {
      console.error('Error comparing quarters:', error);
      res.status(500).json({ error: 'Failed to compare quarters' });
    }
  });

  // Compare year-over-year
  router.get('/year-over-year', async (req: Request, res: Response) => {
    try {
      const db = new DatabaseManager();
      await db.initialize({});

      const currentYear = parseInt(req.query.currentYear as string);
      const previousYear = parseInt(req.query.previousYear as string) || currentYear - 1;

      if (!currentYear) {
        return res.status(400).json({ error: 'Missing required parameter: currentYear' });
      }

      const data = await db.getAllCostData();
      const transformer = new CostTransformer(data);

      const comparison = transformer.comparePeriods(
        row => row.year === currentYear,
        row => row.year === previousYear
      );

      const currentTotal = comparison.reduce((sum, item) => sum + item.current.totalCost, 0);
      const previousTotal = comparison.reduce((sum, item) => sum + (item.previous?.totalCost || 0), 0);

      res.json({
        success: true,
        comparison: {
          currentYear,
          previousYear,
          currentTotal,
          previousTotal,
          change: {
            amount: currentTotal - previousTotal,
            percentage: previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal) * 100 : 0
          },
          byWarehouse: comparison
        }
      });
    } catch (error) {
      console.error('Error comparing years:', error);
      res.status(500).json({ error: 'Failed to compare years' });
    }
  });

  // Compare by custom filters
  router.post('/custom', async (req: Request, res: Response) => {
    try {
      const db = new DatabaseManager();
      await db.initialize({});

      const { currentFilters, previousFilters } = req.body;

      if (!currentFilters || !previousFilters) {
        return res.status(400).json({
          error: 'Missing required parameters: currentFilters, previousFilters'
        });
      }

      const data = await db.getAllCostData();
      const transformer = new CostTransformer(data);

      const currentData = transformer.filterData(currentFilters);
      const previousData = transformer.filterData(previousFilters);

      const currentTransformer = new CostTransformer(currentData);
      const previousTransformer = new CostTransformer(previousData);

      const currentMetrics = currentTransformer.getDashboardMetrics();
      const previousMetrics = previousTransformer.getDashboardMetrics();

      res.json({
        success: true,
        comparison: {
          current: currentMetrics,
          previous: previousMetrics,
          change: {
            totalCost: {
              amount: currentMetrics.totalCost - previousMetrics.totalCost,
              percentage: previousMetrics.totalCost > 0
                ? ((currentMetrics.totalCost - previousMetrics.totalCost) / previousMetrics.totalCost) * 100
                : 0
            },
            opex: {
              amount: currentMetrics.totalOpex - previousMetrics.totalOpex,
              percentage: previousMetrics.totalOpex > 0
                ? ((currentMetrics.totalOpex - previousMetrics.totalOpex) / previousMetrics.totalOpex) * 100
                : 0
            },
            capex: {
              amount: currentMetrics.totalCapex - previousMetrics.totalCapex,
              percentage: previousMetrics.totalCapex > 0
                ? ((currentMetrics.totalCapex - previousMetrics.totalCapex) / previousMetrics.totalCapex) * 100
                : 0
            }
          }
        }
      });
    } catch (error) {
      console.error('Error comparing with custom filters:', error);
      res.status(500).json({ error: 'Failed to compare with custom filters' });
    }
  });

  return router;
}