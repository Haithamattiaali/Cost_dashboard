# PROCEED Cost Dashboard

A comprehensive Total Cost of Ownership (TCO) analytics dashboard built with the PROCEED SDK, designed to visualize and analyze cost data across different dimensions including warehouses, quarters, and business divisions.

## Features

- **📊 Interactive Dashboard**: Real-time cost visualization with charts and metrics
- **📁 Excel Data Import**: Upload and process cost data from Excel files
- **🔍 Advanced Filtering**: Filter by year, quarter, warehouse, type, and more
- **📈 Period Comparison**: Compare costs across quarters and years
- **🎨 PROCEED Branding**: Fully branded with PROCEED colors and design system
- **💾 SQLite Database**: Efficient local data storage and querying
- **🚀 Built with PROCEED SDK**: Leveraging enterprise-grade components

## Project Structure

```
cost_dashboard_vis3/
├── backend/               # Express.js backend server
│   ├── server.ts         # Main server configuration
│   ├── database/         # Database management
│   ├── etl/              # Excel processing & data transformation
│   └── routes/           # API endpoints
├── src/                  # React frontend
│   ├── pages/            # Dashboard pages
│   ├── components/       # Reusable UI components
│   ├── api/              # API client utilities
│   └── utils/            # Helper functions
├── proceed-sdk/          # PROCEED SDK packages
└── data/                 # Database storage (created on first run)
```

## Prerequisites

- Node.js v18+ and npm v9+
- Modern web browser (Chrome, Firefox, Safari, Edge)

## Installation & Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Build the PROCEED SDK packages:**
```bash
cd proceed-sdk
npm install
npm run build
cd ..
```

3. **Start the development servers:**
```bash
# Start both backend and frontend
npm run dev

# Or start separately:
# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Frontend
npm run dev:frontend
```

4. **Access the dashboard:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001/api

## Usage

### 1. Upload Data

Navigate to the **Upload Data** page to import your Excel file:
- Click "Select File" or drag and drop your Excel file
- Optionally check "Clear existing data" to replace all data
- Click "Upload File" to process and import the data

### 2. View Dashboard

The main **Dashboard** page shows:
- Key metrics (Total Cost, OPEX, CAPEX, DMASCO, PROCEED 3PL)
- Cost trends by quarter
- Cost distribution pie chart
- Cost by warehouse and TCO categories
- Top expenses table

### 3. Compare Periods

Use the **Comparison** page to:
- Compare quarters side-by-side
- Perform year-over-year analysis
- View changes and trends

### 4. Deep Analysis

The **Analysis** page allows you to:
- Analyze costs by different dimensions
- View detailed breakdowns
- Export data for further analysis

## Excel File Format

Your Excel file should contain these columns:
- Year, Quarter, Warehouse, Type
- GL Account No, GL Account Name
- Cost Type, TCO Model Categories
- Opex/Capex
- Total Incurred Cost (GL account value)
- Share percentages for different divisions
- Value calculations for each division

## API Endpoints

- `GET /api/health` - Health check
- `POST /api/upload/excel` - Upload Excel file
- `GET /api/costs` - Get cost data with filters
- `GET /api/costs/dashboard` - Get dashboard metrics
- `GET /api/costs/filters` - Get available filter options
- `GET /api/comparisons/quarters` - Compare quarters
- `GET /api/comparisons/year-over-year` - Compare years

## Production Build

```bash
# Build both frontend and backend
npm run build

# Start production server
npm start
```

## Configuration

Edit `config.json` to customize:
- API settings
- Database location
- UI theme and branding
- Feature toggles
- Security settings

## PROCEED Brand Colors

- Primary: #9e1f63 (Blood Rush Red)
- Secondary: #424046 (Cement Grey)
- Accent: #e05e3d (Coral)
- Blue: #005b8c (Accent Blue)

## Technology Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, Recharts
- **Backend**: Node.js, Express, TypeScript
- **Database**: SQLite with better-sqlite3
- **SDK**: PROCEED SDK components
- **State Management**: React Query
- **Styling**: Tailwind CSS with custom PROCEED theme

## Troubleshooting

### Database Issues
- Delete the `data/costs.db` file to reset the database
- Check file permissions in the data directory

### Upload Errors
- Ensure Excel file follows the required format
- Check file size (max 50MB)
- Verify all required columns are present

### Port Conflicts
- Backend runs on port 3001 by default
- Frontend runs on port 5173 by default
- Update ports in config.json if needed

## License

© 2025 PROCEED. All rights reserved.