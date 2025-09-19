# Proceed SDK Quick Start Guide

Get up and running with a revenue dashboard in under 5 minutes!

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Basic knowledge of React and TypeScript

## Installation Methods

### Method 1: Using CLI (Recommended)

```bash
# Install the CLI globally
npm install -g @proceed/cli

# Create a new project
proceed create my-revenue-dashboard

# Navigate to project
cd my-revenue-dashboard

# Start development server
npm run dev
```

### Method 2: Manual Setup

```bash
# Create project directory
mkdir my-dashboard && cd my-dashboard

# Initialize package.json
npm init -y

# Install SDK packages
npm install @proceed/core @proceed/components @proceed/backend

# Install peer dependencies
npm install react react-dom express

# Install dev dependencies
npm install -D typescript vite @types/react @types/node
```

## Project Structure

```
my-dashboard/
├── backend/
│   ├── server.ts         # Backend server
│   ├── routes/            # API routes
│   └── services/          # Business logic
├── frontend/
│   ├── src/
│   │   ├── App.tsx        # Main app component
│   │   ├── pages/         # Page components
│   │   └── components/    # Custom components
│   └── index.html
├── config.json            # SDK configuration
├── package.json
└── tsconfig.json
```

## Step 1: Configure the SDK

Create `config.json`:

```json
{
  "name": "My Revenue Dashboard",
  "version": "1.0.0",
  "environment": "development",

  "api": {
    "baseUrl": "http://localhost:3001/api",
    "timeout": 30000
  },

  "database": {
    "type": "sqlite",
    "database": "./data/revenue.db"
  },

  "ui": {
    "theme": "light",
    "primaryColor": "#1E40AF"
  },

  "features": {
    "dashboard": true,
    "analytics": true,
    "export": true
  }
}
```

## Step 2: Create Backend Server

Create `backend/server.ts`:

```typescript
import { createServer, startServer } from '@proceed/backend';
import { ConfigManager } from '@proceed/core';
import express from 'express';

async function main() {
  // Initialize configuration
  const config = ConfigManager.getInstance();
  await config.initialize({
    configFile: '../config.json'
  });

  // Create server with SDK
  const result = await createServer({
    port: 3001,
    cors: {
      enabled: true,
      origins: ['http://localhost:5173']
    },
    routes: [
      {
        method: 'GET',
        path: '/api/revenue',
        handler: async (req, res) => {
          // Mock data - replace with database query
          res.json({
            success: true,
            data: {
              totalRevenue: 1500000,
              revenueChange: 12.5,
              revenueHistory: [
                { month: 'Jan', revenue: 100000 },
                { month: 'Feb', revenue: 120000 },
                { month: 'Mar', revenue: 150000 }
              ]
            }
          });
        }
      }
    ]
  });

  if (result.success) {
    await startServer(result.data);
    console.log('Server running on http://localhost:3001');
  }
}

main();
```

## Step 3: Create Frontend App

Create `frontend/src/App.tsx`:

```tsx
import React, { useEffect, useState } from 'react';
import {
  Dashboard,
  LineChart,
  MetricCard,
  Grid
} from '@proceed/components';

function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:3001/api/revenue')
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          setData(result.data);
        }
        setLoading(false);
      });
  }, []);

  return (
    <Dashboard title="Revenue Dashboard">
      <Grid cols={{ xs: 1, md: 2, lg: 4 }} gap="1rem">
        <MetricCard
          title="Total Revenue"
          value={data?.totalRevenue}
          change={data?.revenueChange}
          format="currency"
          loading={loading}
        />
      </Grid>

      <LineChart
        data={data?.revenueHistory || []}
        lines={[
          {
            dataKey: 'revenue',
            name: 'Monthly Revenue',
            format: 'currency',
            color: '#3B82F6'
          }
        ]}
        xAxis={{ dataKey: 'month' }}
        yAxis={{ format: 'currency' }}
        height={400}
        loading={loading}
      />
    </Dashboard>
  );
}

export default App;
```

## Step 4: Add Package Scripts

Update `package.json`:

```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
    "dev:backend": "tsx watch backend/server.ts",
    "dev:frontend": "vite",
    "build": "tsc && vite build",
    "start": "node dist/backend/server.js"
  }
}
```

## Step 5: Run the Application

