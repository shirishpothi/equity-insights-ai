# Feature Flags Quick Start Guide

Get up and running with feature flags in the Equity Insights AI application in 5 minutes.

## 1. Basic Setup

### Environment Variables

Add these to your `.env.local` file:

```bash
# Enable feature flags globally
FEATURE_FLAGS_ENABLED=true
FEATURE_FLAGS_DEFAULT_ENABLED=false
FEATURE_FLAGS_LOG_USAGE=true

# Core features (already configured)
FEATURE_AUTH_GOOGLE_OAUTH=true
FEATURE_AI_STOCK_ANALYSIS=true
FEATURE_UI_ANALYSIS_HISTORY=true
FEATURE_UI_PDF_EXPORT=true
```

## 2. Using Feature Flags in Components

### Simple Boolean Check

```tsx
import { useFeatureFlag, FEATURE_FLAGS } from '@/lib/feature-flags';

function MyComponent() {
  const showNewFeature = useFeatureFlag(FEATURE_FLAGS.AI_STOCK_ANALYSIS);

  return (
    <div>
      {showNewFeature ? (
        <NewFeatureComponent />
      ) : (
        <div>Feature coming soon!</div>
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
  ]);

  return (
    <div>
      {flags[FEATURE_FLAGS.UI_ANALYSIS_HISTORY] && <HistoryButton />}
      {flags[FEATURE_FLAGS.UI_PDF_EXPORT] && <ExportButton />}
    </div>
  );
}
```

## 3. Server-Side Usage

### API Routes

```typescript
import { isFeatureEnabled, FEATURE_FLAGS } from '@/lib/feature-flags';

export async function POST(request: NextRequest) {
  if (!isFeatureEnabled(FEATURE_FLAGS.AI_STOCK_ANALYSIS)) {
    return NextResponse.json(
      { error: 'Feature disabled' },
      { status: 503 }
    );
  }

  // Your API logic here
}
```

## 4. Adding a New Feature Flag

### Step 1: Add to Constants

Edit `src/lib/feature-flags/types.ts`:

```typescript
export const FEATURE_FLAGS = {
  // ... existing flags
  MY_NEW_FEATURE: 'FEATURE_MY_NEW_FEATURE',
} as const;
```

### Step 2: Add Default Configuration

Edit `src/lib/feature-flags/config.ts`:

```typescript
const defaultFlags: Record<string, FeatureFlag> = {
  // ... existing flags
  [FEATURE_FLAGS.MY_NEW_FEATURE]: {
    key: FEATURE_FLAGS.MY_NEW_FEATURE,
    name: 'My New Feature',
    description: 'Description of what this feature does',
    type: 'boolean',
    enabled: false,
    value: false,
    environment: ['development', 'staging', 'production'],
  } as BooleanFeatureFlag,
};
```

### Step 3: Set Environment Variable

Add to `.env.local`:

```bash
FEATURE_MY_NEW_FEATURE=true
```

### Step 4: Use in Code

```tsx
import { useFeatureFlag, FEATURE_FLAGS } from '@/lib/feature-flags';

function MyComponent() {
  const isEnabled = useFeatureFlag(FEATURE_FLAGS.MY_NEW_FEATURE);

  return (
    <div>
      {isEnabled && <MyNewFeature />}
    </div>
  );
}
```

## 5. Common Patterns

### Conditional Rendering

```tsx
// Simple conditional
{isFeatureEnabled && <Component />}

// With fallback
{isFeatureEnabled ? <NewComponent /> : <OldComponent />}

// Multiple conditions
{isFeatureA && isFeatureB && <Component />}
```

### Feature Wrapper Component

```tsx
function FeatureWrapper({ 
  flag, 
  children, 
  fallback = null 
}: {
  flag: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const isEnabled = useFeatureFlag(flag);
  return isEnabled ? children : fallback;
}

// Usage
<FeatureWrapper flag={FEATURE_FLAGS.MY_NEW_FEATURE}>
  <NewFeature />
</FeatureWrapper>
```

### Progressive Enhancement

