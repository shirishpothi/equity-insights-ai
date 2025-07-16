/**
 * @jest-environment jsdom
 */

import { FeatureFlagLogger, getFeatureFlagLogger } from '../logger';
import { FEATURE_FLAGS } from '../types';

describe('FeatureFlagLogger', () => {
  let logger: FeatureFlagLogger;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    logger = new FeatureFlagLogger();
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    jest.restoreAllMocks();
  });

  describe('Usage Logging', () => {
    it('should log feature flag usage', () => {
      const usageLog = {
        flagKey: FEATURE_FLAGS.AI_STOCK_ANALYSIS,
        enabled: true,
        userId: 'test-user',
        userEmail: 'test@example.com',
        sessionId: 'test-session',
        environment: 'development' as const,
        reason: 'Boolean flag value: true',
        timestamp: new Date(),
      };

      logger.logUsage(usageLog);

      const logs = logger.getUsageLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0]).toEqual(usageLog);
    });

    it('should log to console in development', () => {
      const usageLog = {
        flagKey: FEATURE_FLAGS.AI_STOCK_ANALYSIS,
        enabled: true,
        environment: 'development' as const,
        reason: 'Test reason',
        timestamp: new Date(),
      };

      logger.logUsage(usageLog);

      expect(consoleSpy).toHaveBeenCalledWith(
        `[FeatureFlag] ${FEATURE_FLAGS.AI_STOCK_ANALYSIS}: true (Test reason)`
      );
    });

    it('should not log to console in production', () => {
      const usageLog = {
        flagKey: FEATURE_FLAGS.AI_STOCK_ANALYSIS,
        enabled: true,
        environment: 'production' as const,
        reason: 'Test reason',
        timestamp: new Date(),
      };

      logger.logUsage(usageLog);

      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it('should trim logs when exceeding max size', () => {
      // Set a smaller max size for testing
      (logger as any).maxLogSize = 3;

      // Add more logs than the max size
      for (let i = 0; i < 5; i++) {
        logger.logUsage({
          flagKey: `test-flag-${i}`,
          enabled: true,
          environment: 'development',
          reason: 'Test',
          timestamp: new Date(),
        });
      }

      const logs = logger.getUsageLogs();
      expect(logs).toHaveLength(3);
      expect(logs[0].flagKey).toBe('test-flag-2'); // First two should be trimmed
    });
  });

  describe('Change Logging', () => {
    it('should log feature flag changes', () => {
      const changeLog = {
        flagKey: FEATURE_FLAGS.AI_STOCK_ANALYSIS,
        oldValue: false,
        newValue: true,
        changedBy: 'admin@example.com',
        changeReason: 'Manual toggle',
        environment: 'development' as const,
        timestamp: new Date(),
      };

      logger.logChange(changeLog);

      const logs = logger.getChangeLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0]).toEqual(changeLog);
    });

    it('should always log changes to console', () => {
      const changeLog = {
        flagKey: FEATURE_FLAGS.AI_STOCK_ANALYSIS,
        oldValue: false,
        newValue: true,
        environment: 'production' as const,
        timestamp: new Date(),
      };

      logger.logChange(changeLog);

      expect(consoleSpy).toHaveBeenCalledWith(
        `[FeatureFlag Change] ${FEATURE_FLAGS.AI_STOCK_ANALYSIS}: false → true`,
        expect.any(Object)
      );
    });
  });

  describe('Performance Logging', () => {
    it('should log performance metrics', () => {
      const performanceLog = {
        flagKey: FEATURE_FLAGS.AI_STOCK_ANALYSIS,
        evaluationTime: 50,
        cacheHit: false,
        environment: 'development' as const,
        timestamp: new Date(),
      };

      logger.logPerformance(performanceLog);

      const logs = logger.getPerformanceLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0]).toEqual(performanceLog);
    });

    it('should warn about slow evaluations', () => {
      const warnSpy = jest.spyOn(console, 'warn');
      
      const performanceLog = {
        flagKey: FEATURE_FLAGS.AI_STOCK_ANALYSIS,
        evaluationTime: 150, // Slow evaluation
        cacheHit: false,
        environment: 'development' as const,
        timestamp: new Date(),
      };

      logger.logPerformance(performanceLog);

      expect(warnSpy).toHaveBeenCalledWith(
        `[FeatureFlag Performance] Slow evaluation for ${FEATURE_FLAGS.AI_STOCK_ANALYSIS}: 150ms`
      );
    });
  });

  describe('Error Logging', () => {
    it('should log errors', () => {
      const errorLog = {
        flagKey: FEATURE_FLAGS.AI_STOCK_ANALYSIS,
        error: 'Test error message',
        stackTrace: 'Error stack trace',
        context: { additional: 'context' },
        environment: 'development' as const,
        timestamp: new Date(),
      };

      logger.logError(errorLog);

      const logs = logger.getErrorLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0]).toEqual(errorLog);
    });

    it('should always log errors to console', () => {
      const errorSpy = jest.spyOn(console, 'error');
      
      const errorLog = {
        flagKey: FEATURE_FLAGS.AI_STOCK_ANALYSIS,
        error: 'Test error',
        environment: 'production' as const,
        timestamp: new Date(),
      };

      logger.logError(errorLog);

      expect(errorSpy).toHaveBeenCalledWith(
        `[FeatureFlag Error] ${FEATURE_FLAGS.AI_STOCK_ANALYSIS}: Test error`,
        expect.any(Object)
      );
    });
  });

  describe('Statistics', () => {
    beforeEach(() => {
      // Add some test data
      logger.logUsage({
        flagKey: FEATURE_FLAGS.AI_STOCK_ANALYSIS,
        enabled: true,
        environment: 'development',
        reason: 'Test',
        timestamp: new Date(),
      });

      logger.logUsage({
        flagKey: FEATURE_FLAGS.AI_TICKER_SUGGESTIONS,
        enabled: false,
        environment: 'development',
        reason: 'Test',
        timestamp: new Date(),
      });

      logger.logUsage({
        flagKey: FEATURE_FLAGS.AI_STOCK_ANALYSIS,
        enabled: true,
        environment: 'development',
        reason: 'Test',
        timestamp: new Date(),
      });
    });

    it('should calculate usage statistics', () => {
      const stats = logger.getUsageStats();

      expect(stats.totalEvaluations).toBe(3);
      expect(stats.enabledCount).toBe(2);
      expect(stats.disabledCount).toBe(1);
      expect(stats.flagUsage[FEATURE_FLAGS.AI_STOCK_ANALYSIS]).toBe(2);
      expect(stats.flagUsage[FEATURE_FLAGS.AI_TICKER_SUGGESTIONS]).toBe(1);
      expect(stats.recentActivity).toHaveLength(3);
    });

    it('should calculate performance statistics', () => {
      // Add performance data
      logger.logPerformance({
        flagKey: FEATURE_FLAGS.AI_STOCK_ANALYSIS,
        evaluationTime: 50,
        cacheHit: true,
        environment: 'development',
        timestamp: new Date(),
      });

      logger.logPerformance({
        flagKey: FEATURE_FLAGS.AI_STOCK_ANALYSIS,
        evaluationTime: 150, // Slow
        cacheHit: false,
        environment: 'development',
        timestamp: new Date(),
      });

      const stats = logger.getPerformanceStats();

      expect(stats.averageEvaluationTime).toBe(100);
      expect(stats.slowEvaluations).toBe(1);
      expect(stats.cacheHitRate).toBe(50);
      expect(stats.flagPerformance[FEATURE_FLAGS.AI_STOCK_ANALYSIS]).toEqual({
        avg: 100,
        max: 150,
        count: 2,
      });
    });

    it('should handle empty performance logs', () => {
      const stats = logger.getPerformanceStats();

      expect(stats.averageEvaluationTime).toBe(0);
      expect(stats.slowEvaluations).toBe(0);
      expect(stats.cacheHitRate).toBe(0);
      expect(stats.flagPerformance).toEqual({});
    });
  });

  describe('Log Management', () => {
    it('should clear all logs', () => {
      // Add some logs
      logger.logUsage({
        flagKey: FEATURE_FLAGS.AI_STOCK_ANALYSIS,
        enabled: true,
        environment: 'development',
        reason: 'Test',
        timestamp: new Date(),
      });

      logger.logChange({
        flagKey: FEATURE_FLAGS.AI_STOCK_ANALYSIS,
        oldValue: false,
        newValue: true,
        environment: 'development',
        timestamp: new Date(),
      });

      // Clear logs
      logger.clearLogs();

      expect(logger.getUsageLogs()).toHaveLength(0);
      expect(logger.getChangeLogs()).toHaveLength(0);
      expect(logger.getPerformanceLogs()).toHaveLength(0);
      expect(logger.getErrorLogs()).toHaveLength(0);
    });

    it('should export logs', () => {
      // Add some test data
      logger.logUsage({
        flagKey: FEATURE_FLAGS.AI_STOCK_ANALYSIS,
        enabled: true,
        environment: 'development',
        reason: 'Test',
        timestamp: new Date(),
      });

      const exported = logger.exportLogs();

      expect(exported.usage).toHaveLength(1);
      expect(exported.changes).toHaveLength(0);
      expect(exported.performance).toHaveLength(0);
      expect(exported.errors).toHaveLength(0);
      expect(exported.stats).toBeDefined();
      expect(exported.performanceStats).toBeDefined();
    });

    it('should limit log retrieval', () => {
      // Add multiple logs
      for (let i = 0; i < 5; i++) {
        logger.logUsage({
          flagKey: `test-flag-${i}`,
          enabled: true,
          environment: 'development',
          reason: 'Test',
          timestamp: new Date(),
        });
      }

      const limitedLogs = logger.getUsageLogs(3);
      expect(limitedLogs).toHaveLength(3);
      
      // Should get the last 3 logs
      expect(limitedLogs[0].flagKey).toBe('test-flag-2');
      expect(limitedLogs[2].flagKey).toBe('test-flag-4');
    });
  });

  describe('Singleton', () => {
    it('should return same instance', () => {
      const logger1 = getFeatureFlagLogger();
      const logger2 = getFeatureFlagLogger();

      expect(logger1).toBe(logger2);
    });
  });
});
