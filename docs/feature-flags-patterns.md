# Feature Flag Patterns and Recipes

This document contains common patterns, recipes, and best practices for using feature flags effectively.

## Common Patterns

### 1. Feature Toggle Pattern

Simple on/off switch for features.

```tsx
function AnalysisPage() {
  const isAdvancedAnalysisEnabled = useFeatureFlag(FEATURE_FLAGS.AI_ADVANCED_ANALYTICS);

  return (
    <div>
      <BasicAnalysis />
      {isAdvancedAnalysisEnabled && <AdvancedAnalysis />}
    </div>
  );
}
```

### 2. A/B Testing Pattern

Compare two different implementations.

```tsx
function LandingPage() {
  const useNewDesign = useFeatureFlag(FEATURE_FLAGS.UI_NEW_LANDING_DESIGN);

  return useNewDesign ? <NewLandingPage /> : <OldLandingPage />;
}
```

### 3. Progressive Rollout Pattern

Gradually enable features for more users.

```bash
# Week 1: 10% of users
FEATURE_NEW_ALGORITHM=10%

# Week 2: 25% of users
FEATURE_NEW_ALGORITHM=25%

# Week 3: 50% of users
FEATURE_NEW_ALGORITHM=50%

# Week 4: 100% of users
FEATURE_NEW_ALGORITHM=100%
```

### 4. Canary Release Pattern

Enable for specific user groups first.

```bash
# Enable for internal team first
FEATURE_NEW_DASHBOARD=admin@company.com,team-lead@company.com,qa@company.com

# Then expand to beta users
FEATURE_NEW_DASHBOARD=beta-user-1,beta-user-2,beta-user-3

# Finally enable for everyone
FEATURE_NEW_DASHBOARD=true
```

### 5. Kill Switch Pattern

Quickly disable problematic features.

```tsx
function DataProcessor() {
  const useNewProcessor = useFeatureFlag(FEATURE_FLAGS.DATA_NEW_PROCESSOR);
  
  // If new processor has issues, flip flag to false
  return useNewProcessor ? <NewProcessor /> : <OldProcessor />;
}
```

## Advanced Patterns

### 6. Dependency Chain Pattern

Features that depend on other features.

```tsx
function Dashboard() {
  const hasAnalytics = useFeatureFlag(FEATURE_FLAGS.ANALYTICS_ENABLED);
  const hasAdvancedAnalytics = useFeatureFlag(FEATURE_FLAGS.ADVANCED_ANALYTICS);
  
  // Advanced analytics requires basic analytics
  const showAdvanced = hasAnalytics && hasAdvancedAnalytics;

  return (
    <div>
      {hasAnalytics && <BasicAnalytics />}
      {showAdvanced && <AdvancedAnalytics />}
    </div>
  );
}
```

### 7. Feature Wrapper Component Pattern

Reusable component for feature gating.

```tsx
interface FeatureGateProps {
  flag: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireAll?: string[]; // Require all these flags
  requireAny?: string[]; // Require any of these flags
}

function FeatureGate({ 
  flag, 
  children, 
  fallback = null,
  requireAll = [],
  requireAny = []
}: FeatureGateProps) {
  const mainFlag = useFeatureFlag(flag);
  const allFlags = useFeatureFlags([...requireAll, ...requireAny]);
  
  const allRequired = requireAll.every(f => allFlags[f]);
  const anyRequired = requireAny.length === 0 || requireAny.some(f => allFlags[f]);
  
  const isEnabled = mainFlag && allRequired && anyRequired;
  
  return isEnabled ? <>{children}</> : <>{fallback}</>;
}

// Usage
<FeatureGate 
  flag={FEATURE_FLAGS.PREMIUM_FEATURES}
  requireAll={[FEATURE_FLAGS.USER_AUTHENTICATED]}
  fallback={<LoginPrompt />}
>
  <PremiumDashboard />
</FeatureGate>
```

### 8. Configuration-Driven UI Pattern

Use flags to configure UI behavior.

```tsx
function ConfigurableButton() {
  const flags = useFeatureFlags([
    FEATURE_FLAGS.UI_BUTTON_ANIMATIONS,
    FEATURE_FLAGS.UI_BUTTON_TOOLTIPS,
    FEATURE_FLAGS.UI_BUTTON_ICONS,
  ]);

  return (
    <Button
      className={flags[FEATURE_FLAGS.UI_BUTTON_ANIMATIONS] ? 'animate-pulse' : ''}
      title={flags[FEATURE_FLAGS.UI_BUTTON_TOOLTIPS] ? 'Click to analyze' : undefined}
    >
      {flags[FEATURE_FLAGS.UI_BUTTON_ICONS] && <AnalyzeIcon />}
      Analyze
    </Button>
  );
}
```

