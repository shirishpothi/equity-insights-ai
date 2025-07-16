# Feature Flag System Documentation

This document provides comprehensive documentation for the feature flag system implemented in the Equity Insights AI application.

## Overview

The feature flag system allows you to:
- Enable/disable features dynamically without code deployments
- Roll out features gradually using percentage-based rollouts
- Target specific users or user groups
- A/B test new features
- Safely deploy code with features hidden behind flags
- Monitor feature usage and performance

## Architecture

The feature flag system consists of several key components:

### Core Components

1. **Types** (`src/lib/feature-flags/types.ts`)
   - Defines all feature flag types and interfaces
   - Contains predefined feature flag constants

2. **Configuration** (`src/lib/feature-flags/config.ts`)
   - Loads flags from environment variables and config files
   - Manages environment-specific settings

3. **Service** (`src/lib/feature-flags/service.ts`)
   - Core logic for flag evaluation
   - Runtime flag management
   - Context-aware flag resolution

4. **React Hooks** (`src/lib/feature-flags/hooks.ts`)
   - React integration for components
   - Automatic context creation from auth state

5. **Logger** (`src/lib/feature-flags/logger.ts`)
   - Comprehensive logging and monitoring
   - Usage statistics and performance metrics

6. **Utilities** (`src/lib/feature-flags/utils.ts`)
   - Helper functions for flag management
   - Validation and formatting utilities

## Feature Flag Types

### Boolean Flags

Simple on/off switches for features.

```typescript
{
  key: 'FEATURE_AI_STOCK_ANALYSIS',
  name: 'AI Stock Analysis',
  description: 'Enable AI-powered stock analysis',
  type: 'boolean',
  enabled: true,
  value: true,
  environment: ['development', 'staging', 'production']
}
```

### Percentage Flags

Gradually roll out features to a percentage of users.

```typescript
{
  key: 'FEATURE_AI_ADVANCED_ANALYTICS',
  name: 'Advanced Analytics',
  description: 'Enable advanced analytics features',
  type: 'percentage',
  enabled: true,
  percentage: 25, // 25% of users
  seed: 'analytics-v2', // For consistent hashing
  environment: ['staging', 'production']
}
```

### User-Specific Flags

Target specific users by ID or email.

```typescript
{
  key: 'FEATURE_ADMIN_FEATURE_FLAG_MANAGEMENT',
  name: 'Feature Flag Management',
  description: 'Enable admin interface for managing flags',
  type: 'user_specific',
  enabled: true,
  userIds: ['admin-user-1', 'admin-user-2'],
  userEmails: ['admin@company.com'],
  environment: ['development', 'staging', 'production']
}
```

## Usage Examples

### Basic Usage in React Components

```tsx
import { useFeatureFlag, FEATURE_FLAGS } from '@/lib/feature-flags';

function MyComponent() {
  const isAnalysisEnabled = useFeatureFlag(FEATURE_FLAGS.AI_STOCK_ANALYSIS);
  const isPdfExportEnabled = useFeatureFlag(FEATURE_FLAGS.UI_PDF_EXPORT);

  return (
    <div>
      {isAnalysisEnabled && (
        <button onClick={handleAnalysis}>
          Analyze Stock
        </button>
      )}
      
      {isPdfExportEnabled && (
        <button onClick={handlePdfExport}>
          Export PDF
        </button>
      )}
    </div>
  );
}
```

### Multiple Flags

```tsx
import { useFeatureFlags, FEATURE_FLAGS } from '@/lib/feature-flags';

function Dashboard() {
  const flags = useFeatureFlags([
    FEATURE_FLAGS.UI_ANALYSIS_HISTORY,
    FEATURE_FLAGS.UI_PDF_EXPORT,
    FEATURE_FLAGS.AI_TICKER_SUGGESTIONS,
  ]);

  return (
    <div>
      {flags[FEATURE_FLAGS.UI_ANALYSIS_HISTORY] && <HistoryButton />}
      {flags[FEATURE_FLAGS.UI_PDF_EXPORT] && <ExportButton />}
      {flags[FEATURE_FLAGS.AI_TICKER_SUGGESTIONS] && <TickerInput />}
    </div>
  );
}
```

