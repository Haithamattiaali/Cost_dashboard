import { Router, Request, Response } from 'express';
import { DatabaseManager } from '../database/DatabaseManager';

// Valid dimensions for grouping
const VALID_DIMENSIONS = [
  'type',
  'year',
  'quarter',
  'warehouse',
  'gl_account_no',
  'gl_account_name',
  'gl_accounts_group',
  'cost_type',
  'tco_model_categories',
  'main_categories',
  'opex_capex',
];

// Valid measures for aggregation
const VALID_MEASURES = [
  'total_incurred_cost',
  'value_wh',
  'value_trs',
  'value_distribution',
  'value_last_mile',
  'value_proceed_3pl_wh',
  'value_proceed_3pl_trs',
];

export function playgroundRoutes(): Router {
  const router = Router();

  /**
   * Get aggregated data for multiple measures
   * Query params:
   * - dimension: field to group by
   * - measures: comma-separated list of measures
   */
  router.get('/aggregate-multi', async (req: Request, res: Response) => {
    try {
      const { dimension, measures, ...filters } = req.query;

      // Validate required parameters
      if (!dimension || !measures) {
        return res.status(400).json({
          success: false,
          error: 'Both dimension and measures parameters are required',
        });
      }

      // Parse measures from comma-separated string
      const measuresList = (measures as string).split(',').map(m => m.trim());

      // Validate dimension
      if (!VALID_DIMENSIONS.includes(dimension as string)) {
        return res.status(400).json({
          success: false,
          error: `Invalid dimension. Valid dimensions are: ${VALID_DIMENSIONS.join(', ')}`,
        });
      }

      // Validate all measures
      for (const measure of measuresList) {
        if (!VALID_MEASURES.includes(measure)) {
          return res.status(400).json({
            success: false,
            error: `Invalid measure: ${measure}. Valid measures are: ${VALID_MEASURES.join(', ')}`,
          });
        }
      }

      // Limit to 4 measures for readability
      if (measuresList.length > 4) {
        return res.status(400).json({
          success: false,
          error: 'Maximum 4 measures allowed per visualization',
        });
      }

      // Initialize database
      const db = new DatabaseManager();
      await db.initialize({});

      // Build WHERE clause from filters
      const whereClauses: string[] = [];
      const params: any[] = [];

      if (filters.year) {
        whereClauses.push('year = ?');
        params.push(parseInt(filters.year as string));
      }
      if (filters.quarter) {
        whereClauses.push('quarter = ?');
        params.push(filters.quarter);
      }
      if (filters.warehouse) {
        whereClauses.push('warehouse = ?');
        params.push(filters.warehouse);
      }
      if (filters.type) {
        whereClauses.push('type = ?');
        params.push(filters.type);
      }
      if (filters.costType) {
        whereClauses.push('cost_type = ?');
        params.push(filters.costType);
      }
      if (filters.opexCapex) {
        whereClauses.push('opex_capex = ?');
        params.push(filters.opexCapex);
      }

      const whereClause = whereClauses.length > 0
        ? `WHERE ${whereClauses.join(' AND ')}`
        : '';

      // Build dynamic SQL with multiple SUM aggregations
      const measureSelects = measuresList.map(m => `SUM(${m}) as ${m}`).join(', ');

      const query = `
        SELECT
          ${dimension} as name,
          ${measureSelects}
        FROM cost_data
        ${whereClause}
        GROUP BY ${dimension}
        HAVING ${dimension} IS NOT NULL AND ${dimension} != ''
        ORDER BY ${measuresList[0]} DESC
      `;

      console.log('Multi-measure query:', query);
      console.log('Query params:', params);

      // Execute the query
      const data = await db.executeQuery(query, params);

      // Transform data for frontend - structure with measure keys
      const transformedData = data.map((row: any) => {
        const result: any = {
          name: row.name || 'Unknown',
        };

        // Add each measure value
        measuresList.forEach(measure => {
          result[measure] = parseFloat(row[measure]) || 0;
        });

        return result;
      });

      // Filter out rows where all measures are zero
      const filteredData = transformedData.filter((item: any) => {
        return measuresList.some(measure => item[measure] > 0);
      });

      res.json({
        success: true,
        data: filteredData,
        dimension: dimension as string,
        measures: measuresList,
        totalRows: filteredData.length,
      });

    } catch (error) {
      console.error('Error in multi-measure aggregate:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch multi-measure aggregated data',
      });
    }
  });

  /**
   * Get aggregated data for playground visualization
   * Query params:
   * - dimension: field to group by (e.g., 'warehouse', 'type', 'year')
   * - measure: field to sum (e.g., 'total_incurred_cost', 'value_wh')
   * - Additional filter params (year, quarter, warehouse, etc.)
   */
  router.get('/aggregate', async (req: Request, res: Response) => {
    try {
      const { dimension, measure, ...filters } = req.query;

      // Validate required parameters
      if (!dimension || !measure) {
        return res.status(400).json({
          success: false,
          error: 'Both dimension and measure parameters are required',
        });
      }

      // Validate dimension
      if (!VALID_DIMENSIONS.includes(dimension as string)) {
        return res.status(400).json({
          success: false,
          error: `Invalid dimension. Valid dimensions are: ${VALID_DIMENSIONS.join(', ')}`,
        });
      }

      // Validate measure
      if (!VALID_MEASURES.includes(measure as string)) {
        return res.status(400).json({
          success: false,
          error: `Invalid measure. Valid measures are: ${VALID_MEASURES.join(', ')}`,
        });
      }

      // Initialize database
      const db = new DatabaseManager();
      await db.initialize({});

      // Build dynamic SQL query
      const dimensionField = dimension as string;
      const measureField = measure as string;

      // Build WHERE clause from filters
      const whereClauses: string[] = [];
      const params: any[] = [];

      // Add filters if provided
      if (filters.year) {
        whereClauses.push('year = ?');
        params.push(parseInt(filters.year as string));
      }
      if (filters.quarter) {
        whereClauses.push('quarter = ?');
        params.push(filters.quarter);
      }
      if (filters.warehouse) {
        whereClauses.push('warehouse = ?');
        params.push(filters.warehouse);
      }
      if (filters.type) {
        whereClauses.push('type = ?');
        params.push(filters.type);
      }
      if (filters.costType) {
        whereClauses.push('cost_type = ?');
        params.push(filters.costType);
      }
      if (filters.opexCapex) {
        whereClauses.push('opex_capex = ?');
        params.push(filters.opexCapex);
      }

      const whereClause = whereClauses.length > 0
        ? `WHERE ${whereClauses.join(' AND ')}`
        : '';

      // Build the aggregation query
      const query = `
        SELECT
          ${dimensionField} as name,
          SUM(${measureField}) as value
        FROM cost_data
        ${whereClause}
        GROUP BY ${dimensionField}
        HAVING ${dimensionField} IS NOT NULL AND ${dimensionField} != ''
        ORDER BY value DESC
      `;

      console.log('Playground query:', query);
      console.log('Query params:', params);

      // Execute the query
      const data = await db.executeQuery(query, params);

      // Transform data for frontend
      const transformedData = data.map((row: any) => ({
        name: row.name || 'Unknown',
        value: parseFloat(row.value) || 0,
      }));

      // Filter out zero values
      const filteredData = transformedData.filter((item: any) => item.value > 0);

      res.json({
        success: true,
        data: filteredData,
        dimension: dimensionField,
        measure: measureField,
        totalRows: filteredData.length,
      });

    } catch (error) {
      console.error('Error in playground aggregate:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch aggregated data',
      });
    }
  });

  /**
   * Get available dimensions and measures
   * This endpoint provides metadata about available fields for visualization
   */
  router.get('/metadata', async (req: Request, res: Response) => {
    try {
      res.json({
        success: true,
        dimensions: VALID_DIMENSIONS.map(d => ({
          value: d,
          label: d.split('_').map(w =>
            w.charAt(0).toUpperCase() + w.slice(1)
          ).join(' '),
        })),
        measures: VALID_MEASURES.map(m => ({
          value: m,
          label: m.split('_').map(w =>
            w.charAt(0).toUpperCase() + w.slice(1)
          ).join(' '),
        })),
      });
    } catch (error) {
      console.error('Error fetching metadata:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch metadata',
      });
    }
  });

  /**
   * Get top N items for a dimension/measure combination
   */
  router.get('/top', async (req: Request, res: Response) => {
    try {
      const { dimension, measure, limit = '10', ...filters } = req.query;

      // Validate parameters
      if (!dimension || !measure) {
        return res.status(400).json({
          success: false,
          error: 'Both dimension and measure parameters are required',
        });
      }

      if (!VALID_DIMENSIONS.includes(dimension as string)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid dimension',
        });
      }

      if (!VALID_MEASURES.includes(measure as string)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid measure',
        });
      }

      const db = new DatabaseManager();
      await db.initialize({});

      // Build WHERE clause
      const whereClauses: string[] = [];
      const params: any[] = [];

      if (filters.year) {
        whereClauses.push('year = ?');
        params.push(parseInt(filters.year as string));
      }
      if (filters.quarter) {
        whereClauses.push('quarter = ?');
        params.push(filters.quarter);
      }

      const whereClause = whereClauses.length > 0
        ? `WHERE ${whereClauses.join(' AND ')}`
        : '';

      // Add limit to params
      params.push(parseInt(limit as string));

      const query = `
        SELECT
          ${dimension} as name,
          SUM(${measure}) as value
        FROM cost_data
        ${whereClause}
        GROUP BY ${dimension}
        HAVING ${dimension} IS NOT NULL AND ${dimension} != ''
        ORDER BY value DESC
        LIMIT ?
      `;

      const data = await db.executeQuery(query, params);

      const transformedData = data.map((row: any) => ({
        name: row.name || 'Unknown',
        value: parseFloat(row.value) || 0,
      }));

      res.json({
        success: true,
        data: transformedData,
        dimension: dimension as string,
        measure: measure as string,
        limit: parseInt(limit as string),
      });

    } catch (error) {
      console.error('Error fetching top items:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch top items',
      });
    }
  });

  return router;
}