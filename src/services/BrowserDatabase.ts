/**
 * Browser-based database using IndexedDB for storing cost data
 * Handles all data persistence in the browser without needing a backend
 */

export interface CostDataRow {
  id?: number;
  year: number;
  quarter: string;
  warehouse: string;
  type: string;
  glAccountNo: string;
  glAccountName: string;
  glAccountsGroup: string;
  costType: string;
  tcoModelCategories: string;
  opexCapex: string;
  totalIncurredCostGlAccountValue: number;
  shareDmasco: number;
  shareProceed3PL: number;
  shareAlFaris: number;
  shareJaleel: number;
  shareOthers: number;
  valueDmasco: number;
  valueProceed3PL: number;
  valueAlFaris: number;
  valueJaleel: number;
  valueOthers: number;
  // Department-specific costs
  pharmaciesCost?: number;
  distributionCost?: number;
  lastMileCost?: number;
  proceed3PLWHCost?: number;
  proceed3PLTRSCost?: number;
  warehouseCost?: number;
  transportationCost?: number;
}

export interface FilterOptions {
  year?: number;
  quarter?: string;
  warehouse?: string;
  type?: string;
  costType?: string;
  opexCapex?: string;
  category?: string;
  glAccountNo?: string;
  glAccountName?: string;
}

class BrowserDatabase {
  private dbName = 'CostDashboardDB';
  private version = 1;
  private db: IDBDatabase | null = null;
  private readonly STORE_NAME = 'costs';

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create costs object store if it doesn't exist
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          const objectStore = db.createObjectStore(this.STORE_NAME, {
            keyPath: 'id',
            autoIncrement: true
          });

