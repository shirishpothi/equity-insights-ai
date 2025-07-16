/**
 * Feature Flag Logging System
 * 
 * This module provides comprehensive logging for feature flag usage,
 * changes, and performance monitoring.
 */

import { 
  FeatureFlagUsageLog, 
  FeatureFlagResult, 
  FeatureFlagEnvironment 
} from './types';
import { getCurrentEnvironment } from './config';

export interface FeatureFlagChangeLog {
  flagKey: string;
  oldValue: unknown;
  newValue: unknown;
  changedBy?: string;
  changeReason?: string;
  environment: FeatureFlagEnvironment;
  timestamp: Date;
}

export interface FeatureFlagPerformanceLog {
  flagKey: string;
  evaluationTime: number; // in milliseconds
  cacheHit: boolean;
  environment: FeatureFlagEnvironment;
  timestamp: Date;
}

export interface FeatureFlagErrorLog {
  flagKey: string;
  error: string;
  stackTrace?: string;
  context?: Record<string, unknown>;
  environment: FeatureFlagEnvironment;
  timestamp: Date;
}

/**
 * Feature Flag Logger Class
 */
export class FeatureFlagLogger {
  private usageLogs: FeatureFlagUsageLog[] = [];
  private changeLogs: FeatureFlagChangeLog[] = [];
  private performanceLogs: FeatureFlagPerformanceLog[] = [];
  private errorLogs: FeatureFlagErrorLog[] = [];
  private maxLogSize = 1000;

  /**
   * Log feature flag usage
   */
  logUsage(log: FeatureFlagUsageLog): void {
    this.usageLogs.push(log);
    this.trimLogs(this.usageLogs);

    // Log to console in development
    if (log.environment === 'development') {
      console.log(`[FeatureFlag] ${log.flagKey}: ${log.enabled} (${log.reason})`);
    }

    // Send to external logging service in production
    if (log.environment === 'production') {
      this.sendToExternalLogger('usage', log);
    }
  }

  /**
   * Log feature flag changes
   */
  logChange(log: FeatureFlagChangeLog): void {
    this.changeLogs.push(log);
    this.trimLogs(this.changeLogs);

    // Always log changes to console
    console.log(`[FeatureFlag Change] ${log.flagKey}: ${log.oldValue} → ${log.newValue}`, {
      changedBy: log.changedBy,
      reason: log.changeReason,
      environment: log.environment,
    });

    // Send to external logging service
    this.sendToExternalLogger('change', log);
  }

  /**
   * Log feature flag performance metrics
   */
  logPerformance(log: FeatureFlagPerformanceLog): void {
    this.performanceLogs.push(log);
    this.trimLogs(this.performanceLogs);

    // Log slow evaluations
    if (log.evaluationTime > 100) {
      console.warn(`[FeatureFlag Performance] Slow evaluation for ${log.flagKey}: ${log.evaluationTime}ms`);
    }

    // Send to external monitoring service
    if (log.environment === 'production') {
      this.sendToExternalLogger('performance', log);
    }
  }

  /**
   * Log feature flag errors
   */
  logError(log: FeatureFlagErrorLog): void {
    this.errorLogs.push(log);
    this.trimLogs(this.errorLogs);

    // Always log errors to console
    console.error(`[FeatureFlag Error] ${log.flagKey}: ${log.error}`, {
      stackTrace: log.stackTrace,
      context: log.context,
      environment: log.environment,
    });

    // Send to external error tracking service
    this.sendToExternalLogger('error', log);
  }

  /**
   * Get usage logs
   */
  getUsageLogs(limit?: number): FeatureFlagUsageLog[] {
    return limit ? this.usageLogs.slice(-limit) : [...this.usageLogs];
  }

  /**
   * Get change logs
   */
  getChangeLogs(limit?: number): FeatureFlagChangeLog[] {
    return limit ? this.changeLogs.slice(-limit) : [...this.changeLogs];
  }

  /**
   * Get performance logs
   */
  getPerformanceLogs(limit?: number): FeatureFlagPerformanceLog[] {
    return limit ? this.performanceLogs.slice(-limit) : [...this.performanceLogs];
  }

  /**
   * Get error logs
   */
  getErrorLogs(limit?: number): FeatureFlagErrorLog[] {
    return limit ? this.errorLogs.slice(-limit) : [...this.errorLogs];
  }