```tsx
function EnhancedComponent() {
  const hasAdvancedFeatures = useFeatureFlag(FEATURE_FLAGS.ADVANCED_FEATURES);
  const hasExperimentalFeatures = useFeatureFlag(FEATURE_FLAGS.EXPERIMENTAL);

  return (
    <div>
      <BasicFeature />
      {hasAdvancedFeatures && <AdvancedFeature />}
      {hasExperimentalFeatures && <ExperimentalFeature />}
    </div>
  );
}
```

## 6. Testing with Feature Flags

### Mock in Tests

```typescript
import { useFeatureFlag } from '@/lib/feature-flags';

jest.mock('@/lib/feature-flags', () => ({
  useFeatureFlag: jest.fn(),
  FEATURE_FLAGS: {
    MY_FEATURE: 'FEATURE_MY_FEATURE',
  },
}));

const mockUseFeatureFlag = useFeatureFlag as jest.MockedFunction<typeof useFeatureFlag>;

// In your test
beforeEach(() => {
  mockUseFeatureFlag.mockReturnValue(true);
});
```

### Test Both States

```typescript
describe('MyComponent', () => {
  it('shows feature when enabled', () => {
    mockUseFeatureFlag.mockReturnValue(true);
    render(<MyComponent />);
    expect(screen.getByText('New Feature')).toBeInTheDocument();
  });

  it('hides feature when disabled', () => {
    mockUseFeatureFlag.mockReturnValue(false);
    render(<MyComponent />);
    expect(screen.queryByText('New Feature')).not.toBeInTheDocument();
  });
});
```

## 7. Advanced Features

### Percentage Rollouts

```bash
# Roll out to 25% of users
FEATURE_NEW_ALGORITHM=25%
```

### User-Specific Flags

```bash
# Enable for specific users
FEATURE_ADMIN_PANEL=admin@company.com,user123
```

### Environment-Specific

```bash
# Only in development
FEATURE_DEBUG_MODE=true  # (when NODE_ENV=development)
```

## 8. Admin Interface

1. Sign in as an admin user
2. Navigate to `/admin/feature-flags`
3. View and toggle feature flags
4. Monitor usage statistics

## 9. Monitoring

### View Logs

```typescript
import { getFeatureFlagLogger } from '@/lib/feature-flags';

const logger = getFeatureFlagLogger();
const stats = logger.getUsageStats();
console.log('Feature flag usage:', stats);
```

### Performance Monitoring

The system automatically tracks:
- Flag evaluation performance
- Usage patterns
- Error rates

## 10. Best Practices

### ✅ Do

- Start with flags disabled in production
- Use descriptive flag names
- Clean up old flags regularly
- Test both enabled and disabled states
- Document flag purposes

### ❌ Don't

- Leave flags in code indefinitely
- Use flags for sensitive security features
- Check flags in performance-critical loops
- Forget to handle the disabled state

## Quick Reference

### Available Flags

```typescript
FEATURE_FLAGS.AUTH_GOOGLE_OAUTH           // Google OAuth login
FEATURE_FLAGS.AI_STOCK_ANALYSIS           // AI stock analysis
FEATURE_FLAGS.AI_TICKER_SUGGESTIONS       // Ticker suggestions
FEATURE_FLAGS.UI_ANALYSIS_HISTORY         // Analysis history
FEATURE_FLAGS.UI_PDF_EXPORT              // PDF export
FEATURE_FLAGS.DATA_GEMINI_API            // Gemini AI integration
FEATURE_FLAGS.ADMIN_FEATURE_FLAG_MANAGEMENT // Admin interface
```

### Hooks

```typescript
useFeatureFlag(flag)                     // Single flag
useFeatureFlags([flag1, flag2])          // Multiple flags
useFeatureFlagResult(flag)               // Detailed result
```

### Server Functions

```typescript
isFeatureEnabled(flag, context?)         // Check if enabled
checkFeatureFlag(flag, context?)         // Detailed check
getFeatureFlagService()                  // Service instance
```

## Need Help?

- 📖 Read the full documentation: `FEATURE_FLAGS.md`
- 🧪 Check the test files for examples
- 🔧 Use the admin interface for debugging
- 📊 Monitor logs for issues

Happy feature flagging! 🚀