### Detailed Flag Information

```tsx
import { useFeatureFlagResult, FEATURE_FLAGS } from '@/lib/feature-flags';

function AdvancedComponent() {
  const result = useFeatureFlagResult(FEATURE_FLAGS.AI_ADVANCED_ANALYTICS);

  if (result.enabled) {
    return <AdvancedAnalytics />;
  }

  // Show why the feature is disabled
  return (
    <div>
      <p>Advanced analytics is not available.</p>
      <p>Reason: {result.reason}</p>
    </div>
  );
}
```

### Server-Side Usage

```typescript
import { isFeatureEnabled, FEATURE_FLAGS } from '@/lib/feature-flags';

export async function POST(request: NextRequest) {
  // Check if feature is enabled before processing
  if (!isFeatureEnabled(FEATURE_FLAGS.AI_STOCK_ANALYSIS)) {
    return NextResponse.json(
      { error: 'AI analysis is currently disabled' },
      { status: 503 }
    );
  }

  // Process the request...
}
```

### With User Context

```tsx
import { useFeatureFlag, FEATURE_FLAGS } from '@/lib/feature-flags';

function AdminPanel() {
  const { user } = useAuth();
  
  // Pass additional context for user-specific flags
  const hasAdminAccess = useFeatureFlag(
    FEATURE_FLAGS.ADMIN_FEATURE_FLAG_MANAGEMENT,
    { userId: user?.id, userEmail: user?.email }
  );

  if (!hasAdminAccess) {
    return <div>Access denied</div>;
  }

  return <AdminInterface />;
}
```

## Configuration

### Environment Variables

Set feature flags using environment variables:

```bash
# Boolean flags
FEATURE_AI_STOCK_ANALYSIS=true
FEATURE_UI_PDF_EXPORT=false

# Percentage flags
FEATURE_AI_ADVANCED_ANALYTICS=25%
FEATURE_NEW_UI=50

# User-specific flags
FEATURE_ADMIN_FEATURE_FLAG_MANAGEMENT=admin@company.com,user123,admin-user-id

# JSON configuration
FEATURE_CUSTOM_FLAG='{"type":"boolean","enabled":true,"value":false,"description":"Custom flag"}'

# Global settings
FEATURE_FLAGS_ENABLED=true
FEATURE_FLAGS_DEFAULT_ENABLED=false
FEATURE_FLAGS_LOG_USAGE=true
```

### Configuration File

Create `feature-flags.config.json` for complex configurations:

```json
{
  "environment": "production",
  "defaultEnabled": false,
  "logUsage": true,
  "flags": {
    "FEATURE_AI_ADVANCED_ANALYTICS": {
      "key": "FEATURE_AI_ADVANCED_ANALYTICS",
      "name": "Advanced Analytics",
      "description": "Enable advanced AI analytics features",
      "type": "percentage",
      "enabled": true,
      "percentage": 25,
      "seed": "analytics-v2",
      "environment": ["staging", "production"]
    }
  }
}
```

## Adding New Feature Flags

### 1. Define the Flag Constant

Add your flag to `src/lib/feature-flags/types.ts`:

```typescript
export const FEATURE_FLAGS = {
  // ... existing flags
  MY_NEW_FEATURE: 'FEATURE_MY_NEW_FEATURE',
} as const;
```

### 2. Add Default Configuration

Update the default flags in `src/lib/feature-flags/config.ts`:

```typescript
const defaultFlags: Record<string, FeatureFlag> = {
  // ... existing flags
  [FEATURE_FLAGS.MY_NEW_FEATURE]: {
    key: FEATURE_FLAGS.MY_NEW_FEATURE,
    name: 'My New Feature',
    description: 'Description of the new feature',
    type: 'boolean',
    enabled: false, // Start disabled
    value: false,
    environment: ['development', 'staging', 'production'],
  } as BooleanFeatureFlag,
};
```

### 3. Set Environment Variable

Add to your `.env.local`:

```bash
FEATURE_MY_NEW_FEATURE=false
```

### 4. Use in Components