  /**
   * Get usage statistics
   */
  getUsageStats(): {
    totalEvaluations: number;
    enabledCount: number;
    disabledCount: number;
    flagUsage: Record<string, number>;
    recentActivity: FeatureFlagUsageLog[];
  } {
    const totalEvaluations = this.usageLogs.length;
    const enabledCount = this.usageLogs.filter(log => log.enabled).length;
    const disabledCount = totalEvaluations - enabledCount;

    const flagUsage = this.usageLogs.reduce((acc, log) => {
      acc[log.flagKey] = (acc[log.flagKey] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const recentActivity = this.usageLogs.slice(-10);

    return {
      totalEvaluations,
      enabledCount,
      disabledCount,
      flagUsage,
      recentActivity,
    };
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(): {
    averageEvaluationTime: number;
    slowEvaluations: number;
    cacheHitRate: number;
    flagPerformance: Record<string, { avg: number; max: number; count: number }>;
  } {
    if (this.performanceLogs.length === 0) {
      return {
        averageEvaluationTime: 0,
        slowEvaluations: 0,
        cacheHitRate: 0,
        flagPerformance: {},
      };
    }

    const totalTime = this.performanceLogs.reduce((sum, log) => sum + log.evaluationTime, 0);
    const averageEvaluationTime = totalTime / this.performanceLogs.length;
    const slowEvaluations = this.performanceLogs.filter(log => log.evaluationTime > 100).length;
    const cacheHits = this.performanceLogs.filter(log => log.cacheHit).length;
    const cacheHitRate = (cacheHits / this.performanceLogs.length) * 100;

    const flagPerformance = this.performanceLogs.reduce((acc, log) => {
      if (!acc[log.flagKey]) {
        acc[log.flagKey] = { avg: 0, max: 0, count: 0 };
      }
      acc[log.flagKey].count++;
      acc[log.flagKey].max = Math.max(acc[log.flagKey].max, log.evaluationTime);
      acc[log.flagKey].avg = (acc[log.flagKey].avg * (acc[log.flagKey].count - 1) + log.evaluationTime) / acc[log.flagKey].count;
      return acc;
    }, {} as Record<string, { avg: number; max: number; count: number }>);

    return {
      averageEvaluationTime,
      slowEvaluations,
      cacheHitRate,
      flagPerformance,
    };
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.usageLogs = [];
    this.changeLogs = [];
    this.performanceLogs = [];
    this.errorLogs = [];
  }

  /**
   * Export logs for analysis
   */
  exportLogs(): {
    usage: FeatureFlagUsageLog[];
    changes: FeatureFlagChangeLog[];
    performance: FeatureFlagPerformanceLog[];
    errors: FeatureFlagErrorLog[];
    stats: {
      totalEvaluations: number;
      enabledCount: number;
      disabledCount: number;
      flagUsage: Record<string, number>;
      recentActivity: FeatureFlagUsageLog[];
    };
    performanceStats: {
      averageEvaluationTime: number;
      slowEvaluations: number;
      cacheHitRate: number;
      flagPerformance: Record<string, { avg: number; max: number; count: number }>;
    };
  } {
    const usageStats = this.getUsageStats();
    const perfStats = this.getPerformanceStats();

    return {
      usage: this.getUsageLogs(),
      changes: this.getChangeLogs(),
      performance: this.getPerformanceLogs(),
      errors: this.getErrorLogs(),
      stats: {
        totalEvaluations: usageStats.totalEvaluations,
        enabledCount: usageStats.enabledCount,
        disabledCount: usageStats.disabledCount,
        flagUsage: usageStats.flagUsage,
        recentActivity: usageStats.recentActivity,
      },
      performanceStats: {
        averageEvaluationTime: perfStats.averageEvaluationTime,
        slowEvaluations: perfStats.slowEvaluations,
        cacheHitRate: perfStats.cacheHitRate,
        flagPerformance: perfStats.flagPerformance,
      },
    };
  }

  /**
   * Trim logs to prevent memory issues
   */
  private trimLogs(logs: unknown[]): void {
    if (logs.length > this.maxLogSize) {
      logs.splice(0, logs.length - this.maxLogSize);
    }
  }

  /**
   * Send logs to external logging service
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private sendToExternalLogger(_type: string, _log: unknown): void {
    // In a real implementation, you would send logs to services like:
    // - DataDog
    // - New Relic
    // - Sentry
    // - CloudWatch
    // - Custom logging endpoint

    if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
      // Server-side logging in production
      // Example: Send to logging service
      // logService.send({ type, log, timestamp: new Date() });
    }
  }
}

// Singleton instance
let loggerInstance: FeatureFlagLogger | null = null;

/**
 * Get the singleton logger instance
 */
export function getFeatureFlagLogger(): FeatureFlagLogger {
  if (!loggerInstance) {
    loggerInstance = new FeatureFlagLogger();
  }
  return loggerInstance;
}

/**
 * Convenience function to log feature flag usage
 */
export function logFeatureFlagUsage(
  flagKey: string,
  result: FeatureFlagResult
): void {
  const logger = getFeatureFlagLogger();
  logger.logUsage({
    flagKey,
    enabled: result.enabled,
    userId: result.context.userId,
    userEmail: result.context.userEmail,
    sessionId: result.context.sessionId,
    environment: result.context.environment,
    reason: result.reason,
    timestamp: result.context.timestamp,
  });
}

/**
 * Convenience function to log feature flag changes
 */
export function logFeatureFlagChange(
  flagKey: string,
  oldValue: unknown,
  newValue: unknown,
  changedBy?: string,
  changeReason?: string
): void {
  const logger = getFeatureFlagLogger();
  logger.logChange({
    flagKey,
    oldValue,
    newValue,
    changedBy,
    changeReason,
    environment: getCurrentEnvironment(),
    timestamp: new Date(),
  });
}