### 9. Performance Optimization Pattern

Use flags to enable expensive features conditionally.

```tsx
function ExpensiveComponent() {
  const enableRealTimeUpdates = useFeatureFlag(FEATURE_FLAGS.REAL_TIME_UPDATES);
  const enableAdvancedCharts = useFeatureFlag(FEATURE_FLAGS.ADVANCED_CHARTS);

  return (
    <div>
      <BasicData />
      {enableRealTimeUpdates && <RealTimeDataStream />}
      {enableAdvancedCharts && <AdvancedChartLibrary />}
    </div>
  );
}
```

### 10. Graceful Degradation Pattern

Provide fallbacks when features are disabled.

```tsx
function SmartSearch() {
  const hasAISearch = useFeatureFlag(FEATURE_FLAGS.AI_SEARCH);
  const hasAdvancedFilters = useFeatureFlag(FEATURE_FLAGS.ADVANCED_FILTERS);

  if (hasAISearch) {
    return <AISearchComponent />;
  }
  
  if (hasAdvancedFilters) {
    return <AdvancedSearchComponent />;
  }
  
  return <BasicSearchComponent />;
}
```

## Server-Side Patterns

### 11. API Versioning Pattern

Use flags to control API behavior.

```typescript
export async function POST(request: NextRequest) {
  const useNewAPI = isFeatureEnabled(FEATURE_FLAGS.API_V2);
  
  if (useNewAPI) {
    return handleV2Request(request);
  }
  
  return handleV1Request(request);
}
```

### 12. Database Migration Pattern

Gradually migrate to new data structures.

```typescript
async function getUserData(userId: string) {
  const useNewSchema = isFeatureEnabled(FEATURE_FLAGS.NEW_USER_SCHEMA);
  
  if (useNewSchema) {
    return await getUserFromNewTable(userId);
  }
  
  return await getUserFromOldTable(userId);
}
```

### 13. External Service Pattern

Control which external services to use.

```typescript
async function sendNotification(message: string) {
  const useNewProvider = isFeatureEnabled(FEATURE_FLAGS.NEW_EMAIL_PROVIDER);
  
  if (useNewProvider) {
    return await newEmailService.send(message);
  }
  
  return await oldEmailService.send(message);
}
```

## Testing Patterns

### 14. Test Environment Pattern

Different flags for different test environments.

```typescript
// jest.setup.js
if (process.env.NODE_ENV === 'test') {
  process.env.FEATURE_FLAGS_DEFAULT_ENABLED = 'true';
  process.env.FEATURE_EXPERIMENTAL_FEATURES = 'false';
}
```

### 15. Mock Pattern for Tests

```typescript
describe('FeatureComponent', () => {
  const mockUseFeatureFlag = jest.fn();
  
  beforeEach(() => {
    jest.mock('@/lib/feature-flags', () => ({
      useFeatureFlag: mockUseFeatureFlag,
    }));
  });

  it('renders when feature is enabled', () => {
    mockUseFeatureFlag.mockReturnValue(true);
    render(<FeatureComponent />);
    expect(screen.getByText('Feature Content')).toBeInTheDocument();
  });

  it('does not render when feature is disabled', () => {
    mockUseFeatureFlag.mockReturnValue(false);
    render(<FeatureComponent />);
    expect(screen.queryByText('Feature Content')).not.toBeInTheDocument();
  });
});
```

## Deployment Patterns

### 16. Blue-Green Deployment Pattern

Use flags to switch between deployments.

```bash
# Blue deployment (current)
FEATURE_USE_BLUE_DEPLOYMENT=true

# Switch to green deployment
FEATURE_USE_BLUE_DEPLOYMENT=false
```

### 17. Circuit Breaker Pattern

Automatically disable features when errors occur.

```typescript
class FeatureCircuitBreaker {
  private errorCount = 0;
  private lastError = 0;
  private threshold = 5;
  private timeout = 60000; // 1 minute

  async executeWithBreaker<T>(
    flagKey: string,
    operation: () => Promise<T>,
    fallback: () => T
  ): Promise<T> {
    if (this.isOpen()) {
      return fallback();
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onError();
      
      // Disable the feature flag temporarily
      const service = getFeatureFlagService();
      service.updateFlag(flagKey, { enabled: false });
      
      return fallback();
    }
  }

  private isOpen(): boolean {
    return this.errorCount >= this.threshold && 
           Date.now() - this.lastError < this.timeout;
  }

  private onSuccess(): void {
    this.errorCount = 0;
  }

  private onError(): void {
    this.errorCount++;
    this.lastError = Date.now();
  }
}
```

## Monitoring Patterns

### 18. Usage Analytics Pattern

Track feature usage for decision making.

