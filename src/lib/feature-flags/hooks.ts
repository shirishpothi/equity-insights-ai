/**
 * Feature Flag React Hooks
 * 
 * This module provides React hooks for using feature flags in components.
 */

'use client';

import { useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { 
  FeatureFlagKey, 
  FeatureFlagContext, 
  FeatureFlagResult 
} from './types';
import { getFeatureFlagService } from './service';
import { createFeatureFlagContext } from './utils';

/**
 * Hook to check if a single feature flag is enabled
 */
export function useFeatureFlag(
  flagKey: FeatureFlagKey | string,
  additionalContext?: Partial<FeatureFlagContext>
): boolean {
  const { user, session } = useAuth();
  
  const context = useMemo(() => {
    return createFeatureFlagContext(user, session, additionalContext);
  }, [user, session, additionalContext]);

  const result = useMemo(() => {
    return getFeatureFlagService().isEnabled(flagKey, context);
  }, [flagKey, context]);

  return result;
}

/**
 * Hook to get detailed feature flag result
 */
export function useFeatureFlagResult(
  flagKey: FeatureFlagKey | string,
  additionalContext?: Partial<FeatureFlagContext>
): FeatureFlagResult {
  const { user, session } = useAuth();
  
  const context = useMemo(() => {
    return createFeatureFlagContext(user, session, additionalContext);
  }, [user, session, additionalContext]);

  const result = useMemo(() => {
    return getFeatureFlagService().checkFlag(flagKey, context);
  }, [flagKey, context]);

  return result;
}

/**
 * Hook to get multiple feature flags at once
 */
export function useFeatureFlags(
  flagKeys: (FeatureFlagKey | string)[],
  additionalContext?: Partial<FeatureFlagContext>
): Record<string, boolean> {
  const { user, session } = useAuth();
  
  const context = useMemo(() => {
    return createFeatureFlagContext(user, session, additionalContext);
  }, [user, session, additionalContext]);

  const results = useMemo(() => {
    const service = getFeatureFlagService();
    const flagResults: Record<string, boolean> = {};
    
    flagKeys.forEach(flagKey => {
      flagResults[flagKey] = service.isEnabled(flagKey, context);
    });
    
    return flagResults;
  }, [flagKeys, context]);

  return results;
}

/**
 * Hook to get all feature flags for current user
 */
export function useAllFeatureFlags(
  additionalContext?: Partial<FeatureFlagContext>
): Record<string, FeatureFlagResult> {
  const { user, session } = useAuth();
  
  const context = useMemo(() => {
    return createFeatureFlagContext(user, session, additionalContext);
  }, [user, session, additionalContext]);

  const results = useMemo(() => {
    return getFeatureFlagService().getAllFlags(context);
  }, [context]);

  return results;
}
