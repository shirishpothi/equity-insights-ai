/**
 * Feature Flag Utilities
 * 
 * This module provides utility functions for working with feature flags.
 */

import { User, Session } from '@supabase/supabase-js';
import { FeatureFlagContext } from './types';
import { getCurrentEnvironment } from './config';

/**
 * Create a feature flag context from user and session data
 */
export function createFeatureFlagContext(
  user?: User | null,
  session?: Session | null,
  additionalContext?: Partial<FeatureFlagContext>
): FeatureFlagContext {
  return {
    userId: user?.id,
    userEmail: user?.email,
    sessionId: session?.access_token ? generateSessionId(session.access_token) : undefined,
    environment: getCurrentEnvironment(),
    timestamp: new Date(),
    ...additionalContext,
  };
}

/**
 * Generate a consistent session ID from access token
 */
function generateSessionId(accessToken: string): string {
  // Use a simple hash of the access token for session ID
  let hash = 0;
  for (let i = 0; i < accessToken.length; i++) {
    const char = accessToken.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Validate feature flag key format
 */
export function isValidFeatureFlagKey(key: string): boolean {
  return /^FEATURE_[A-Z_]+$/.test(key);
}

/**
 * Format feature flag key for display
 */
export function formatFeatureFlagKey(key: string): string {
  return key
    .replace('FEATURE_', '')
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Get feature flag category from key
 */
export function getFeatureFlagCategory(key: string): string {
  if (key.startsWith('FEATURE_AUTH_')) return 'Authentication';
  if (key.startsWith('FEATURE_AI_')) return 'AI Features';
  if (key.startsWith('FEATURE_UI_')) return 'User Interface';
  if (key.startsWith('FEATURE_DATA_')) return 'Data Sources';
  if (key.startsWith('FEATURE_PERF_')) return 'Performance';
  if (key.startsWith('FEATURE_ADMIN_')) return 'Administration';
  return 'Other';
}

/**
 * Create a feature flag environment variable name
 */
export function createEnvVarName(key: string): string {
  if (key.startsWith('FEATURE_')) {
    return key;
  }
  return `FEATURE_${key.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '')}`;
}

/**
 * Parse percentage value from string
 */
export function parsePercentage(value: string): number | null {
  const match = value.match(/^(\d+)%?$/);
  if (match) {
    const percentage = parseInt(match[1], 10);
    return percentage >= 0 && percentage <= 100 ? percentage : null;
  }
  return null;
}

/**
 * Check if a value looks like a user ID
 */
export function isUserId(value: string): boolean {
  // UUID pattern or other common ID patterns
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value) ||
         /^[a-zA-Z0-9_-]+$/.test(value);
}

/**
 * Check if a value looks like an email
 */
export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/**
 * Sanitize feature flag key
 */
export function sanitizeFeatureFlagKey(key: string): string {
  return key
    .toUpperCase()
    .replace(/[^A-Z0-9_]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_|_$/g, '');
}

/**
 * Generate a random seed for percentage-based flags
 */
export function generateRandomSeed(): string {
  return Math.random().toString(36).substring(2, 15);
}

/**
 * Check if current environment supports feature flags
 */
export function isFeatureFlagEnvironment(): boolean {
  const env = getCurrentEnvironment();
  return ['development', 'staging', 'production'].includes(env);
}

/**
 * Get feature flag documentation URL
 */
export function getFeatureFlagDocUrl(key: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';
  return `${baseUrl}/docs/feature-flags#${key.toLowerCase()}`;
}
