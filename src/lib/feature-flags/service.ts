/**
 * Feature Flag Service
 * 
 * This module provides the main FeatureFlagService class for checking flag status,
 * handling different flag types, and managing feature flag state.
 */

import {
  FeatureFlag,
  FeatureFlagConfig,
  FeatureFlagContext,
  FeatureFlagResult,
  FeatureFlagUsageLog,
  BooleanFeatureFlag,
  PercentageFeatureFlag,
  UserSpecificFeatureFlag,
  FeatureFlagKey
} from './types';
import { loadFeatureFlagConfig, getCurrentEnvironment, areFeatureFlagsEnabled } from './config';
import { getFeatureFlagLogger, logFeatureFlagUsage, logFeatureFlagChange } from './logger';

/**
 * Simple hash function for consistent percentage-based rollouts
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Check if user is in percentage rollout
 */
function isUserInPercentageRollout(
  userId: string | undefined, 
  sessionId: string | undefined, 
  percentage: number, 
  seed?: string
): boolean {
  if (percentage === 0) return false;
  if (percentage === 100) return true;

  // Use userId if available, otherwise fall back to sessionId
  const identifier = userId || sessionId || 'anonymous';
  const hashInput = seed ? `${identifier}-${seed}` : identifier;
  const hash = simpleHash(hashInput);
  
  return (hash % 100) < percentage;
}

/**
 * Main Feature Flag Service
 */
export class FeatureFlagService {
  private config: FeatureFlagConfig;
  private logger = getFeatureFlagLogger();

  constructor() {
    this.config = loadFeatureFlagConfig();
  }

  /**
   * Refresh configuration (useful for runtime updates)
   */
  refreshConfig(): void {
    this.config = loadFeatureFlagConfig();
  }

  /**
   * Check if a feature flag is enabled
   */
  isEnabled(
    flagKey: FeatureFlagKey | string, 
    context?: Partial<FeatureFlagContext>
  ): boolean {
    const result = this.checkFlag(flagKey, context);
    return result.enabled;
  }

  /**
   * Check feature flag with detailed result
   */
  checkFlag(
    flagKey: FeatureFlagKey | string,
    context?: Partial<FeatureFlagContext>
  ): FeatureFlagResult {
    const startTime = performance.now();

    const fullContext: FeatureFlagContext = {
      environment: getCurrentEnvironment(),
      timestamp: new Date(),
      ...context,
    };

    // If feature flags are globally disabled, return default
    if (!areFeatureFlagsEnabled()) {
      const result: FeatureFlagResult = {
        enabled: this.config.defaultEnabled,
        reason: 'Feature flags globally disabled',
        context: fullContext,
      };
      this.logUsageAndPerformance(flagKey, result, startTime);
      return result;
    }

    const flag = this.config.flags[flagKey];

    // If flag doesn't exist, return default
    if (!flag) {
      const result: FeatureFlagResult = {
        enabled: this.config.defaultEnabled,
        reason: 'Flag not found',
        context: fullContext,
      };
      this.logUsage(flagKey, result);
      return result;
    }

    // Check if flag is enabled for current environment
    if (flag.environment && !flag.environment.includes(fullContext.environment)) {
      const result: FeatureFlagResult = {
        enabled: false,
        flag,
        reason: `Not enabled for environment: ${fullContext.environment}`,
        context: fullContext,
      };
      this.logUsage(flagKey, result);
      return result;
    }

    // If flag is globally disabled
    if (!flag.enabled) {
      const result: FeatureFlagResult = {
        enabled: false,
        flag,
        reason: 'Flag globally disabled',
        context: fullContext,
      };
      this.logUsage(flagKey, result);
      return result;
    }

    // Handle different flag types
    let enabled = false;
    let reason = '';

    switch (flag.type) {
      case 'boolean':
        const boolFlag = flag as BooleanFeatureFlag;
        enabled = boolFlag.value;
        reason = `Boolean flag value: ${enabled}`;
        break;

      case 'percentage':
        const percentFlag = flag as PercentageFeatureFlag;
        enabled = isUserInPercentageRollout(
          fullContext.userId,
          fullContext.sessionId,
          percentFlag.percentage,
          percentFlag.seed
        );
        reason = `Percentage rollout (${percentFlag.percentage}%): ${enabled}`;
        break;

      case 'user_specific':
        const userFlag = flag as UserSpecificFeatureFlag;
        const userInList = fullContext.userId && userFlag.userIds.includes(fullContext.userId);
        const emailInList = fullContext.userEmail && userFlag.userEmails?.includes(fullContext.userEmail);
        enabled = !!(userInList || emailInList);
        reason = `User-specific flag: ${enabled}`;
        break;

      default:
        enabled = this.config.defaultEnabled;
        reason = 'Unknown flag type, using default';
    }

    const result: FeatureFlagResult = {
      enabled,
      flag,
      reason,
      context: fullContext,
    };

    this.logUsageAndPerformance(flagKey, result, startTime);
    return result;
  }

  /**
   * Get all feature flags for current environment
   */
  getAllFlags(context?: Partial<FeatureFlagContext>): Record<string, FeatureFlagResult> {
    const results: Record<string, FeatureFlagResult> = {};
    
    Object.keys(this.config.flags).forEach(flagKey => {
      results[flagKey] = this.checkFlag(flagKey, context);
    });

    return results;
  }

  /**
   * Get feature flag configuration
   */
  getFlagConfig(flagKey: string): FeatureFlag | null {
    return this.config.flags[flagKey] || null;
  }

  /**
   * Log feature flag usage only
   */
  private logUsage(flagKey: string, result: FeatureFlagResult): void {
    if (!this.config.logUsage) return;
    logFeatureFlagUsage(flagKey, result);
  }

