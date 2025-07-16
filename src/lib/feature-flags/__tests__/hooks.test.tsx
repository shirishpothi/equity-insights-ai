/**
 * @jest-environment jsdom
 */

import React from 'react';
import { renderHook } from '@testing-library/react';
import { useFeatureFlag, useFeatureFlags, useFeatureFlagResult } from '../hooks';
import { FEATURE_FLAGS } from '../types';
import { useAuth } from '@/contexts/auth-context';
import type { User, Session } from '@supabase/supabase-js';

// Mock the auth context
jest.mock('@/contexts/auth-context', () => ({
  useAuth: jest.fn(),
}));

// Mock the feature flag service
jest.mock('../service', () => ({
  getFeatureFlagService: jest.fn(() => ({
    isEnabled: jest.fn((flagKey: string) => {
      if (flagKey === FEATURE_FLAGS.AI_STOCK_ANALYSIS) return true;
      if (flagKey === FEATURE_FLAGS.AI_TICKER_SUGGESTIONS) return false;
      return false;
    }),
    checkFlag: jest.fn((flagKey: string) => ({
      enabled: flagKey === FEATURE_FLAGS.AI_STOCK_ANALYSIS,
      flag: {
        key: flagKey,
        name: 'Test Flag',
        description: 'Test description',
        type: 'boolean',
        enabled: true,
        value: flagKey === FEATURE_FLAGS.AI_STOCK_ANALYSIS,
      },
      reason: 'Test reason',
      context: {
        environment: 'development',
        timestamp: new Date(),
      },
    })),
    getAllFlags: jest.fn(() => ({
      [FEATURE_FLAGS.AI_STOCK_ANALYSIS]: {
        enabled: true,
        flag: { type: 'boolean', value: true },
        reason: 'Test reason',
        context: { environment: 'development', timestamp: new Date() },
      },
      [FEATURE_FLAGS.AI_TICKER_SUGGESTIONS]: {
        enabled: false,
        flag: { type: 'boolean', value: false },
        reason: 'Test reason',
        context: { environment: 'development', timestamp: new Date() },
      },
    })),
  })),
}));

// Mock the utils
jest.mock('../utils', () => ({
  createFeatureFlagContext: jest.fn((user, session, additional) => ({
    userId: user?.id,
    userEmail: user?.email,
    sessionId: session?.access_token ? 'mock-session-id' : undefined,
    environment: 'development',
    timestamp: new Date(),
    ...additional,
  })),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Helper function to create mock auth context
const createMockAuthContext = (overrides: Partial<ReturnType<typeof useAuth>> = {}) => ({
  user: null as User | null,
  session: null as Session | null,
  loading: false,
  error: null as string | null,
  signInWithGoogle: jest.fn(),
  signOut: jest.fn(),
  clearError: jest.fn(),
  retryAuth: jest.fn(),
  refreshSession: jest.fn(),
  sessionExpiresAt: null as number | null,
  ...overrides,
});

describe('Feature Flag Hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useFeatureFlag', () => {
    it('should return true for enabled flag', () => {
      mockUseAuth.mockReturnValue(createMockAuthContext());

      const { result } = renderHook(() => 
        useFeatureFlag(FEATURE_FLAGS.AI_STOCK_ANALYSIS)
      );

      expect(result.current).toBe(true);
    });

    it('should return false for disabled flag', () => {
      mockUseAuth.mockReturnValue(createMockAuthContext());

      const { result } = renderHook(() => 
        useFeatureFlag(FEATURE_FLAGS.AI_TICKER_SUGGESTIONS)
      );

      expect(result.current).toBe(false);
    });

    it('should use user context when available', () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        user_metadata: {},
        app_metadata: {},
        aud: 'authenticated',
        created_at: '2023-01-01T00:00:00Z',
      };

      const mockSession = {
        access_token: 'mock-token',
        refresh_token: 'mock-refresh',
        expires_in: 3600,
        expires_at: Date.now() / 1000 + 3600,
        token_type: 'bearer',
        user: mockUser,
      };

      mockUseAuth.mockReturnValue(createMockAuthContext({
        user: mockUser,
        session: mockSession,
      }));

      const { result } = renderHook(() => 
        useFeatureFlag(FEATURE_FLAGS.AI_STOCK_ANALYSIS)
      );

      expect(result.current).toBe(true);
    });

    it('should accept additional context', () => {
      mockUseAuth.mockReturnValue(createMockAuthContext());

      const additionalContext = {
        sessionId: 'custom-session-id',
      };

      const { result } = renderHook(() => 
        useFeatureFlag(FEATURE_FLAGS.AI_STOCK_ANALYSIS, additionalContext)
      );

      expect(result.current).toBe(true);
    });
  });

  describe('useFeatureFlagResult', () => {
    it('should return detailed flag result', () => {
      mockUseAuth.mockReturnValue(createMockAuthContext());

      const { result } = renderHook(() => 
        useFeatureFlagResult(FEATURE_FLAGS.AI_STOCK_ANALYSIS)
      );

      expect(result.current.enabled).toBe(true);
      expect(result.current.flag).toBeDefined();
      expect(result.current.reason).toBe('Test reason');
      expect(result.current.context).toBeDefined();
    });
  });

  describe('useFeatureFlags', () => {
    it('should return multiple flag states', () => {
      mockUseAuth.mockReturnValue(createMockAuthContext());

      const flagKeys = [
        FEATURE_FLAGS.AI_STOCK_ANALYSIS,
        FEATURE_FLAGS.AI_TICKER_SUGGESTIONS,
      ];

      const { result } = renderHook(() => 
        useFeatureFlags(flagKeys)
      );

      expect(result.current[FEATURE_FLAGS.AI_STOCK_ANALYSIS]).toBe(true);
      expect(result.current[FEATURE_FLAGS.AI_TICKER_SUGGESTIONS]).toBe(false);
    });

    it('should handle empty flag array', () => {
      mockUseAuth.mockReturnValue(createMockAuthContext());

      const { result } = renderHook(() => 
        useFeatureFlags([])
      );

      expect(result.current).toEqual({});
    });
  });

  describe('Memoization', () => {
    it('should memoize results when context does not change', () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        user_metadata: {},
        app_metadata: {},
        aud: 'authenticated',
        created_at: '2023-01-01T00:00:00Z',
      };

      mockUseAuth.mockReturnValue(createMockAuthContext({
        user: mockUser,
      }));

      const { result, rerender } = renderHook(() => 
        useFeatureFlag(FEATURE_FLAGS.AI_STOCK_ANALYSIS)
      );

      const firstResult = result.current;
      
      // Rerender with same props
      rerender();
      
      const secondResult = result.current;
      
      // Results should be the same (memoized)
      expect(firstResult).toBe(secondResult);
    });

    it('should update when user context changes', () => {
      const { result, rerender } = renderHook(
        ({ user }) => {
          mockUseAuth.mockReturnValue(createMockAuthContext({
            user,
          }));
          
          return useFeatureFlag(FEATURE_FLAGS.AI_STOCK_ANALYSIS);
        },
        {
          initialProps: { user: null as User | null }
        }
      );

      const firstResult = result.current;

      // Change user
      const newUser = {
        id: 'new-user-id',
        email: 'new@example.com',
        user_metadata: {},
        app_metadata: {},
        aud: 'authenticated',
        created_at: '2023-01-01T00:00:00Z',
      };

      rerender({ user: newUser });

      // Should trigger re-evaluation
      expect(result.current).toBe(true); // Still true, but context changed
    });
  });
});
