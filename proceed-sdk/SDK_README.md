# Proceed SDK

Enterprise-grade Software Development Kit for building revenue analytics dashboards and data visualization applications. Transform any data source into professional dashboards with minimal configuration.

## 🎯 Overview

The Proceed SDK is a comprehensive, production-ready toolkit that abstracts complex dashboard development into reusable, configurable modules. Built with TypeScript and React, it provides everything needed to create, deploy, and maintain revenue analytics applications.

## 📦 Packages

The SDK is organized as a monorepo with the following packages:

### @proceed/core
Core utilities and abstractions for the entire SDK ecosystem.
- Configuration management with environment support
- Contract definitions for all providers
- State management orchestrators
- Utility functions for formatting, validation, and data manipulation
- Event bus system for inter-module communication
- Comprehensive error handling with self-documenting errors

### @proceed/components
Production-ready React component library optimized for dashboards.
- Chart components (Line, Bar, Area, Pie, Gauge, etc.)
- Data cards and metric displays
- Responsive layouts and grids
- Form components with validation
- Data tables with virtualization
- Theme system with dark mode support

### @proceed/backend
Modular backend services for API and data management.
- Express server factory with middleware pipeline
- Database abstraction layer (SQLite, PostgreSQL, MySQL, MongoDB)
- ETL pipeline for data processing
- Authentication and authorization
- Caching layer with multiple providers
- File upload and processing

### @proceed/cli
Command-line interface for SDK management.
- Project scaffolding and initialization
- Code generation for modules and components
- Database migrations and seeding
- Development server management
- Build and deployment automation

### @proceed/adapters
Deployment adapters for various platforms.
- Netlify deployment configuration
- Render deployment configuration
- Vercel deployment configuration
- Docker containerization
- Kubernetes manifests
- Cloud function adapters (AWS Lambda, Google Cloud Functions)

## 🚀 Quick Start

### Installation

```bash
# Install the SDK packages
npm install @proceed/core @proceed/components @proceed/backend

# Or use the CLI to create a new project
npx @proceed/cli create my-dashboard
```

### Basic Usage

```typescript
// config.json
{
  "name": "My Revenue Dashboard",
  "api": {
    "baseUrl": "http://localhost:3001/api"
  },
  "database": {
    "type": "sqlite",
    "database": "./data/revenue.db"
  },
  "features": {
    "dashboard": true,
    "analytics": true,
    "export": true
  }
}
```

```typescript
// server.ts
import { createServer, startServer } from '@proceed/backend';
import { ConfigManager } from '@proceed/core';

async function main() {
  // Load configuration
  const config = ConfigManager.getInstance();
  await config.initialize({
    configFile: './config.json',
    loadEnv: true
  });

  // Create and start server
  const serverResult = await createServer({
    port: 3001,
    routes: [...yourRoutes],
    cors: { enabled: true }
  });

  if (serverResult.success) {
    await startServer(serverResult.data);
  }
}

main();
```

```tsx
// App.tsx
import { Dashboard, LineChart, MetricCard } from '@proceed/components';
import { useData } from '@proceed/components/hooks';

function App() {
  const { data, loading, error } = useData('/api/revenue');

  return (
    <Dashboard>
      <MetricCard
        title="Total Revenue"
        value={data?.totalRevenue}
        change={data?.revenueChange}
        loading={loading}
      />

      <LineChart
        data={data?.revenueHistory}
        lines={[
          { dataKey: 'revenue', name: 'Revenue', format: 'currency' }
        ]}
        height={400}
      />
    </Dashboard>
  );
}
```

## 🔧 Configuration

The SDK uses a hierarchical configuration system with multiple sources:

1. **Default Configuration** - Built-in sensible defaults
2. **File Configuration** - JSON/JS configuration files
3. **Environment Variables** - PROCEED_* prefixed variables
4. **Runtime Configuration** - Programmatic configuration

### Configuration Schema

```typescript
interface SDKConfig {
  name: string;
  version: string;
  environment: 'development' | 'staging' | 'production';

  api: {
    baseUrl: string;
    timeout: number;
    retryAttempts: number;
  };

  database: {
    type: 'sqlite' | 'postgres' | 'mysql' | 'mongodb';
    connectionString?: string;
    // ... database-specific options
  };

  cache: {
    type: 'memory' | 'redis' | 'memcached';
    ttl: number;
    // ... cache-specific options
  };

  ui: {
    theme: 'light' | 'dark' | 'auto';
    primaryColor: string;
    // ... UI customization options
  };

  features: {
    dashboard: boolean;
    analytics: boolean;
    // ... feature flags
  };
}
```

## 🏗️ Architecture

The SDK follows a modular, provider-based architecture:

```
Application Layer
    ↓
Orchestration Layer (@proceed/core)
    ↓
Provider Interfaces
    ↓
Provider Implementations
    ↓
External Services
```