  /**
   * Log feature flag usage and performance
   */
  private logUsageAndPerformance(flagKey: string, result: FeatureFlagResult, startTime: number): void {
    if (!this.config.logUsage) return;

    const evaluationTime = performance.now() - startTime;

    // Log usage
    logFeatureFlagUsage(flagKey, result);

    // Log performance
    this.logger.logPerformance({
      flagKey,
      evaluationTime,
      cacheHit: false, // Could be enhanced with actual caching
      environment: result.context.environment,
      timestamp: result.context.timestamp,
    });
  }

  /**
   * Get usage logs
   */
  getUsageLogs(): FeatureFlagUsageLog[] {
    return this.logger.getUsageLogs();
  }

  /**
   * Clear usage logs
   */
  clearUsageLogs(): void {
    this.logger.clearLogs();
  }

  /**
   * Get logger instance for advanced logging operations
   */
  getLogger() {
    return this.logger;
  }

  /**
   * Get current configuration
   */
  getConfig(): FeatureFlagConfig {
    return { ...this.config };
  }

  /**
   * Update a feature flag at runtime (for admin use)
   */
  updateFlag(flagKey: string, updates: Partial<FeatureFlag>): boolean {
    try {
      if (!updates || typeof updates !== 'object') {
        console.warn(`Invalid updates provided for flag: ${flagKey}`);
        return false;
      }

      const existingFlag = this.config.flags[flagKey];
      if (!existingFlag) {
        console.warn(`Cannot update non-existent flag: ${flagKey}`);
        return false;
      }

      const oldValue = { ...existingFlag };
      const updatedFlag = {
        ...existingFlag,
        ...updates,
        updatedAt: new Date(),
      } as FeatureFlag;
      this.config.flags[flagKey] = updatedFlag;

      // Log the change
      logFeatureFlagChange(flagKey, oldValue, this.config.flags[flagKey], 'admin', 'Manual update');

      return true;
    } catch (error) {
      console.error(`Failed to update flag ${flagKey}:`, error);
      this.logger.logError({
        flagKey,
        error: error instanceof Error ? error.message : 'Unknown error',
        stackTrace: error instanceof Error ? error.stack : undefined,
        environment: getCurrentEnvironment(),
        timestamp: new Date(),
      });
      return false;
    }
  }

  /**
   * Toggle a boolean feature flag
   */
  toggleFlag(flagKey: string): boolean {
    const flag = this.config.flags[flagKey];
    if (!flag || flag.type !== 'boolean') {
      return false;
    }

    const boolFlag = flag as BooleanFeatureFlag;
    return this.updateFlag(flagKey, {
      value: !boolFlag.value,
      enabled: !boolFlag.value
    });
  }

  /**
   * Set percentage for a percentage-based flag
   */
  setFlagPercentage(flagKey: string, percentage: number): boolean {
    const flag = this.config.flags[flagKey];
    if (!flag || flag.type !== 'percentage') {
      return false;
    }

    if (percentage < 0 || percentage > 100) {
      return false;
    }

    return this.updateFlag(flagKey, { percentage });
  }

  /**
   * Add user to user-specific flag
   */
  addUserToFlag(flagKey: string, userId?: string, userEmail?: string): boolean {
    const flag = this.config.flags[flagKey];
    if (!flag || flag.type !== 'user_specific') {
      return false;
    }

    const userFlag = flag as UserSpecificFeatureFlag;
    const updates: Partial<UserSpecificFeatureFlag> = {};

    if (userId && !userFlag.userIds.includes(userId)) {
      updates.userIds = [...userFlag.userIds, userId];
    }

    if (userEmail && (!userFlag.userEmails || !userFlag.userEmails.includes(userEmail))) {
      updates.userEmails = [...(userFlag.userEmails || []), userEmail];
    }

    return Object.keys(updates).length > 0 ? this.updateFlag(flagKey, updates) : true;
  }

  /**
   * Remove user from user-specific flag
   */
  removeUserFromFlag(flagKey: string, userId?: string, userEmail?: string): boolean {
    const flag = this.config.flags[flagKey];
    if (!flag || flag.type !== 'user_specific') {
      return false;
    }

    const userFlag = flag as UserSpecificFeatureFlag;
    const updates: Partial<UserSpecificFeatureFlag> = {};

    if (userId && userFlag.userIds.includes(userId)) {
      updates.userIds = userFlag.userIds.filter(id => id !== userId);
    }

    if (userEmail && userFlag.userEmails?.includes(userEmail)) {
      updates.userEmails = userFlag.userEmails.filter(email => email !== userEmail);
    }

    return Object.keys(updates).length > 0 ? this.updateFlag(flagKey, updates) : true;
  }
}

// Singleton instance
let featureFlagServiceInstance: FeatureFlagService | null = null;

/**
 * Get the singleton FeatureFlagService instance
 */
export function getFeatureFlagService(): FeatureFlagService {
  if (!featureFlagServiceInstance) {
    featureFlagServiceInstance = new FeatureFlagService();
  }
  return featureFlagServiceInstance;
}

/**
 * Convenience function to check if a feature flag is enabled
 */
export function isFeatureEnabled(
  flagKey: FeatureFlagKey | string, 
  context?: Partial<FeatureFlagContext>
): boolean {
  return getFeatureFlagService().isEnabled(flagKey, context);
}

/**
 * Convenience function to get feature flag result with details
 */
export function checkFeatureFlag(
  flagKey: FeatureFlagKey | string, 
  context?: Partial<FeatureFlagContext>
): FeatureFlagResult {
  return getFeatureFlagService().checkFlag(flagKey, context);
}