          // Create indexes for efficient querying
          objectStore.createIndex('year', 'year', { unique: false });
          objectStore.createIndex('quarter', 'quarter', { unique: false });
          objectStore.createIndex('warehouse', 'warehouse', { unique: false });
          objectStore.createIndex('type', 'type', { unique: false });
          objectStore.createIndex('costType', 'costType', { unique: false });
          objectStore.createIndex('opexCapex', 'opexCapex', { unique: false });
          objectStore.createIndex('tcoModelCategories', 'tcoModelCategories', { unique: false });
          objectStore.createIndex('glAccountNo', 'glAccountNo', { unique: false });
          objectStore.createIndex('year_quarter', ['year', 'quarter'], { unique: false });
        }
      };
    });
  }

  async saveData(data: CostDataRow[], clearExisting = false): Promise<void> {
    if (!this.db) await this.initialize();

    console.log('[BrowserDatabase] Saving data:', data.length, 'rows, clearExisting:', clearExisting);

    // First clear if needed
    if (clearExisting) {
      await new Promise<void>((resolve, reject) => {
        const clearTransaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
        const clearObjectStore = clearTransaction.objectStore(this.STORE_NAME);
        console.log('[BrowserDatabase] Clearing existing data first');
        const clearRequest = clearObjectStore.clear();

        clearRequest.onsuccess = () => {
          console.log('[BrowserDatabase] Existing data cleared');
          resolve();
        };

        clearRequest.onerror = () => {
          console.error('[BrowserDatabase] Failed to clear existing data');
          reject(new Error('Failed to clear existing data'));
        };
      });
    }

    // Then add new data
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
      const objectStore = transaction.objectStore(this.STORE_NAME);

      // Add all data rows
      let addedCount = 0;
      let errorCount = 0;

      if (data.length === 0) {
        console.log('[BrowserDatabase] No data to save');
        resolve();
        return;
      }

      data.forEach((row, index) => {
        const request = objectStore.add(row);
        request.onsuccess = () => {
          addedCount++;
          if (addedCount === data.length) {
            console.log('[BrowserDatabase] Successfully saved all', addedCount, 'rows');
            resolve();
          }
        };
        request.onerror = (event) => {
          errorCount++;
          console.error('[BrowserDatabase] Failed to add row', index, ':', event);
          if (addedCount + errorCount === data.length) {
            reject(new Error(`Failed to add ${errorCount} rows to IndexedDB`));
          }
        };
      });
    });
  }

  async loadData(): Promise<CostDataRow[]> {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readonly');
      const objectStore = transaction.objectStore(this.STORE_NAME);
      const request = objectStore.getAll();

      request.onsuccess = () => {
        const data = request.result;
        console.log('[BrowserDatabase] Loaded', data.length, 'rows from IndexedDB');
        if (data.length > 0) {
          console.log('[BrowserDatabase] First row sample:', data[0]);
        }
        resolve(data);
      };

      request.onerror = () => {
        console.error('[BrowserDatabase] Failed to load data');
        reject(new Error('Failed to load data from IndexedDB'));
      };
    });
  }

  async queryData(filters: FilterOptions): Promise<CostDataRow[]> {
    console.log('[BrowserDatabase] Querying data with filters:', filters);
    const allData = await this.loadData();

    // Log sample data for debugging
    if (allData.length > 0) {
      console.log('[BrowserDatabase] Sample row year type:', typeof allData[0].year, 'value:', allData[0].year);
      console.log('[BrowserDatabase] Filter year type:', typeof filters.year, 'value:', filters.year);
    }

    const filteredData = allData.filter(row => {
      // Defensive year comparison - handle both string and number types
      if (filters.year !== undefined && filters.year !== null) {
        const filterYear = Number(filters.year);
        const rowYear = Number(row.year);
        if (!isNaN(filterYear) && !isNaN(rowYear) && filterYear !== rowYear) {
          return false;
        }
      }

      // Case-insensitive quarter comparison to handle Q1 vs q1 mismatches
      if (filters.quarter) {
        const filterQuarter = String(filters.quarter).toUpperCase().trim();
        const rowQuarter = String(row.quarter).toUpperCase().trim();
        if (filterQuarter !== rowQuarter) return false;
      }

      if (filters.warehouse && row.warehouse !== filters.warehouse) return false;
      if (filters.type && row.type !== filters.type) return false;
      if (filters.costType && row.costType !== filters.costType) return false;
      if (filters.opexCapex && row.opexCapex !== filters.opexCapex) return false;
      if (filters.category && row.tcoModelCategories !== filters.category) return false;
      if (filters.glAccountNo && row.glAccountNo !== filters.glAccountNo) return false;
      if (filters.glAccountName && !row.glAccountName.toLowerCase().includes(filters.glAccountName.toLowerCase())) return false;

      return true;
    });

    console.log('[BrowserDatabase] Filtered result:', filteredData.length, 'rows from', allData.length, 'total');
    if (filteredData.length === 0 && allData.length > 0) {
      console.warn('[BrowserDatabase] No data matched filters. Check type mismatches.');
    }
    return filteredData;
  }

  async clearAll(): Promise<void> {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
      const objectStore = transaction.objectStore(this.STORE_NAME);
      const request = objectStore.clear();

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Failed to clear IndexedDB'));
      };
    });
  }

  async getDatabaseSize(): Promise<number> {
    const data = await this.loadData();
    // Rough estimate of size in bytes
    return JSON.stringify(data).length;
  }

  async exportData(): Promise<string> {
    const data = await this.loadData();
    return JSON.stringify(data, null, 2);
  }

  async importData(jsonString: string): Promise<void> {
    try {
      const data = JSON.parse(jsonString) as CostDataRow[];
      await this.saveData(data, true);
    } catch (error) {
      throw new Error('Invalid JSON data');
    }
  }

  // Get unique values for filters
  async getFilterOptions(): Promise<{
    years: number[];
    quarters: string[];
    warehouses: string[];
    types: string[];
    costTypes: string[];
    opexCapex: string[];
    categories: string[];
  }> {
    const data = await this.loadData();

    // Debug logging for year values
    const allYears = data.map(d => d.year);
    const yearSet = new Set(allYears);
    console.log('[BrowserDatabase] getFilterOptions - All years:', allYears.slice(0, 10));
    console.log('[BrowserDatabase] getFilterOptions - Unique years:', [...yearSet]);

    const uniqueValues = {
      years: [...yearSet].filter(year => year && !isNaN(year)).sort(),
      quarters: [...new Set(data.map(d => d.quarter))].filter(Boolean).sort(),
      warehouses: [...new Set(data.map(d => d.warehouse))].filter(Boolean).sort(),
      types: [...new Set(data.map(d => d.type))].filter(Boolean).sort(),
      costTypes: [...new Set(data.map(d => d.costType))].filter(Boolean).sort(),
      opexCapex: [...new Set(data.map(d => d.opexCapex))].filter(Boolean).sort(),
      categories: [...new Set(data.map(d => d.tcoModelCategories))].filter(Boolean).sort(),
    };

    console.log('[BrowserDatabase] getFilterOptions - Final years:', uniqueValues.years);

    return uniqueValues;
  }
}

// Export singleton instance
export const browserDatabase = new BrowserDatabase();