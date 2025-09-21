"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseManager = void 0;
const sqlite3 = __importStar(require("sqlite3"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
class DatabaseManager {
    constructor() {
        this.db = null;
        this.dataDir = path_1.default.join(__dirname, '../../data');
    }
    async initialize(config) {
        return new Promise((resolve) => {
            try {
                // Create data directory if it doesn't exist
                if (!fs_1.default.existsSync(this.dataDir)) {
                    fs_1.default.mkdirSync(this.dataDir, { recursive: true });
                }
                const dbPath = path_1.default.join(this.dataDir, 'costs.db');
                this.db = new sqlite3.Database(dbPath, (err) => {
                    if (err) {
                        resolve({
                            success: false,
                            error: `Database initialization failed: ${err.message}`
                        });
                    }
                    else {
                        // Enable foreign keys and create tables
                        this.db.run('PRAGMA foreign_keys = ON', (err) => {
                            if (err) {
                                resolve({
                                    success: false,
                                    error: `Failed to enable foreign keys: ${err.message}`
                                });
                            }
                            else {
                                this.createTables((err) => {
                                    if (err) {
                                        resolve({
                                            success: false,
                                            error: `Failed to create tables: ${err.message}`
                                        });
                                    }
                                    else {
                                        console.log(`Database initialized at ${dbPath}`);
                                        resolve({ success: true });
                                    }
                                });
                            }
                        });
                    }
                });
            }
            catch (error) {
                resolve({
                    success: false,
                    error: `Database initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`
                });
            }
        });
    }
    createTables(callback) {
        if (!this.db) {
            callback(new Error('Database not initialized'));
            return;
        }
        const createTableSQL = `
      CREATE TABLE IF NOT EXISTS cost_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        year INTEGER NOT NULL,
        quarter TEXT NOT NULL,
        warehouse TEXT,
        type TEXT,
        gl_account_no TEXT,
        gl_account_name TEXT,
        gl_accounts_group TEXT,
        cost_type TEXT,
        tco_model_categories TEXT,
        main_categories TEXT,
        opex_capex TEXT,
        total_incurred_cost REAL,
        share_wh REAL,
        share_trs REAL,
        share_distribution REAL,
        share_last_mile REAL,
        share_proceed_3pl_wh REAL,
        share_proceed_3pl_trs REAL,
        value_wh REAL,
        value_trs REAL,
        value_distribution REAL,
        value_last_mile REAL,
        value_proceed_3pl_wh REAL,
        value_proceed_3pl_trs REAL,
        total_pharmacy_dist_lm REAL,
        total_proceed_3pl REAL,
        current_expected_cost REAL,
        total_distribution_cost REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;
        const createIndexes = [
            'CREATE INDEX IF NOT EXISTS idx_year_quarter ON cost_data(year, quarter)',
            'CREATE INDEX IF NOT EXISTS idx_warehouse ON cost_data(warehouse)',
            'CREATE INDEX IF NOT EXISTS idx_cost_type ON cost_data(cost_type)',
            'CREATE INDEX IF NOT EXISTS idx_opex_capex ON cost_data(opex_capex)',
            'CREATE INDEX IF NOT EXISTS idx_tco_categories ON cost_data(tco_model_categories)',
            // Unique constraint to prevent duplicate entries for same GL account in same quarter
            'CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_entry ON cost_data(year, quarter, gl_account_no, warehouse, type)'
        ];
        const createUploadHistorySQL = `
      CREATE TABLE IF NOT EXISTS upload_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT NOT NULL,
        upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        rows_processed INTEGER,
        status TEXT,
        error_message TEXT,
        user TEXT,
        file_size INTEGER
      )
    `;
        // Run all SQL statements
        this.db.serialize(() => {
            this.db.run(createTableSQL, (err) => {
                if (err) {
                    callback(err);
                    return;
                }
                this.db.run(createUploadHistorySQL, (err) => {
                    if (err) {
                        callback(err);
                        return;
                    }
                    let remaining = createIndexes.length;
                    let hasError = false;
                    createIndexes.forEach(sql => {
                        this.db.run(sql, (err) => {
                            if (err && !hasError) {
                                hasError = true;
                                callback(err);
                            }
                            else {
                                remaining--;
                                if (remaining === 0 && !hasError) {
                                    callback(null);
                                }
                            }
                        });
                    });
                });
            });
        });
    }
    async insertCostData(data) {
        return new Promise((resolve) => {
            if (!this.db) {
                resolve({ success: false, error: 'Database not initialized' });
                return;
            }
            const sql = `
        INSERT OR REPLACE INTO cost_data (
          year, quarter, warehouse, type, gl_account_no, gl_account_name,
          gl_accounts_group, cost_type, tco_model_categories, main_categories,
          opex_capex, total_incurred_cost,
          share_wh, share_trs, share_distribution, share_last_mile,
          share_proceed_3pl_wh, share_proceed_3pl_trs,
          value_wh, value_trs, value_distribution, value_last_mile,
          value_proceed_3pl_wh, value_proceed_3pl_trs,
          total_pharmacy_dist_lm, total_proceed_3pl,
          current_expected_cost, total_distribution_cost
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        )
      `;
            this.db.run(sql, [
                data.year, data.quarter, data.warehouse, data.type,
                data.glAccountNo, data.glAccountName, data.glAccountsGroup, data.costType,
                data.tcoModelCategories, data.mainCategories, data.opexCapex, data.totalIncurredCost,
                data.shareWH, data.shareTRS, data.shareDistribution, data.shareLastMile,
                data.shareProceed3PLWH, data.shareProceed3PLTRS,
                data.valueWH, data.valueTRS, data.valueDistribution, data.valueLastMile,
                data.valueProceed3PLWH, data.valueProceed3PLTRS,
                data.totalPharmacyDistLM, data.totalProceed3PL,
                data.currentExpectedCost, data.totalDistributionCost
            ], function (err) {
                if (err) {
                    resolve({
                        success: false,
                        error: `Failed to insert data: ${err.message}`
                    });
                }
                else {
                    resolve({ success: true, id: this.lastID });
                }
            });
        });
    }
    async bulkInsertCostData(data) {
        return new Promise((resolve) => {
            if (!this.db) {
                resolve({ success: false, error: 'Database not initialized' });
                return;
            }
            const sql = `
        INSERT OR REPLACE INTO cost_data (
          year, quarter, warehouse, type, gl_account_no, gl_account_name,
          gl_accounts_group, cost_type, tco_model_categories, main_categories,
          opex_capex, total_incurred_cost,
          share_wh, share_trs, share_distribution, share_last_mile,
          share_proceed_3pl_wh, share_proceed_3pl_trs,
          value_wh, value_trs, value_distribution, value_last_mile,
          value_proceed_3pl_wh, value_proceed_3pl_trs,
          total_pharmacy_dist_lm, total_proceed_3pl,
          current_expected_cost, total_distribution_cost
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        )
      `;
            let rowsInserted = 0;
            let hasError = false;
            this.db.serialize(() => {
                this.db.run('BEGIN TRANSACTION');
                const stmt = this.db.prepare(sql);
                for (const row of data) {
                    stmt.run([
                        row.year, row.quarter, row.warehouse, row.type,
                        row.glAccountNo, row.glAccountName, row.glAccountsGroup, row.costType,
                        row.tcoModelCategories, row.mainCategories, row.opexCapex, row.totalIncurredCost,
                        row.shareWH, row.shareTRS, row.shareDistribution, row.shareLastMile,
                        row.shareProceed3PLWH, row.shareProceed3PLTRS,
                        row.valueWH, row.valueTRS, row.valueDistribution, row.valueLastMile,
                        row.valueProceed3PLWH, row.valueProceed3PLTRS,
                        row.totalPharmacyDistLM, row.totalProceed3PL,
                        row.currentExpectedCost, row.totalDistributionCost
                    ], (err) => {
                        if (err) {
                            hasError = true;
                        }
                        else {
                            rowsInserted++;
                        }
                    });
                }
                stmt.finalize((err) => {
                    if (err || hasError) {
                        this.db.run('ROLLBACK', () => {
                            resolve({
                                success: false,
                                error: `Bulk insert failed: ${err ? err.message : 'Unknown error'}`
                            });
                        });
                    }
                    else {
                        this.db.run('COMMIT', () => {
                            resolve({ success: true, rowsInserted });
                        });
                    }
                });
            });
        });
    }
    async getAllCostData() {
        return new Promise((resolve) => {
            if (!this.db) {
                resolve([]);
                return;
            }
            const sql = 'SELECT * FROM cost_data ORDER BY year DESC, quarter DESC';
            this.db.all(sql, (err, rows) => {
                if (err) {
                    console.error('Error fetching data:', err);
                    resolve([]);
                }
                else {
                    resolve(rows.map(this.mapRowToModel));
                }
            });
        });
    }
    async getCostDataByFilters(filters) {
        return new Promise((resolve) => {
            if (!this.db) {
                resolve([]);
                return;
            }
            let query = 'SELECT * FROM cost_data WHERE 1=1';
            const params = [];
            if (filters.year) {
                query += ' AND year = ?';
                params.push(filters.year);
            }
            if (filters.quarter) {
                query += ' AND quarter = ?';
                params.push(filters.quarter);
            }
            if (filters.warehouse) {
                query += ' AND warehouse = ?';
                params.push(filters.warehouse);
            }
            if (filters.type) {
                query += ' AND type = ?';
                params.push(filters.type);
            }
            if (filters.costType) {
                query += ' AND cost_type = ?';
                params.push(filters.costType);
            }
            if (filters.opexCapex) {
                // Case-insensitive comparison for OPEX/CAPEX filter
                query += ' AND UPPER(opex_capex) = UPPER(?)';
                params.push(filters.opexCapex);
            }
            query += ' ORDER BY year DESC, quarter DESC';
            this.db.all(query, params, (err, rows) => {
                if (err) {
                    console.error('Error fetching filtered data:', err);
                    resolve([]);
                }
                else {
                    resolve(rows.map(this.mapRowToModel));
                }
            });
        });
    }
    async clearAllData() {
        return new Promise((resolve) => {
            if (!this.db) {
                resolve({ success: false, error: 'Database not initialized' });
                return;
            }
            this.db.run('DELETE FROM cost_data', (err) => {
                if (err) {
                    resolve({
                        success: false,
                        error: `Failed to clear data: ${err.message}`
                    });
                }
                else {
                    resolve({ success: true });
                }
            });
        });
    }
    /**
     * Execute a custom SQL query with parameters
     * Used for flexible aggregations in playground
     */
    async executeQuery(query, params = []) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database not initialized'));
                return;
            }
            this.db.all(query, params, (err, rows) => {
                if (err) {
                    console.error('Query execution error:', err);
                    reject(err);
                }
                else {
                    resolve(rows || []);
                }
            });
        });
    }
    mapRowToModel(row) {
        return {
            year: row.year,
            quarter: row.quarter,
            warehouse: row.warehouse,
            type: row.type,
            glAccountNo: row.gl_account_no,
            glAccountName: row.gl_account_name,
            glAccountsGroup: row.gl_accounts_group || '',
            costType: row.cost_type,
            tcoModelCategories: row.tco_model_categories,
            mainCategories: row.main_categories || '',
            opexCapex: row.opex_capex,
            totalIncurredCost: row.total_incurred_cost,
            shareWH: row.share_wh,
            shareTRS: row.share_trs,
            shareDistribution: row.share_distribution,
            shareLastMile: row.share_last_mile,
            shareProceed3PLWH: row.share_proceed_3pl_wh,
            shareProceed3PLTRS: row.share_proceed_3pl_trs,
            valueWH: row.value_wh,
            valueTRS: row.value_trs,
            valueDistribution: row.value_distribution,
            valueLastMile: row.value_last_mile,
            valueProceed3PLWH: row.value_proceed_3pl_wh,
            valueProceed3PLTRS: row.value_proceed_3pl_trs,
            totalPharmacyDistLM: row.total_pharmacy_dist_lm,
            totalProceed3PL: row.total_proceed_3pl,
            currentExpectedCost: row.current_expected_cost,
            totalDistributionCost: row.total_distribution_cost,
        };
    }
    close() {
        if (this.db) {
            this.db.close();
            this.db = null;
        }
    }
}
exports.DatabaseManager = DatabaseManager;
