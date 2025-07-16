/**
 * @jest-environment jsdom
 */

import { FeatureFlagService } from '../service';
import { FEATURE_FLAGS } from '../types';
import { getFeatureFlagLogger } from '../logger';

// Mock the config to provide test data
jest.mock('../config', () => ({
  getCurrentEnvironment: jest.fn(() => 'development'),
  areFeatureFlagsEnabled: jest.fn(() => true),
  loadFeatureFlagConfig: jest.fn(() => ({
    flags: {
      [FEATURE_FLAGS.AI_STOCK_ANALYSIS]: {
        key: FEATURE_FLAGS.AI_STOCK_ANALYSIS,
        name: 'AI Stock Analysis',
        description: 'Enable AI-powered stock analysis',
        type: 'boolean',
        enabled: true,
        value: true,
        environment: ['development', 'staging', 'production'],
      },
      [FEATURE_FLAGS.AI_ADVANCED_ANALYTICS]: {
        key: FEATURE_FLAGS.AI_ADVANCED_ANALYTICS,
        name: 'Advanced Analytics',
        description: 'Enable advanced analytics features',
        type: 'percentage',
        enabled: true,
        percentage: 50,
        seed: 'test-seed',
        environment: ['development', 'staging', 'production'],
      },
      [FEATURE_FLAGS.ADMIN_FEATURE_FLAG_MANAGEMENT]: {
        key: FEATURE_FLAGS.ADMIN_FEATURE_FLAG_MANAGEMENT,
        name: 'Feature Flag Management',
        description: 'Enable admin feature flag management',
        type: 'user_specific',
        enabled: true,
        userIds: ['admin-user'],
        userEmails: ['admin@test.com'],
        environment: ['development', 'staging', 'production'],
      },
    },
    environment: 'development',
    defaultEnabled: false,
    logUsage: true,
  })),
}));

