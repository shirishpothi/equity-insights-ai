/**
 * Feature Flag System Types
 * 
 * This module defines the core types for the feature flag system,
 * supporting boolean flags, percentage-based rollouts, and user-specific flags.
 */

export type FeatureFlagEnvironment = 'development' | 'staging' | 'production';

export type FeatureFlagType = 'boolean' | 'percentage' | 'user_specific';

export interface BaseFeatureFlag {
  key: string;
  name: string;
  description: string;
  type: FeatureFlagType;
  enabled: boolean;
  environment?: FeatureFlagEnvironment[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface BooleanFeatureFlag extends BaseFeatureFlag {
  type: 'boolean';
  value: boolean;
}

export interface PercentageFeatureFlag extends BaseFeatureFlag {
  type: 'percentage';
  percentage: number; // 0-100
  seed?: string; // For consistent hashing
}

export interface UserSpecificFeatureFlag extends BaseFeatureFlag {
  type: 'user_specific';
  userIds: string[];
  userEmails?: string[];
}

export type FeatureFlag = BooleanFeatureFlag | PercentageFeatureFlag | UserSpecificFeatureFlag;

export interface FeatureFlagConfig {
  flags: Record<string, FeatureFlag>;
  environment: FeatureFlagEnvironment;
  defaultEnabled: boolean;
  logUsage: boolean;
}

export interface FeatureFlagContext {
  userId?: string;
  userEmail?: string;
  sessionId?: string;
  environment: FeatureFlagEnvironment;
  timestamp: Date;
}

export interface FeatureFlagResult {
  enabled: boolean;
  flag?: FeatureFlag;
  reason: string;
  context: FeatureFlagContext;
}

export interface FeatureFlagUsageLog {
  flagKey: string;
  enabled: boolean;
  userId?: string;
  userEmail?: string;
  sessionId?: string;
  environment: FeatureFlagEnvironment;
  reason: string;
  timestamp: Date;
}

// Predefined feature flag keys with consistent naming convention
export const FEATURE_FLAGS = {
  // Authentication Features
  AUTH_GOOGLE_OAUTH: 'FEATURE_AUTH_GOOGLE_OAUTH',
  AUTH_SUPABASE_INTEGRATION: 'FEATURE_AUTH_SUPABASE_INTEGRATION',
  AUTH_USER_PROFILES: 'FEATURE_AUTH_USER_PROFILES',
  AUTH_SESSION_PERSISTENCE: 'FEATURE_AUTH_SESSION_PERSISTENCE',
  
  // AI Analysis Features
  AI_STOCK_ANALYSIS: 'FEATURE_AI_STOCK_ANALYSIS',
  AI_MARKET_INSIGHTS: 'FEATURE_AI_MARKET_INSIGHTS',
  AI_REPORT_GENERATION: 'FEATURE_AI_REPORT_GENERATION',
  AI_TICKER_SUGGESTIONS: 'FEATURE_AI_TICKER_SUGGESTIONS',
  AI_ADVANCED_ANALYTICS: 'FEATURE_AI_ADVANCED_ANALYTICS',
  AI_REAL_TIME_DATA: 'FEATURE_AI_REAL_TIME_DATA',
  
  // UI/UX Features
  UI_ANALYSIS_HISTORY: 'FEATURE_UI_ANALYSIS_HISTORY',
  UI_PDF_EXPORT: 'FEATURE_UI_PDF_EXPORT',
  UI_COPY_TO_CLIPBOARD: 'FEATURE_UI_COPY_TO_CLIPBOARD',
  UI_DARK_THEME: 'FEATURE_UI_DARK_THEME',
  UI_COLLAPSIBLE_SECTIONS: 'FEATURE_UI_COLLAPSIBLE_SECTIONS',
  UI_NAVIGATION_IMPROVEMENTS: 'FEATURE_UI_NAVIGATION_IMPROVEMENTS',
  
  // Data Sources and External APIs
  DATA_GEMINI_API: 'FEATURE_DATA_GEMINI_API',
  DATA_SUPABASE_OPERATIONS: 'FEATURE_DATA_SUPABASE_OPERATIONS',
  DATA_EXTERNAL_MARKET_DATA: 'FEATURE_DATA_EXTERNAL_MARKET_DATA',
  DATA_CACHING: 'FEATURE_DATA_CACHING',
  
  // Performance and Monitoring
  PERF_ANALYTICS_TRACKING: 'FEATURE_PERF_ANALYTICS_TRACKING',
  PERF_ERROR_MONITORING: 'FEATURE_PERF_ERROR_MONITORING',
  PERF_PERFORMANCE_MONITORING: 'FEATURE_PERF_PERFORMANCE_MONITORING',
  
  // Admin and Management
  ADMIN_FEATURE_FLAG_MANAGEMENT: 'FEATURE_ADMIN_FEATURE_FLAG_MANAGEMENT',
  ADMIN_USER_MANAGEMENT: 'FEATURE_ADMIN_USER_MANAGEMENT',
  ADMIN_ANALYTICS_DASHBOARD: 'FEATURE_ADMIN_ANALYTICS_DASHBOARD',
} as const;

export type FeatureFlagKey = typeof FEATURE_FLAGS[keyof typeof FEATURE_FLAGS];
