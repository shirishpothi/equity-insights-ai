/**
 * Feature Flag System - Main Export
 * 
 * This module provides the main exports for the feature flag system,
 * including the service, types, and utility functions.
 */

// Export types
export type {
  FeatureFlag,
  FeatureFlagConfig,
  FeatureFlagContext,
  FeatureFlagResult,
  FeatureFlagUsageLog,
  FeatureFlagEnvironment,
  FeatureFlagType,
  FeatureFlagKey,
  BooleanFeatureFlag,
  PercentageFeatureFlag,
  UserSpecificFeatureFlag,
} from './types';

// Export constants
export { FEATURE_FLAGS } from './types';

// Export configuration functions
export {
  loadFeatureFlagConfig,
  getFeatureFlagConfig,
  getCurrentEnvironment,
  areFeatureFlagsEnabled,
} from './config';

// Export service and utility functions
export {
  FeatureFlagService,
  getFeatureFlagService,
  isFeatureEnabled,
  checkFeatureFlag,
} from './service';

// Export React hooks (will be created next)
export { useFeatureFlag, useFeatureFlags } from './hooks';

// Export utilities
export { createFeatureFlagContext } from './utils';

// Export logging
export {
  FeatureFlagLogger,
  getFeatureFlagLogger,
  logFeatureFlagUsage,
  logFeatureFlagChange,
} from './logger';
export type {
  FeatureFlagChangeLog,
  FeatureFlagPerformanceLog,
  FeatureFlagErrorLog,
} from './logger';