describe('Feature Flag System Integration', () => {
  let service: FeatureFlagService;
  let logger: ReturnType<typeof getFeatureFlagLogger>;

  beforeEach(() => {
    service = new FeatureFlagService();
    logger = getFeatureFlagLogger();
    logger.clearLogs();
    jest.clearAllMocks();
  });

  describe('End-to-End Flag Evaluation', () => {
    it('should evaluate boolean flags correctly', () => {
      const result = service.checkFlag(FEATURE_FLAGS.AI_STOCK_ANALYSIS);
      
      expect(result.enabled).toBe(true);
      expect(result.flag?.type).toBe('boolean');
      expect(result.reason).toContain('Boolean flag value');
      
      // Should log usage
      const usageLogs = logger.getUsageLogs();
      expect(usageLogs).toHaveLength(1);
      expect(usageLogs[0].flagKey).toBe(FEATURE_FLAGS.AI_STOCK_ANALYSIS);
      expect(usageLogs[0].enabled).toBe(true);
    });

    it('should evaluate percentage flags consistently', () => {
      const context = {
        userId: 'consistent-test-user',
        sessionId: 'test-session',
      };

      // Multiple evaluations should be consistent
      const result1 = service.checkFlag(FEATURE_FLAGS.AI_ADVANCED_ANALYTICS, context);
      const result2 = service.checkFlag(FEATURE_FLAGS.AI_ADVANCED_ANALYTICS, context);
      const result3 = service.checkFlag(FEATURE_FLAGS.AI_ADVANCED_ANALYTICS, context);

      expect(result1.enabled).toBe(result2.enabled);
      expect(result2.enabled).toBe(result3.enabled);
      expect(result1.flag?.type).toBe('percentage');

      // Should log all evaluations
      const usageLogs = logger.getUsageLogs();
      expect(usageLogs).toHaveLength(3);
      expect(usageLogs.every(log => log.flagKey === FEATURE_FLAGS.AI_ADVANCED_ANALYTICS)).toBe(true);
    });

    it('should evaluate user-specific flags correctly', () => {
      // Admin user should have access
      const adminContext = {
        userId: 'admin-user',
        userEmail: 'admin@test.com',
      };

      const adminResult = service.checkFlag(FEATURE_FLAGS.ADMIN_FEATURE_FLAG_MANAGEMENT, adminContext);
      expect(adminResult.enabled).toBe(true);

      // Regular user should not have access
      const userContext = {
        userId: 'regular-user',
        userEmail: 'user@test.com',
      };

      const userResult = service.checkFlag(FEATURE_FLAGS.ADMIN_FEATURE_FLAG_MANAGEMENT, userContext);
      expect(userResult.enabled).toBe(false);

      // Should log both evaluations
      const usageLogs = logger.getUsageLogs();
      expect(usageLogs).toHaveLength(2);
    });
  });

  describe('Flag Management Workflow', () => {
    it('should handle complete flag lifecycle', () => {
      // 1. Initial state
      let result = service.checkFlag(FEATURE_FLAGS.AI_STOCK_ANALYSIS);
      expect(result.enabled).toBe(true);

      // 2. Toggle flag
      const toggleSuccess = service.toggleFlag(FEATURE_FLAGS.AI_STOCK_ANALYSIS);
      expect(toggleSuccess).toBe(true);

      // 3. Verify new state
      result = service.checkFlag(FEATURE_FLAGS.AI_STOCK_ANALYSIS);
      expect(result.enabled).toBe(false);

      // 4. Update flag with custom properties
      const updateSuccess = service.updateFlag(FEATURE_FLAGS.AI_STOCK_ANALYSIS, {
        description: 'Updated description',
        value: true,
        enabled: true,
      });
      expect(updateSuccess).toBe(true);

      // 5. Verify update
      result = service.checkFlag(FEATURE_FLAGS.AI_STOCK_ANALYSIS);
      expect(result.enabled).toBe(true);
      expect(result.flag?.description).toBe('Updated description');

      // Should log changes
      const changeLogs = logger.getChangeLogs();
      expect(changeLogs.length).toBeGreaterThan(0);
    });

    it('should manage percentage flags', () => {
      // Set percentage to 100%
      const success = service.setFlagPercentage(FEATURE_FLAGS.AI_ADVANCED_ANALYTICS, 100);
      expect(success).toBe(true);

      // All users should now be enabled
      const contexts = [
        { userId: 'user1' },
        { userId: 'user2' },
        { userId: 'user3' },
      ];

      contexts.forEach(context => {
        const result = service.checkFlag(FEATURE_FLAGS.AI_ADVANCED_ANALYTICS, context);
        expect(result.enabled).toBe(true);
      });

      // Set percentage to 0%
      service.setFlagPercentage(FEATURE_FLAGS.AI_ADVANCED_ANALYTICS, 0);

      // All users should now be disabled
      contexts.forEach(context => {
        const result = service.checkFlag(FEATURE_FLAGS.AI_ADVANCED_ANALYTICS, context);
        expect(result.enabled).toBe(false);
      });
    });

    it('should manage user-specific flags', () => {
      const newUserId = 'new-admin-user';
      const newUserEmail = 'new-admin@test.com';

      // Initially, new user should not have access
      let result = service.checkFlag(FEATURE_FLAGS.ADMIN_FEATURE_FLAG_MANAGEMENT, {
        userId: newUserId,
        userEmail: newUserEmail,
      });
      expect(result.enabled).toBe(false);

      // Add user to flag
      const addSuccess = service.addUserToFlag(
        FEATURE_FLAGS.ADMIN_FEATURE_FLAG_MANAGEMENT,
        newUserId,
        newUserEmail
      );
      expect(addSuccess).toBe(true);

      // Now user should have access
      result = service.checkFlag(FEATURE_FLAGS.ADMIN_FEATURE_FLAG_MANAGEMENT, {
        userId: newUserId,
        userEmail: newUserEmail,
      });
      expect(result.enabled).toBe(true);

      // Remove user from flag
      const removeSuccess = service.removeUserFromFlag(
        FEATURE_FLAGS.ADMIN_FEATURE_FLAG_MANAGEMENT,
        newUserId,
        newUserEmail
      );
      expect(removeSuccess).toBe(true);

      // User should no longer have access
      result = service.checkFlag(FEATURE_FLAGS.ADMIN_FEATURE_FLAG_MANAGEMENT, {
        userId: newUserId,
        userEmail: newUserEmail,
      });
      expect(result.enabled).toBe(false);
    });
  });

  describe('Performance and Logging', () => {
    it('should track performance metrics', () => {
      // Perform multiple flag evaluations
      for (let i = 0; i < 10; i++) {
        service.checkFlag(FEATURE_FLAGS.AI_STOCK_ANALYSIS);
      }

      const performanceLogs = logger.getPerformanceLogs();
      expect(performanceLogs).toHaveLength(10);

      const stats = logger.getPerformanceStats();
      expect(stats.averageEvaluationTime).toBeGreaterThan(0);
      expect(stats.flagPerformance[FEATURE_FLAGS.AI_STOCK_ANALYSIS]).toBeDefined();
    });

    it('should generate comprehensive statistics', () => {
      // Generate mixed usage
      service.checkFlag(FEATURE_FLAGS.AI_STOCK_ANALYSIS); // enabled
      service.checkFlag(FEATURE_FLAGS.AI_ADVANCED_ANALYTICS, { userId: 'user1' }); // maybe
      service.checkFlag('NON_EXISTENT_FLAG'); // disabled

      const usageStats = logger.getUsageStats();
      expect(usageStats.totalEvaluations).toBe(3);
      expect(usageStats.flagUsage[FEATURE_FLAGS.AI_STOCK_ANALYSIS]).toBe(1);
      expect(usageStats.recentActivity).toHaveLength(3);
    });

    it('should export complete log data', () => {
      // Generate some activity
      service.checkFlag(FEATURE_FLAGS.AI_STOCK_ANALYSIS);
      service.toggleFlag(FEATURE_FLAGS.AI_STOCK_ANALYSIS);
      
      const exported = logger.exportLogs();
      
      expect(exported.usage.length).toBeGreaterThan(0);
      expect(exported.changes.length).toBeGreaterThan(0);
      expect(exported.performance.length).toBeGreaterThan(0);
      expect(exported.stats).toBeDefined();
      expect(exported.performanceStats).toBeDefined();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle non-existent flags gracefully', () => {
      const result = service.checkFlag('NON_EXISTENT_FLAG');
      
      expect(result.enabled).toBe(false);
      expect(result.reason).toBe('Flag not found');
      expect(result.flag).toBeUndefined();
    });

    it('should handle invalid operations gracefully', () => {
      // Try to toggle a percentage flag
      const toggleSuccess = service.toggleFlag(FEATURE_FLAGS.AI_ADVANCED_ANALYTICS);
      expect(toggleSuccess).toBe(false);

      // Try to set percentage on a boolean flag
      const percentageSuccess = service.setFlagPercentage(FEATURE_FLAGS.AI_STOCK_ANALYSIS, 50);
      expect(percentageSuccess).toBe(false);

      // Try to add user to a boolean flag
      const userSuccess = service.addUserToFlag(FEATURE_FLAGS.AI_STOCK_ANALYSIS, 'user123');
      expect(userSuccess).toBe(false);
    });

    it('should handle context variations', () => {
      const contexts = [
        {}, // Empty context
        { userId: 'test-user' }, // User only
        { userEmail: 'test@example.com' }, // Email only
        { sessionId: 'test-session' }, // Session only
        { userId: 'test-user', userEmail: 'test@example.com', sessionId: 'test-session' }, // Full context
      ];

      contexts.forEach(context => {
        const result = service.checkFlag(FEATURE_FLAGS.AI_STOCK_ANALYSIS, context);
        expect(result.context).toBeDefined();
        expect(result.context.environment).toBe('development');
        expect(result.context.timestamp).toBeInstanceOf(Date);
      });
    });
  });

  describe('Bulk Operations', () => {
    it('should handle bulk flag retrieval', () => {
      const allFlags = service.getAllFlags({
        userId: 'test-user',
        userEmail: 'test@example.com',
      });

      expect(Object.keys(allFlags)).toContain(FEATURE_FLAGS.AI_STOCK_ANALYSIS);
      expect(Object.keys(allFlags)).toContain(FEATURE_FLAGS.AI_ADVANCED_ANALYTICS);
      expect(Object.keys(allFlags)).toContain(FEATURE_FLAGS.ADMIN_FEATURE_FLAG_MANAGEMENT);

      // Each flag should have a complete result
      Object.values(allFlags).forEach(result => {
        expect(result.enabled).toBeDefined();
        expect(result.reason).toBeDefined();
        expect(result.context).toBeDefined();
      });
    });

    it('should maintain consistency across bulk operations', () => {
      const context = { userId: 'consistent-user' };
      
      // Get individual flags
      const individual1 = service.checkFlag(FEATURE_FLAGS.AI_STOCK_ANALYSIS, context);
      const individual2 = service.checkFlag(FEATURE_FLAGS.AI_ADVANCED_ANALYTICS, context);

      // Get bulk flags
      const bulk = service.getAllFlags(context);

      // Results should be consistent
      expect(bulk[FEATURE_FLAGS.AI_STOCK_ANALYSIS].enabled).toBe(individual1.enabled);
      expect(bulk[FEATURE_FLAGS.AI_ADVANCED_ANALYTICS].enabled).toBe(individual2.enabled);
    });
  });
});
