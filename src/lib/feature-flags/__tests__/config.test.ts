/**
 * @jest-environment node
 */

import { 
  getCurrentEnvironment, 
  loadFeatureFlagConfig, 
  getFeatureFlagConfig,
  areFeatureFlagsEnabled 
} from '../config';
import { FEATURE_FLAGS } from '../types';

describe('Feature Flag Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('getCurrentEnvironment', () => {
    it('should return development by default', () => {
      delete process.env.NODE_ENV;
      expect(getCurrentEnvironment()).toBe('development');
    });

    it('should return production when NODE_ENV is production', () => {
      process.env.NODE_ENV = 'production';
      expect(getCurrentEnvironment()).toBe('production');
    });

    it('should return staging when NODE_ENV is staging', () => {
      process.env.NODE_ENV = 'staging';
      expect(getCurrentEnvironment()).toBe('staging');
    });

    it('should return development for unknown NODE_ENV', () => {
      process.env.NODE_ENV = 'unknown';
      expect(getCurrentEnvironment()).toBe('development');
    });
  });

  describe('areFeatureFlagsEnabled', () => {
    it('should return true by default', () => {
      delete process.env.FEATURE_FLAGS_ENABLED;
      expect(areFeatureFlagsEnabled()).toBe(true);
    });

    it('should return false when explicitly disabled', () => {
      process.env.FEATURE_FLAGS_ENABLED = 'false';
      expect(areFeatureFlagsEnabled()).toBe(false);
    });

    it('should return true when explicitly enabled', () => {
      process.env.FEATURE_FLAGS_ENABLED = 'true';
      expect(areFeatureFlagsEnabled()).toBe(true);
    });
  });

  describe('loadFeatureFlagConfig', () => {
    it('should load default configuration', () => {
      const config = loadFeatureFlagConfig();
      
      expect(config.environment).toBe('development');
      expect(config.defaultEnabled).toBe(false);
      expect(config.logUsage).toBe(true);
      expect(config.flags).toBeDefined();
    });

    it('should respect FEATURE_FLAGS_DEFAULT_ENABLED', () => {
      process.env.FEATURE_FLAGS_DEFAULT_ENABLED = 'true';
      const config = loadFeatureFlagConfig();
      expect(config.defaultEnabled).toBe(true);
    });

    it('should respect FEATURE_FLAGS_LOG_USAGE', () => {
      process.env.FEATURE_FLAGS_LOG_USAGE = 'false';
      const config = loadFeatureFlagConfig();
      expect(config.logUsage).toBe(false);
    });

    it('should load boolean flags from environment', () => {
      process.env[FEATURE_FLAGS.AI_STOCK_ANALYSIS] = 'true';
      const config = loadFeatureFlagConfig();
      
      const flag = config.flags[FEATURE_FLAGS.AI_STOCK_ANALYSIS];
      expect(flag).toBeDefined();
      expect(flag.type).toBe('boolean');
      expect((flag as any).value).toBe(true);
    });

    it('should load percentage flags from environment', () => {
      process.env[FEATURE_FLAGS.AI_ADVANCED_ANALYTICS] = '75%';
      const config = loadFeatureFlagConfig();
      
      const flag = config.flags[FEATURE_FLAGS.AI_ADVANCED_ANALYTICS];
      expect(flag).toBeDefined();
      expect(flag.type).toBe('percentage');
      expect((flag as any).percentage).toBe(75);
    });

    it('should load user-specific flags from environment', () => {
      process.env[FEATURE_FLAGS.ADMIN_FEATURE_FLAG_MANAGEMENT] = 'user1,user2,admin@test.com';
      const config = loadFeatureFlagConfig();
      
      const flag = config.flags[FEATURE_FLAGS.ADMIN_FEATURE_FLAG_MANAGEMENT];
      expect(flag).toBeDefined();
      expect(flag.type).toBe('user_specific');
      expect((flag as any).userIds).toContain('user1');
      expect((flag as any).userIds).toContain('user2');
      expect((flag as any).userEmails).toContain('admin@test.com');
    });

    it('should load JSON configuration from environment', () => {
      const jsonConfig = {
        name: 'Custom Flag',
        description: 'Custom description',
        type: 'boolean',
        enabled: true,
        value: false,
      };
      process.env[FEATURE_FLAGS.UI_PDF_EXPORT] = JSON.stringify(jsonConfig);

      // Clear module cache to ensure fresh load
      jest.resetModules();
      const { loadFeatureFlagConfig } = require('../config');

      const config = loadFeatureFlagConfig();
      const flag = config.flags[FEATURE_FLAGS.UI_PDF_EXPORT];

      expect(flag).toBeDefined();
      expect(flag.name).toBe('Custom Flag');
      expect(flag.description).toBe('Custom description');
      expect((flag as any).value).toBe(false);
    });

    it('should handle invalid JSON gracefully', () => {
      process.env[FEATURE_FLAGS.UI_PDF_EXPORT] = 'invalid-json{';
      
      // Should not throw
      const config = loadFeatureFlagConfig();
      
      // Should fall back to default flag if it exists
      const flag = config.flags[FEATURE_FLAGS.UI_PDF_EXPORT];
      expect(flag).toBeDefined(); // Default flag should be present
    });

    it('should load custom FEATURE_ flags from environment', () => {
      process.env.FEATURE_CUSTOM_TEST_FLAG = 'true';
      const config = loadFeatureFlagConfig();
      
      const flag = config.flags.FEATURE_CUSTOM_TEST_FLAG;
      expect(flag).toBeDefined();
      expect(flag.type).toBe('boolean');
      expect((flag as any).value).toBe(true);
    });
  });

  describe('getFeatureFlagConfig', () => {
    it('should return specific flag configuration', () => {
      process.env[FEATURE_FLAGS.AI_STOCK_ANALYSIS] = 'true';
      const flag = getFeatureFlagConfig(FEATURE_FLAGS.AI_STOCK_ANALYSIS);
      
      expect(flag).toBeDefined();
      expect(flag?.key).toBe(FEATURE_FLAGS.AI_STOCK_ANALYSIS);
    });

    it('should return null for non-existent flag', () => {
      const flag = getFeatureFlagConfig('NON_EXISTENT_FLAG');
      expect(flag).toBeNull();
    });
  });

  describe('Environment Variable Parsing', () => {
    it('should parse percentage without % symbol', () => {
      process.env[FEATURE_FLAGS.AI_ADVANCED_ANALYTICS] = '50';
      const config = loadFeatureFlagConfig();
      
      const flag = config.flags[FEATURE_FLAGS.AI_ADVANCED_ANALYTICS];
      expect(flag.type).toBe('percentage');
      expect((flag as any).percentage).toBe(50);
    });

    it('should reject invalid percentage values', () => {
      process.env[FEATURE_FLAGS.AI_ADVANCED_ANALYTICS] = '150%';
      const config = loadFeatureFlagConfig();
      
      // Should not create a flag for invalid percentage
      const flag = config.flags[FEATURE_FLAGS.AI_ADVANCED_ANALYTICS];
      // Should fall back to default if it exists, or not exist
      if (flag) {
        expect(flag.type).not.toBe('percentage');
      }
    });

    it('should handle mixed user IDs and emails', () => {
      process.env[FEATURE_FLAGS.ADMIN_FEATURE_FLAG_MANAGEMENT] = 'user123,admin@test.com,user456,support@test.com';
      const config = loadFeatureFlagConfig();
      
      const flag = config.flags[FEATURE_FLAGS.ADMIN_FEATURE_FLAG_MANAGEMENT];
      expect(flag.type).toBe('user_specific');
      expect((flag as any).userIds).toEqual(['user123', 'user456']);
      expect((flag as any).userEmails).toEqual(['admin@test.com', 'support@test.com']);
    });

    it('should handle empty environment values', () => {
      process.env[FEATURE_FLAGS.AI_STOCK_ANALYSIS] = '';
      const config = loadFeatureFlagConfig();
      
      // Empty value should not create a flag
      const hasCustomFlag = Object.prototype.hasOwnProperty.call(config.flags, FEATURE_FLAGS.AI_STOCK_ANALYSIS);
      if (hasCustomFlag) {
        // If it exists, it should be the default flag, not from env
        const flag = config.flags[FEATURE_FLAGS.AI_STOCK_ANALYSIS];
        expect(flag.name).toBe('AI Stock Analysis'); // Default name
      }
    });
  });

  describe('Default Flags', () => {
    it('should include default flags in configuration', () => {
      const config = loadFeatureFlagConfig();
      
      // Check that some default flags are present
      expect(config.flags[FEATURE_FLAGS.AUTH_GOOGLE_OAUTH]).toBeDefined();
      expect(config.flags[FEATURE_FLAGS.AI_STOCK_ANALYSIS]).toBeDefined();
      expect(config.flags[FEATURE_FLAGS.UI_ANALYSIS_HISTORY]).toBeDefined();
    });

    it('should have correct default flag properties', () => {
      const config = loadFeatureFlagConfig();
      const flag = config.flags[FEATURE_FLAGS.AUTH_GOOGLE_OAUTH];
      
      expect(flag.type).toBe('boolean');
      expect(flag.enabled).toBe(true);
      expect((flag as any).value).toBe(true);
      expect(flag.environment).toContain('development');
      expect(flag.environment).toContain('production');
    });
  });

  describe('Environment Override', () => {
    it('should override default flags with environment variables', () => {
      // Set environment variable to override default
      process.env[FEATURE_FLAGS.AUTH_GOOGLE_OAUTH] = 'false';
      
      const config = loadFeatureFlagConfig();
      const flag = config.flags[FEATURE_FLAGS.AUTH_GOOGLE_OAUTH];
      
      expect(flag.type).toBe('boolean');
      expect((flag as any).value).toBe(false);
    });
  });
});