```tsx
import { useFeatureFlag, FEATURE_FLAGS } from '@/lib/feature-flags';

function MyComponent() {
  const isNewFeatureEnabled = useFeatureFlag(FEATURE_FLAGS.MY_NEW_FEATURE);

  return (
    <div>
      {isNewFeatureEnabled && <NewFeatureComponent />}
    </div>
  );
}
```

## Best Practices

### Naming Conventions

- Use `FEATURE_` prefix for all flags
- Use descriptive, hierarchical names
- Categories: `AUTH_`, `AI_`, `UI_`, `DATA_`, `PERF_`, `ADMIN_`

Examples:
- `FEATURE_AUTH_GOOGLE_OAUTH`
- `FEATURE_AI_STOCK_ANALYSIS`
- `FEATURE_UI_DARK_THEME`

### Flag Lifecycle

1. **Development**: Create flag, start disabled
2. **Testing**: Enable in development/staging
3. **Rollout**: Use percentage flags for gradual rollout
4. **Stable**: Convert to boolean flag, enable for all
5. **Cleanup**: Remove flag and associated code

### Performance Considerations

- Feature flag evaluation is fast (< 1ms typically)
- Results are memoized in React hooks
- Avoid checking flags in tight loops
- Use bulk operations when checking multiple flags

### Security

- Never expose sensitive flags to client-side
- Use user-specific flags for admin features
- Validate user permissions before flag evaluation
- Log flag changes for audit trails

## Admin Interface

Access the admin interface at `/admin/feature-flags` (requires admin permissions).

Features:
- View all feature flags and their status
- Toggle boolean flags
- Update flag descriptions
- View usage statistics
- Search and filter flags by category

## Monitoring and Logging

The system automatically logs:
- Flag evaluations and results
- Flag changes and who made them
- Performance metrics
- Error conditions

Access logs programmatically:

```typescript
import { getFeatureFlagLogger } from '@/lib/feature-flags';

const logger = getFeatureFlagLogger();

// Get usage statistics
const stats = logger.getUsageStats();
console.log(`Total evaluations: ${stats.totalEvaluations}`);

// Get performance metrics
const perfStats = logger.getPerformanceStats();
console.log(`Average evaluation time: ${perfStats.averageEvaluationTime}ms`);

// Export all logs
const allLogs = logger.exportLogs();
```

## Testing

The feature flag system includes comprehensive tests:

```bash
# Run all feature flag tests
npm test src/lib/feature-flags

# Run specific test suites
npm test src/lib/feature-flags/__tests__/service.test.ts
npm test src/lib/feature-flags/__tests__/hooks.test.tsx
npm test src/lib/feature-flags/__tests__/integration.test.ts
```

### Testing with Feature Flags

```typescript
// Mock feature flags in tests
jest.mock('@/lib/feature-flags', () => ({
  useFeatureFlag: jest.fn(),
  FEATURE_FLAGS: {
    AI_STOCK_ANALYSIS: 'FEATURE_AI_STOCK_ANALYSIS',
  },
}));

// In your test
const mockUseFeatureFlag = useFeatureFlag as jest.MockedFunction<typeof useFeatureFlag>;
mockUseFeatureFlag.mockReturnValue(true);
```

## Troubleshooting

### Common Issues

1. **Flag not working**: Check environment variables and spelling
2. **Permission denied**: Verify user has access to user-specific flags
3. **Inconsistent behavior**: Clear browser cache, check environment
4. **Performance issues**: Review flag evaluation frequency

### Debug Mode

Enable debug logging:

```bash
FEATURE_FLAGS_LOG_USAGE=true
NODE_ENV=development
```

### Environment Validation

```typescript
import { validateEnvironment } from '@/lib/env-validation';

const validation = validateEnvironment();
if (!validation.isValid) {
  console.error('Environment issues:', validation.errors);
}
```

## Migration Guide

When updating the feature flag system:

1. **Backup current configuration**
2. **Update dependencies**
3. **Run tests to ensure compatibility**
4. **Update environment variables if needed**
5. **Deploy and monitor**

## Support

For questions or issues:
- Check this documentation
- Review test files for examples
- Check the admin interface for flag status
- Review application logs for errors
