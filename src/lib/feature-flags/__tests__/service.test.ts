/**
 * @jest-environment jsdom
 */

import { FeatureFlagService } from '../service';
import { FEATURE_FLAGS, type BooleanFeatureFlag, type PercentageFeatureFlag, type UserSpecificFeatureFlag } from '../types';
import { getCurrentEnvironment } from '../config';

// Mock the config module
jest.mock('../config', () => ({
  getCurrentEnvironment: jest.fn(() => 'development'),
  areFeatureFlagsEnabled: jest.fn(() => true),
  loadFeatureFlagConfig: jest.fn(() => ({
    flags: {
      [FEATURE_FLAGS.AI_STOCK_ANALYSIS]: {
        key: FEATURE_FLAGS.AI_STOCK_ANALYSIS,
        name: 'AI Stock Analysis',
        description: 'Test flag',
        type: 'boolean',
        enabled: true,
        value: true,
        environment: ['development', 'staging', 'production'],
      } as BooleanFeatureFlag,
      [FEATURE_FLAGS.AI_ADVANCED_ANALYTICS]: {
        key: FEATURE_FLAGS.AI_ADVANCED_ANALYTICS,
        name: 'Advanced Analytics',
        description: 'Test percentage flag',
        type: 'percentage',
        enabled: true,
        percentage: 50,
        environment: ['development', 'staging', 'production'],
      } as PercentageFeatureFlag,
      [FEATURE_FLAGS.ADMIN_FEATURE_FLAG_MANAGEMENT]: {
        key: FEATURE_FLAGS.ADMIN_FEATURE_FLAG_MANAGEMENT,
        name: 'Admin Management',
        description: 'Test user-specific flag',
        type: 'user_specific',
        enabled: true,
        userIds: ['test-user-1'],
        userEmails: ['admin@test.com'],
        environment: ['development', 'staging', 'production'],
      } as UserSpecificFeatureFlag,
    },
    environment: 'development',
    defaultEnabled: false,
    logUsage: true,
  })),
}));

// Mock the logger
jest.mock('../logger', () => ({
  getFeatureFlagLogger: jest.fn(() => ({
    logUsage: jest.fn(),
    logPerformance: jest.fn(),
    logError: jest.fn(),
    logChange: jest.fn(),
    getUsageLogs: jest.fn(() => []),
    clearLogs: jest.fn(),
  })),
  logFeatureFlagUsage: jest.fn(),
  logFeatureFlagChange: jest.fn(),
}));