```bash
# Install dependencies
npm install

# Start development servers
npm run dev

# Open browser to http://localhost:5173
```

## Common Patterns

### Adding a New Chart

```tsx
import { BarChart } from '@proceed/components';

<BarChart
  data={salesData}
  bars={[
    { dataKey: 'sales', name: 'Sales', color: '#10B981' },
    { dataKey: 'target', name: 'Target', color: '#F59E0B' }
  ]}
  config={{
    animate: true,
    showTooltip: true
  }}
/>
```

### Creating a Custom Provider

```typescript
import { IDataProvider, Result } from '@proceed/core';

class CustomDataProvider implements IDataProvider {
  async initialize(config: any): Promise<Result<void>> {
    // Initialize your data source
    return { success: true };
  }

  async fetch<T>(query: any): Promise<Result<T>> {
    // Fetch data from your source
    const data = await yourDataSource.query(query);
    return { success: true, data };
  }
}
```

### Adding Authentication

```typescript
import { AuthService, JWTProvider } from '@proceed/backend';

const auth = new AuthService({
  provider: new JWTProvider({
    secret: process.env.JWT_SECRET,
    expiration: '24h'
  })
});

// Protect routes
app.use('/api/protected', auth.middleware());
```

### File Upload Handling

```typescript
import { FileProcessor } from '@proceed/backend';

const processor = new FileProcessor({
  allowedTypes: ['xlsx', 'csv'],
  maxSize: 10 * 1024 * 1024 // 10MB
});

app.post('/api/upload', processor.single('file'), async (req, res) => {
  const result = await processor.process(req.file);
  res.json(result);
});
```

## Environment Variables

Create `.env` for sensitive configuration:

```bash
# API Configuration
PROCEED_API_URL=http://localhost:3001/api
PROCEED_API_TIMEOUT=30000

# Database Configuration
PROCEED_DB_TYPE=postgres
PROCEED_DB_HOST=localhost
PROCEED_DB_PORT=5432
PROCEED_DB_NAME=revenue
PROCEED_DB_USER=admin
PROCEED_DB_PASSWORD=secret

# Security
PROCEED_JWT_SECRET=your-secret-key
PROCEED_CORS_ORIGINS=http://localhost:5173,https://yourdomain.com
```

## Deployment

### Deploy to Netlify (Frontend)

```bash
# Build frontend
npm run build:frontend

# Deploy
npx netlify deploy --prod --dir=dist
```

### Deploy to Render (Backend)

```bash
# Create render.yaml
cat > render.yaml << EOF
services:
  - type: web
    name: revenue-api
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
EOF

# Deploy via Render dashboard
```

### Deploy with Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]
```

```bash
# Build and run
docker build -t my-dashboard .
docker run -p 3001:3001 my-dashboard
```

## Next Steps

1. **Explore Components**: Check out the [Component Gallery](./docs/components.md)
2. **Add Database**: Set up [Database Connections](./docs/database.md)
3. **Customize Theme**: Learn about [Theming](./docs/theming.md)
4. **Add Authentication**: Implement [User Authentication](./docs/auth.md)
5. **Deploy**: Follow the [Deployment Guide](./docs/deployment.md)

## Troubleshooting

### Common Issues

**Backend connection failed**
- Check if backend is running on port 3001
- Verify CORS configuration matches frontend URL
- Check network/firewall settings

**Database not initializing**
- Ensure database path is writable
- Check database driver is installed
- Verify connection string format

**Components not rendering**
- Verify @proceed/components is installed
- Check React version compatibility (18+)
- Clear node_modules and reinstall

**Build errors**
- Update TypeScript to version 5+
- Check for missing type definitions
- Ensure all peer dependencies are installed

### Getting Help

- 📚 [Full Documentation](https://proceed-sdk.dev/docs)
- 💬 [Discord Community](https://discord.gg/proceed-sdk)
- 🐛 [Report Issues](https://github.com/proceed/sdk/issues)
- 📧 [Email Support](mailto:support@proceed-sdk.dev)

## Example Projects

- [Basic Dashboard](./examples/basic-dashboard)
- [Multi-tenant SaaS](./examples/multi-tenant)
- [Real-time Analytics](./examples/real-time)
- [Mobile Responsive](./examples/mobile)
- [Dark Mode Theme](./examples/dark-mode)

---

Ready to build something amazing? Start coding! 🚀