### Key Design Patterns

- **Provider Pattern**: All external dependencies use abstract interfaces
- **Orchestrator Pattern**: Central coordination of module interactions
- **Factory Pattern**: Object creation with configuration
- **Strategy Pattern**: Swappable algorithm implementations
- **Observer Pattern**: Event-driven communication

## 📊 Data Provider System

The SDK supports multiple data sources through a unified interface:

```typescript
interface IDataProvider {
  initialize(config: DataProviderConfig): Promise<Result<void>>;
  fetch<T>(query: DataQuery): Promise<Result<T>>;
  save<T>(data: T, options?: SaveOptions): Promise<Result<void>>;
  healthCheck(): Promise<Result<HealthStatus>>;
}
```

### Built-in Providers

- SQLite Provider (default)
- PostgreSQL Provider
- MySQL Provider
- MongoDB Provider
- REST API Provider
- GraphQL Provider
- Custom Provider support

## 🎨 Component Customization

All components support comprehensive customization:

```tsx
<LineChart
  data={data}
  config={{
    theme: 'dark',
    colors: ['#3B82F6', '#10B981'],
    margins: { top: 20, right: 30, bottom: 20, left: 30 },
    animate: true
  }}
  lines={[
    {
      dataKey: 'revenue',
      name: 'Revenue',
      format: 'currency',
      strokeWidth: 3,
      color: '#3B82F6'
    }
  ]}
/>
```

## 🚢 Deployment

The SDK includes deployment adapters for major platforms:

### Netlify
```bash
npx @proceed/cli deploy netlify
```

### Render
```bash
npx @proceed/cli deploy render
```

### Docker
```bash
npx @proceed/cli build docker
docker run -p 3000:3000 my-dashboard
```

### Kubernetes
```bash
npx @proceed/cli generate k8s-manifests
kubectl apply -f k8s/
```

## 🤖 AI Agent Integration

The SDK is optimized for AI agent consumption with:

- Self-describing function schemas
- JSON-serializable inputs/outputs
- Comprehensive error messages with solutions
- Structured response formats

```typescript
// All functions include schemas for AI agents
export const createDashboard = {
  name: 'createDashboard',
  description: 'Creates a new dashboard with specified configuration',
  parameters: {
    type: 'object',
    properties: {
      title: { type: 'string', description: 'Dashboard title' },
      layout: { type: 'string', enum: ['grid', 'flex', 'fixed'] },
      // ... complete schema
    }
  },
  returns: {
    type: 'object',
    properties: {
      success: { type: 'boolean' },
      data: { type: 'object' },
      error: { type: 'object' }
    }
  }
};
```

## 📚 Documentation

- [API Reference](./docs/api/README.md)
- [Component Storybook](./docs/storybook/README.md)
- [Migration Guide](./docs/migration/README.md)
- [Best Practices](./docs/best-practices/README.md)
- [Examples](./examples/README.md)

## 🧪 Testing

The SDK includes comprehensive testing utilities:

```typescript
import { render, screen } from '@proceed/testing';
import { MetricCard } from '@proceed/components';

test('renders metric card with value', () => {
  render(<MetricCard title="Revenue" value={100000} />);
  expect(screen.getByText('$100,000')).toBeInTheDocument();
});
```

## 🔒 Security

Built-in security features:

- Input validation with Zod schemas
- SQL injection prevention
- XSS protection
- CORS configuration
- Rate limiting
- JWT authentication support
- Encryption for sensitive data

## 📈 Performance

Optimizations included:

- Lazy loading components
- Virtual scrolling for large datasets
- Debounced/throttled operations
- Request caching with TTL
- Connection pooling
- Compression support
- CDN-ready assets

## 🛠️ CLI Commands

```bash
# Create new project
npx @proceed/cli create <project-name>

# Generate component
npx @proceed/cli generate component <component-name>

# Generate API route
npx @proceed/cli generate route <route-name>

# Run migrations
npx @proceed/cli db:migrate

# Start development server
npx @proceed/cli dev

# Build for production
npx @proceed/cli build

# Deploy to platform
npx @proceed/cli deploy <platform>
```

## 📦 Version Support

- Node.js: >= 18.0.0
- React: >= 18.0.0
- TypeScript: >= 5.0.0

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.

## 🆘 Support

- Documentation: https://proceed-sdk.dev/docs
- GitHub Issues: https://github.com/proceed/sdk/issues
- Discord: https://discord.gg/proceed-sdk
- Email: support@proceed-sdk.dev

## 🚀 Roadmap

- [ ] Real-time data synchronization
- [ ] Advanced visualization components
- [ ] Machine learning integrations
- [ ] Mobile SDK
- [ ] GraphQL support
- [ ] WebAssembly optimizations
- [ ] Edge deployment adapters

---

Built with ❤️ by the Proceed Team