describe('FeatureFlagService', () => {
  let service: FeatureFlagService;

  beforeEach(() => {
    service = new FeatureFlagService();
    jest.clearAllMocks();
  });

  describe('Boolean Flags', () => {
    it('should return true for enabled boolean flag', () => {
      const result = service.isEnabled(FEATURE_FLAGS.AI_STOCK_ANALYSIS);
      expect(result).toBe(true);
    });

    it('should return detailed result for boolean flag', () => {
      const result = service.checkFlag(FEATURE_FLAGS.AI_STOCK_ANALYSIS);
      expect(result.enabled).toBe(true);
      expect(result.flag?.type).toBe('boolean');
      expect(result.reason).toContain('Boolean flag value');
    });

    it('should toggle boolean flag', () => {
      const success = service.toggleFlag(FEATURE_FLAGS.AI_STOCK_ANALYSIS);
      expect(success).toBe(true);
      
      // After toggle, should be disabled
      const result = service.isEnabled(FEATURE_FLAGS.AI_STOCK_ANALYSIS);
      expect(result).toBe(false);
    });
  });

  describe('Percentage Flags', () => {
    it('should handle percentage-based flags', () => {
      const context = {
        userId: 'consistent-user-id',
        sessionId: 'test-session',
      };

      // Test multiple times with same user - should be consistent
      const result1 = service.checkFlag(FEATURE_FLAGS.AI_ADVANCED_ANALYTICS, context);
      const result2 = service.checkFlag(FEATURE_FLAGS.AI_ADVANCED_ANALYTICS, context);
      
      expect(result1.enabled).toBe(result2.enabled);
      expect(result1.flag?.type).toBe('percentage');
    });

    it('should set percentage for percentage flag', () => {
      const success = service.setFlagPercentage(FEATURE_FLAGS.AI_ADVANCED_ANALYTICS, 75);
      expect(success).toBe(true);
    });

    it('should reject invalid percentage values', () => {
      const success1 = service.setFlagPercentage(FEATURE_FLAGS.AI_ADVANCED_ANALYTICS, -10);
      const success2 = service.setFlagPercentage(FEATURE_FLAGS.AI_ADVANCED_ANALYTICS, 150);
      
      expect(success1).toBe(false);
      expect(success2).toBe(false);
    });
  });

  describe('User-Specific Flags', () => {
    it('should enable flag for specific user ID', () => {
      const context = {
        userId: 'test-user-1',
      };

      const result = service.checkFlag(FEATURE_FLAGS.ADMIN_FEATURE_FLAG_MANAGEMENT, context);
      expect(result.enabled).toBe(true);
      expect(result.reason).toContain('User-specific flag');
    });

    it('should enable flag for specific user email', () => {
      const context = {
        userEmail: 'admin@test.com',
      };

      const result = service.checkFlag(FEATURE_FLAGS.ADMIN_FEATURE_FLAG_MANAGEMENT, context);
      expect(result.enabled).toBe(true);
    });

    it('should disable flag for non-specified user', () => {
      const context = {
        userId: 'other-user',
        userEmail: 'user@test.com',
      };

      const result = service.checkFlag(FEATURE_FLAGS.ADMIN_FEATURE_FLAG_MANAGEMENT, context);
      expect(result.enabled).toBe(false);
    });

    it('should add user to user-specific flag', () => {
      const success = service.addUserToFlag(FEATURE_FLAGS.ADMIN_FEATURE_FLAG_MANAGEMENT, 'new-user', 'new@test.com');
      expect(success).toBe(true);

      // Verify user was added
      const context = { userId: 'new-user' };
      const result = service.checkFlag(FEATURE_FLAGS.ADMIN_FEATURE_FLAG_MANAGEMENT, context);
      expect(result.enabled).toBe(true);
    });

    it('should remove user from user-specific flag', () => {
      const success = service.removeUserFromFlag(FEATURE_FLAGS.ADMIN_FEATURE_FLAG_MANAGEMENT, 'test-user-1');
      expect(success).toBe(true);

      // Verify user was removed
      const context = { userId: 'test-user-1' };
      const result = service.checkFlag(FEATURE_FLAGS.ADMIN_FEATURE_FLAG_MANAGEMENT, context);
      expect(result.enabled).toBe(false);
    });
  });

  describe('Non-existent Flags', () => {
    it('should return default value for non-existent flag', () => {
      const result = service.isEnabled('NON_EXISTENT_FLAG');
      expect(result).toBe(false); // Default is false
    });

    it('should provide reason for non-existent flag', () => {
      const result = service.checkFlag('NON_EXISTENT_FLAG');
      expect(result.enabled).toBe(false);
      expect(result.reason).toBe('Flag not found');
    });
  });

  describe('Environment Filtering', () => {
    it('should respect environment restrictions', () => {
      // Mock a flag that's only enabled in production
      service.updateFlag(FEATURE_FLAGS.AI_STOCK_ANALYSIS, {
        environment: ['production'],
      });

      const result = service.checkFlag(FEATURE_FLAGS.AI_STOCK_ANALYSIS);
      expect(result.enabled).toBe(false);
      expect(result.reason).toContain('Not enabled for environment');
    });
  });

  describe('Flag Updates', () => {
    it('should update flag successfully', () => {
      const success = service.updateFlag(FEATURE_FLAGS.AI_STOCK_ANALYSIS, {
        description: 'Updated description',
      });
      expect(success).toBe(true);

      const flag = service.getFlagConfig(FEATURE_FLAGS.AI_STOCK_ANALYSIS);
      expect(flag?.description).toBe('Updated description');
    });

    it('should fail to update non-existent flag', () => {
      const success = service.updateFlag('NON_EXISTENT_FLAG', {
        description: 'Test',
      });
      expect(success).toBe(false);
    });
  });

  describe('Bulk Operations', () => {
    it('should get all flags', () => {
      const allFlags = service.getAllFlags();
      expect(Object.keys(allFlags)).toContain(FEATURE_FLAGS.AI_STOCK_ANALYSIS);
      expect(Object.keys(allFlags)).toContain(FEATURE_FLAGS.AI_ADVANCED_ANALYTICS);
      expect(Object.keys(allFlags)).toContain(FEATURE_FLAGS.ADMIN_FEATURE_FLAG_MANAGEMENT);
    });

    it('should get configuration', () => {
      const config = service.getConfig();
      expect(config.environment).toBe('development');
      expect(config.defaultEnabled).toBe(false);
      expect(config.logUsage).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully in updateFlag', () => {
      // Force an error by passing invalid data
      const originalFlag = service.getFlagConfig(FEATURE_FLAGS.AI_STOCK_ANALYSIS);
      
      // Mock console.error to avoid noise in tests
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // This should not throw but return false
      const success = service.updateFlag(FEATURE_FLAGS.AI_STOCK_ANALYSIS, null as any);
      expect(success).toBe(false);
      
      consoleSpy.mockRestore();
    });
  });

  describe('Context Handling', () => {
    it('should use provided context', () => {
      const context = {
        userId: 'test-user',
        userEmail: 'test@example.com',
        sessionId: 'test-session',
      };

      const result = service.checkFlag(FEATURE_FLAGS.AI_STOCK_ANALYSIS, context);
      expect(result.context.userId).toBe('test-user');
      expect(result.context.userEmail).toBe('test@example.com');
      expect(result.context.sessionId).toBe('test-session');
    });

    it('should generate default context when none provided', () => {
      const result = service.checkFlag(FEATURE_FLAGS.AI_STOCK_ANALYSIS);
      expect(result.context.environment).toBe('development');
      expect(result.context.timestamp).toBeInstanceOf(Date);
    });
  });
});