```typescript
function FeatureWithAnalytics({ flagKey, children }: { 
  flagKey: string; 
  children: React.ReactNode; 
}) {
  const isEnabled = useFeatureFlag(flagKey);
  
  useEffect(() => {
    if (isEnabled) {
      // Track feature usage
      analytics.track('feature_used', {
        feature: flagKey,
        timestamp: new Date(),
        userId: user?.id,
      });
    }
  }, [isEnabled, flagKey]);

  return isEnabled ? <>{children}</> : null;
}
```

### 19. Performance Monitoring Pattern

Monitor performance impact of features.

```typescript
function PerformanceMonitoredFeature() {
  const isEnabled = useFeatureFlag(FEATURE_FLAGS.EXPENSIVE_FEATURE);
  
  useEffect(() => {
    if (isEnabled) {
      const startTime = performance.now();
      
      return () => {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        // Log performance metrics
        logger.logPerformance({
          feature: FEATURE_FLAGS.EXPENSIVE_FEATURE,
          duration,
          timestamp: new Date(),
        });
      };
    }
  }, [isEnabled]);

  return isEnabled ? <ExpensiveComponent /> : <LightweightComponent />;
}
```

## Anti-Patterns to Avoid

### ❌ Don't: Nested Feature Flags

```tsx
// Bad: Hard to understand and maintain
function BadComponent() {
  const featureA = useFeatureFlag(FEATURE_FLAGS.FEATURE_A);
  const featureB = useFeatureFlag(FEATURE_FLAGS.FEATURE_B);
  const featureC = useFeatureFlag(FEATURE_FLAGS.FEATURE_C);

  return (
    <div>
      {featureA && (
        <div>
          {featureB && (
            <div>
              {featureC && <Component />}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Good: Clear logic
function GoodComponent() {
  const flags = useFeatureFlags([
    FEATURE_FLAGS.FEATURE_A,
    FEATURE_FLAGS.FEATURE_B,
    FEATURE_FLAGS.FEATURE_C,
  ]);

  const showComponent = flags[FEATURE_FLAGS.FEATURE_A] && 
                       flags[FEATURE_FLAGS.FEATURE_B] && 
                       flags[FEATURE_FLAGS.FEATURE_C];

  return (
    <div>
      {showComponent && <Component />}
    </div>
  );
}
```

### ❌ Don't: Feature Flag Sprawl

```tsx
// Bad: Too many flags
function OverFlaggedComponent() {
  const flag1 = useFeatureFlag(FEATURE_FLAGS.BUTTON_COLOR);
  const flag2 = useFeatureFlag(FEATURE_FLAGS.BUTTON_SIZE);
  const flag3 = useFeatureFlag(FEATURE_FLAGS.BUTTON_ANIMATION);
  const flag4 = useFeatureFlag(FEATURE_FLAGS.BUTTON_TOOLTIP);
  // ... 10 more flags

  // Complex logic with many flags
}

// Good: Group related flags
function WellFlaggedComponent() {
  const useNewButtonDesign = useFeatureFlag(FEATURE_FLAGS.NEW_BUTTON_DESIGN);
  
  return useNewButtonDesign ? <NewButton /> : <OldButton />;
}
```

### ❌ Don't: Long-Lived Flags

```tsx
// Bad: Flag that's been in code for months
function ComponentWithOldFlag() {
  // This flag was added 6 months ago and never cleaned up
  const oldFeature = useFeatureFlag(FEATURE_FLAGS.EXPERIMENTAL_FEATURE_2023);
  
  return oldFeature ? <NewComponent /> : <OldComponent />;
}

// Good: Clean up flags regularly
function ComponentWithCleanFlags() {
  // This flag will be removed once feature is stable
  const newFeature = useFeatureFlag(FEATURE_FLAGS.NEW_FEATURE_V2);
  
  return newFeature ? <NewComponent /> : <OldComponent />;
}
```

## Best Practices Summary

1. **Keep flags simple**: Boolean flags are easier to understand
2. **Use descriptive names**: Make flag purpose clear
3. **Clean up regularly**: Remove flags once features are stable
4. **Test both states**: Always test enabled and disabled states
5. **Monitor usage**: Track how flags are being used
6. **Document decisions**: Explain why flags were added
7. **Limit scope**: Don't use flags for everything
8. **Plan removal**: Have a strategy for removing flags

## Flag Lifecycle Checklist

- [ ] Flag created with clear purpose
- [ ] Default configuration added
- [ ] Environment variables set
- [ ] Tests written for both states
- [ ] Documentation updated
- [ ] Monitoring in place
- [ ] Rollout plan defined
- [ ] Removal timeline planned
- [ ] Stakeholders notified
- [ ] Flag removed after stabilization
