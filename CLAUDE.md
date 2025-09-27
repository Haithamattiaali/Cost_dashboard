# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
```bash
# Start both backend (port 3001) and frontend (port 5173)
npm run dev

# If port 3001 is already in use, kill it first:
lsof -ti :3001 | xargs kill -9

# Start separately
npm run dev:backend  # Backend API on port 3001
npm run dev:frontend # Frontend on port 5173
```

### Build & Production
```bash
npm run build         # Build both frontend and backend
npm run build:backend # Build backend only
npm run build:frontend # Build frontend only
npm start            # Start production server
```

### Code Quality
```bash
npm run lint         # Run ESLint
npm run format       # Format with Prettier
npm run test         # Run tests with Vitest
```

## Architecture

### Full-Stack Cost Analytics Dashboard
This is a React/TypeScript dashboard for Total Cost of Ownership (TCO) analytics with an Express backend and SQLite database.

### Key Architectural Components

1. **Backend API (Express + TypeScript)**
   - `backend/server.ts`: Main server with configuration loading from `config.json`
   - `backend/database/DatabaseManager.ts`: SQLite database operations using better-sqlite3
   - `backend/etl/ExcelProcessor.ts`: Excel file parsing and validation
   - `backend/etl/CostTransformer.ts`: Data transformation and normalization
   - Routes: `/api/costs`, `/api/upload`, `/api/comparisons`, `/api/filters`, `/api/playground`

2. **Frontend (React + TypeScript + Vite)**
   - `src/pages/Dashboard.tsx`: Main dashboard with charts (Recharts) and metrics
     - Uses comparison mode for period-over-period analysis
     - Complex label positioning logic for TCO Model Categories chart (lines 2864-3085)
   - `src/modules/data-table/`: Enterprise data grid with search, filtering, and selection
     - Interactive search with auto-selection based on filter matches
     - Column-specific and global search capabilities
   - `src/utils/periods.ts`: Period normalization for quarter/month/year handling
   - `src/utils/search.ts`: Advanced search with diacritics/Arabic support

3. **Data Flow**
   - Excel upload → ETL processing → SQLite storage → API queries → React Query cache → UI components
   - Real-time filtering and aggregation at database level
   - Client-side search and filtering for data tables

### PROCEED Brand System
- Primary color: `#9e1f63` (Blood Rush Red)
- Secondary: `#424046` (Cement Grey)
- Accent: `#e05e3d` (Coral)
- Blue: `#005b8c` (Accent Blue)

### Database Schema
SQLite database at `data/costs.db` with main `costs` table containing:
- Period data: year, quarter, warehouse
- GL accounts: glAccountNo, glAccountName, glAccountsGroup
- Cost categories: type, costType, tcoModelCategories, opexCapex
- Division allocations: shareDmsco, shareProceed3PL, etc.

### State Management
- **React Query** for server state and caching
- **React hooks** for local state
- **URL params** for shareable filter states

## Critical Files & Functions

### Dashboard Label Positioning (src/pages/Dashboard.tsx)
Lines 2864-3085 contain complex label positioning logic for comparison charts:
- Period 1 labels go below data points
- Period 2 labels go above data points
- Special collision detection for "Other" category (index 6)
- Leader lines with quadratic Bezier curves for displaced labels

### Data Table Search (src/modules/data-table/index.tsx)
- `handleManualRowSelection` must be defined before `useReactTable` hook
- Auto-selection logic triggered when search reduces results to ≤10 rows
- Debounced search handlers to prevent performance issues

### Period Handling (src/utils/periods.ts)
- `extractAvailablePeriods()`: Detects and normalizes periods from data
- `normalizeRowToPeriod()`: Converts various date formats to standard Period objects
- Supports quarter (Q1-Q4), month, and year granularities

## Common Issues & Solutions

### Port Already in Use
```bash
# Kill process on port 3001
lsof -ti :3001 | xargs kill -9
# Or kill all dev processes
pkill -f "npm run dev"
```

### Database Reset
```bash
rm data/costs.db  # Delete database to start fresh
```

### TypeScript Errors
- Variable used before declaration: Move function definitions before usage
- Duplicate declarations: Check for HMR/Babel parser issues, restart dev server

## Excel Upload Format
Required columns:
- Year, Quarter, Warehouse, Type
- GL Account No, GL Account Name, GL Accounts Group
- Cost Type, TCO Model Categories, Opex/Capex
- Total Incurred Cost (GL account value)
- Share percentages: Share Dmsco (%), Share PROCEED 3PL (%), etc.
- Value calculations: Value Dmsco, Value PROCEED 3PL, etc.