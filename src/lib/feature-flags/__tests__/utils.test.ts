/**
 * @jest-environment jsdom
 */

import {
  createFeatureFlagContext,
  isValidFeatureFlagKey,
  formatFeatureFlagKey,
  getFeatureFlagCategory,
  createEnvVarName,
  parsePercentage,
  isUserId,
  isEmail,
  sanitizeFeatureFlagKey,
  generateRandomSeed,
  isFeatureFlagEnvironment,
  getFeatureFlagDocUrl,
} from '../utils';
import { FEATURE_FLAGS } from '../types';

// Mock getCurrentEnvironment
jest.mock('../config', () => ({
  getCurrentEnvironment: jest.fn(() => 'development'),
}));

describe('Feature Flag Utilities', () => {
  describe('createFeatureFlagContext', () => {
    it('should create context with user and session data', () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        user_metadata: {},
        app_metadata: {},
        aud: 'authenticated',
        created_at: '2023-01-01T00:00:00Z',
      };

      const mockSession = {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh',
        expires_in: 3600,
        expires_at: Date.now() / 1000 + 3600,
        token_type: 'bearer',
        user: mockUser,
      };

      const context = createFeatureFlagContext(mockUser, mockSession);

      expect(context.userId).toBe('test-user-id');
      expect(context.userEmail).toBe('test@example.com');
      expect(context.sessionId).toBeDefined();
      expect(context.environment).toBe('development');
      expect(context.timestamp).toBeInstanceOf(Date);
    });

    it('should handle null user and session', () => {
      const context = createFeatureFlagContext(null, null);

      expect(context.userId).toBeUndefined();
      expect(context.userEmail).toBeUndefined();
      expect(context.sessionId).toBeUndefined();
      expect(context.environment).toBe('development');
      expect(context.timestamp).toBeInstanceOf(Date);
    });

    it('should merge additional context', () => {
      const additionalContext = {
        sessionId: 'custom-session-id',
      };

      const context = createFeatureFlagContext(null, null, additionalContext);

      expect(context.sessionId).toBe('custom-session-id');
    });
  });

  describe('isValidFeatureFlagKey', () => {
    it('should validate correct feature flag keys', () => {
      expect(isValidFeatureFlagKey('FEATURE_TEST_FLAG')).toBe(true);
      expect(isValidFeatureFlagKey('FEATURE_AI_STOCK_ANALYSIS')).toBe(true);
      expect(isValidFeatureFlagKey('FEATURE_UI_DARK_THEME')).toBe(true);
    });

    it('should reject invalid feature flag keys', () => {
      expect(isValidFeatureFlagKey('TEST_FLAG')).toBe(false);
      expect(isValidFeatureFlagKey('feature_test_flag')).toBe(false);
      expect(isValidFeatureFlagKey('FEATURE-TEST-FLAG')).toBe(false);
      expect(isValidFeatureFlagKey('FEATURE_TEST_FLAG!')).toBe(false);
    });
  });

  describe('formatFeatureFlagKey', () => {
    it('should format feature flag keys for display', () => {
      expect(formatFeatureFlagKey('FEATURE_AI_STOCK_ANALYSIS')).toBe('Ai Stock Analysis');
      expect(formatFeatureFlagKey('FEATURE_UI_DARK_THEME')).toBe('Ui Dark Theme');
      expect(formatFeatureFlagKey('FEATURE_TEST_FLAG')).toBe('Test Flag');
    });
  });

  describe('getFeatureFlagCategory', () => {
    it('should categorize authentication flags', () => {
      expect(getFeatureFlagCategory(FEATURE_FLAGS.AUTH_GOOGLE_OAUTH)).toBe('Authentication');
      expect(getFeatureFlagCategory(FEATURE_FLAGS.AUTH_SUPABASE_INTEGRATION)).toBe('Authentication');
    });

    it('should categorize AI flags', () => {
      expect(getFeatureFlagCategory(FEATURE_FLAGS.AI_STOCK_ANALYSIS)).toBe('AI Features');
      expect(getFeatureFlagCategory(FEATURE_FLAGS.AI_TICKER_SUGGESTIONS)).toBe('AI Features');
    });

    it('should categorize UI flags', () => {
      expect(getFeatureFlagCategory(FEATURE_FLAGS.UI_ANALYSIS_HISTORY)).toBe('User Interface');
      expect(getFeatureFlagCategory(FEATURE_FLAGS.UI_PDF_EXPORT)).toBe('User Interface');
    });

    it('should categorize data flags', () => {
      expect(getFeatureFlagCategory(FEATURE_FLAGS.DATA_GEMINI_API)).toBe('Data Sources');
      expect(getFeatureFlagCategory(FEATURE_FLAGS.DATA_SUPABASE_OPERATIONS)).toBe('Data Sources');
    });

    it('should categorize performance flags', () => {
      expect(getFeatureFlagCategory(FEATURE_FLAGS.PERF_ANALYTICS_TRACKING)).toBe('Performance');
      expect(getFeatureFlagCategory(FEATURE_FLAGS.PERF_ERROR_MONITORING)).toBe('Performance');
    });

    it('should categorize admin flags', () => {
      expect(getFeatureFlagCategory(FEATURE_FLAGS.ADMIN_FEATURE_FLAG_MANAGEMENT)).toBe('Administration');
      expect(getFeatureFlagCategory(FEATURE_FLAGS.ADMIN_USER_MANAGEMENT)).toBe('Administration');
    });

    it('should return Other for unknown categories', () => {
      expect(getFeatureFlagCategory('FEATURE_UNKNOWN_CATEGORY')).toBe('Other');
    });
  });

  describe('createEnvVarName', () => {
    it('should create environment variable name from key', () => {
      expect(createEnvVarName('AI_STOCK_ANALYSIS')).toBe('FEATURE_AI_STOCK_ANALYSIS');
      expect(createEnvVarName('test-flag')).toBe('FEATURE_TEST_FLAG');
      expect(createEnvVarName('Test Flag!')).toBe('FEATURE_TEST_FLAG');
    });

    it('should handle keys that already start with FEATURE_', () => {
      expect(createEnvVarName('FEATURE_AI_STOCK_ANALYSIS')).toBe('FEATURE_AI_STOCK_ANALYSIS');
    });
  });

  describe('parsePercentage', () => {
    it('should parse valid percentage values', () => {
      expect(parsePercentage('50')).toBe(50);
      expect(parsePercentage('50%')).toBe(50);
      expect(parsePercentage('0')).toBe(0);
      expect(parsePercentage('100')).toBe(100);
    });

    it('should reject invalid percentage values', () => {
      expect(parsePercentage('-10')).toBeNull();
      expect(parsePercentage('150')).toBeNull();
      expect(parsePercentage('abc')).toBeNull();
      expect(parsePercentage('50.5')).toBeNull();
    });
  });

  describe('isUserId', () => {
    it('should identify valid user IDs', () => {
      expect(isUserId('550e8400-e29b-41d4-a716-446655440000')).toBe(true); // UUID
      expect(isUserId('user123')).toBe(true);
      expect(isUserId('test-user-id')).toBe(true);
      expect(isUserId('user_123')).toBe(true);
    });

    it('should reject invalid user IDs', () => {
      expect(isUserId('user@example.com')).toBe(false); // Email
      expect(isUserId('user 123')).toBe(false); // Space
      expect(isUserId('user#123')).toBe(false); // Special character
    });
  });

  describe('isEmail', () => {
    it('should identify valid emails', () => {
      expect(isEmail('test@example.com')).toBe(true);
      expect(isEmail('user.name@domain.co.uk')).toBe(true);
      expect(isEmail('admin+test@example.org')).toBe(true);
    });

    it('should reject invalid emails', () => {
      expect(isEmail('user123')).toBe(false);
      expect(isEmail('test@')).toBe(false);
      expect(isEmail('@example.com')).toBe(false);
      expect(isEmail('test.example.com')).toBe(false);
    });
  });

  describe('sanitizeFeatureFlagKey', () => {
    it('should sanitize feature flag keys', () => {
      expect(sanitizeFeatureFlagKey('test-flag')).toBe('TEST_FLAG');
      expect(sanitizeFeatureFlagKey('Test Flag!')).toBe('TEST_FLAG');
      expect(sanitizeFeatureFlagKey('ai__stock___analysis')).toBe('AI_STOCK_ANALYSIS');
      expect(sanitizeFeatureFlagKey('_test_flag_')).toBe('TEST_FLAG');
    });
  });

  describe('generateRandomSeed', () => {
    it('should generate random seed', () => {
      const seed1 = generateRandomSeed();
      const seed2 = generateRandomSeed();

      expect(seed1).toBeDefined();
      expect(seed2).toBeDefined();
      expect(seed1).not.toBe(seed2);
      expect(typeof seed1).toBe('string');
      expect(seed1.length).toBeGreaterThan(0);
    });
  });

  describe('isFeatureFlagEnvironment', () => {
    it('should return true for valid environments', () => {
      expect(isFeatureFlagEnvironment()).toBe(true); // development (mocked)
    });
  });

  describe('getFeatureFlagDocUrl', () => {
    beforeEach(() => {
      delete process.env.NEXT_PUBLIC_APP_URL;
    });

    it('should generate documentation URL', () => {
      const url = getFeatureFlagDocUrl('FEATURE_AI_STOCK_ANALYSIS');
      expect(url).toBe('http://localhost:9002/docs/feature-flags#feature_ai_stock_analysis');
    });

    it('should use custom app URL when provided', () => {
      process.env.NEXT_PUBLIC_APP_URL = 'https://example.com';
      const url = getFeatureFlagDocUrl('FEATURE_AI_STOCK_ANALYSIS');
      expect(url).toBe('https://example.com/docs/feature-flags#feature_ai_stock_analysis');
    });
  });

  describe('Session ID Generation', () => {
    it('should generate consistent session IDs for same token', () => {
      const mockSession1 = {
        access_token: 'same-token',
        refresh_token: 'refresh',
        expires_in: 3600,
        expires_at: Date.now() / 1000 + 3600,
        token_type: 'bearer',
        user: { id: 'user1', email: 'test@example.com' } as any,
      };

      const mockSession2 = {
        access_token: 'same-token',
        refresh_token: 'refresh',
        expires_in: 3600,
        expires_at: Date.now() / 1000 + 3600,
        token_type: 'bearer',
        user: { id: 'user1', email: 'test@example.com' } as any,
      };

      const context1 = createFeatureFlagContext(null, mockSession1);
      const context2 = createFeatureFlagContext(null, mockSession2);

      expect(context1.sessionId).toBe(context2.sessionId);
    });

    it('should generate different session IDs for different tokens', () => {
      const mockSession1 = {
        access_token: 'token-1',
        refresh_token: 'refresh',
        expires_in: 3600,
        expires_at: Date.now() / 1000 + 3600,
        token_type: 'bearer',
        user: { id: 'user1', email: 'test1@example.com' } as any,
      };

      const mockSession2 = {
        access_token: 'token-2',
        refresh_token: 'refresh',
        expires_in: 3600,
        expires_at: Date.now() / 1000 + 3600,
        token_type: 'bearer',
        user: { id: 'user2', email: 'test2@example.com' } as any,
      };

      const context1 = createFeatureFlagContext(null, mockSession1);
      const context2 = createFeatureFlagContext(null, mockSession2);

      expect(context1.sessionId).not.toBe(context2.sessionId);
    });
  });
});
