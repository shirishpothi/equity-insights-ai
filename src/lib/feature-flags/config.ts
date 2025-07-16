/**
 * Feature Flag Configuration System
 * 
 * This module handles loading and managing feature flag configurations
 * from environment variables and configuration files.
 */

import { 
  FeatureFlag, 
  FeatureFlagConfig, 
  FeatureFlagEnvironment, 
  BooleanFeatureFlag,
  PercentageFeatureFlag,
  UserSpecificFeatureFlag,
  FEATURE_FLAGS 
} from './types';

/**
 * Get the current environment
 */
export function getCurrentEnvironment(): FeatureFlagEnvironment {
  const env = process.env.NODE_ENV || 'development';
  if (env === 'production') return 'production';
  if (env === 'staging') return 'staging';
  // Treat 'test' environment as 'development' for feature flags
  return 'development';
}

/**
 * Parse environment variable for feature flag configuration
 */
function parseEnvFlag(key: string, envValue: string | undefined): FeatureFlag | null {
  if (!envValue) return null;

  try {
    // Support simple boolean values
    if (envValue === 'true' || envValue === 'false') {
      return {
        key,
        name: key.replace('FEATURE_', '').replace(/_/g, ' '),
        description: `Feature flag for ${key}`,
        type: 'boolean',
        enabled: envValue === 'true',
        value: envValue === 'true',
        environment: [getCurrentEnvironment()],
        createdAt: new Date(),
        updatedAt: new Date(),
      } as BooleanFeatureFlag;
    }

    // Support percentage values (e.g., "50%" or "50")
    const percentageMatch = envValue.match(/^(\d+)%?$/);
    if (percentageMatch) {
      const percentage = parseInt(percentageMatch[1], 10);
      if (percentage >= 0 && percentage <= 100) {
        return {
          key,
          name: key.replace('FEATURE_', '').replace(/_/g, ' '),
          description: `Feature flag for ${key}`,
          type: 'percentage',
          enabled: true,
          percentage,
          environment: [getCurrentEnvironment()],
          createdAt: new Date(),
          updatedAt: new Date(),
        } as PercentageFeatureFlag;
      }
    }

    // Try JSON configuration first
    try {
      const jsonConfig = JSON.parse(envValue);
      return {
        key,
        name: jsonConfig.name || key.replace('FEATURE_', '').replace(/_/g, ' '),
        description: jsonConfig.description || `Feature flag for ${key}`,
        type: jsonConfig.type || 'boolean',
        enabled: jsonConfig.enabled !== false,
        environment: jsonConfig.environment || [getCurrentEnvironment()],
        createdAt: new Date(),
        updatedAt: new Date(),
        ...jsonConfig,
      } as FeatureFlag;
    } catch {
      // Not valid JSON, continue with other parsing
    }

    // Support user-specific values (comma-separated user IDs or emails)
    if (envValue.includes(',') || envValue.includes('@')) {
      const values = envValue.split(',').map(v => v.trim());
      const userEmails = values.filter(v => v.includes('@'));
      const userIds = values.filter(v => !v.includes('@'));

      return {
        key,
        name: key.replace('FEATURE_', '').replace(/_/g, ' '),
        description: `Feature flag for ${key}`,
        type: 'user_specific',
        enabled: true,
        userIds,
        userEmails: userEmails.length > 0 ? userEmails : undefined,
        environment: [getCurrentEnvironment()],
        createdAt: new Date(),
        updatedAt: new Date(),
      } as UserSpecificFeatureFlag;
    }

    // If we get here, it's an unknown format - return null
    return null;

  } catch (error) {
    console.warn(`Failed to parse feature flag ${key}:`, error);
    return null;
  }
}

/**
 * Load feature flags from environment variables
 */
function loadFlagsFromEnvironment(): Record<string, FeatureFlag> {
  const flags: Record<string, FeatureFlag> = {};

  // Load predefined feature flags from environment
  Object.values(FEATURE_FLAGS).forEach(flagKey => {
    const envValue = process.env[flagKey];
    const flag = parseEnvFlag(flagKey, envValue);
    if (flag) {
      flags[flagKey] = flag;
    }
  });

  // Load any additional feature flags that start with FEATURE_
  Object.keys(process.env).forEach(envKey => {
    if (envKey.startsWith('FEATURE_') && !Object.values(FEATURE_FLAGS).includes(envKey as any)) {
      const flag = parseEnvFlag(envKey, process.env[envKey]);
      if (flag) {
        flags[envKey] = flag;
      }
    }
  });

  return flags;
}

/**
 * Default feature flag configuration
 */
const defaultFlags: Record<string, FeatureFlag> = {
  [FEATURE_FLAGS.AUTH_GOOGLE_OAUTH]: {
    key: FEATURE_FLAGS.AUTH_GOOGLE_OAUTH,
    name: 'Google OAuth Authentication',
    description: 'Enable Google OAuth login functionality',
    type: 'boolean',
    enabled: true,
    value: true,
    environment: ['development', 'staging', 'production'],
  } as BooleanFeatureFlag,

  [FEATURE_FLAGS.AUTH_SUPABASE_INTEGRATION]: {
    key: FEATURE_FLAGS.AUTH_SUPABASE_INTEGRATION,
    name: 'Supabase Integration',
    description: 'Enable Supabase authentication and database integration',
    type: 'boolean',
    enabled: true,
    value: true,
    environment: ['development', 'staging', 'production'],
  } as BooleanFeatureFlag,

  [FEATURE_FLAGS.AI_STOCK_ANALYSIS]: {
    key: FEATURE_FLAGS.AI_STOCK_ANALYSIS,
    name: 'AI Stock Analysis',
    description: 'Enable AI-powered stock analysis functionality',
    type: 'boolean',
    enabled: true,
    value: true,
    environment: ['development', 'staging', 'production'],
  } as BooleanFeatureFlag,

  [FEATURE_FLAGS.AI_TICKER_SUGGESTIONS]: {
    key: FEATURE_FLAGS.AI_TICKER_SUGGESTIONS,
    name: 'AI Ticker Suggestions',
    description: 'Enable AI-powered ticker symbol suggestions',
    type: 'boolean',
    enabled: true,
    value: true,
    environment: ['development', 'staging', 'production'],
  } as BooleanFeatureFlag,

  [FEATURE_FLAGS.UI_ANALYSIS_HISTORY]: {
    key: FEATURE_FLAGS.UI_ANALYSIS_HISTORY,
    name: 'Analysis History',
    description: 'Enable analysis history functionality',
    type: 'boolean',
    enabled: true,
    value: true,
    environment: ['development', 'staging', 'production'],
  } as BooleanFeatureFlag,

  [FEATURE_FLAGS.UI_PDF_EXPORT]: {
    key: FEATURE_FLAGS.UI_PDF_EXPORT,
    name: 'PDF Export',
    description: 'Enable PDF export functionality for analysis reports',
    type: 'boolean',
    enabled: true,
    value: true,
    environment: ['development', 'staging', 'production'],
  } as BooleanFeatureFlag,

  [FEATURE_FLAGS.DATA_GEMINI_API]: {
    key: FEATURE_FLAGS.DATA_GEMINI_API,
    name: 'Gemini API Integration',
    description: 'Enable Google Gemini AI API integration',
    type: 'boolean',
    enabled: true,
    value: true,
    environment: ['development', 'staging', 'production'],
  } as BooleanFeatureFlag,
};

/**
 * Load feature flags from JSON configuration file
 */
function loadFlagsFromConfigFile(): Record<string, FeatureFlag> {
  try {
    // In a real implementation, you might want to load this from a file system
    // For now, we'll return empty object as file loading would need to be handled
    // differently in client vs server environments
    return {};
  } catch (error) {
    console.warn('Failed to load feature flags from config file:', error);
    return {};
  }
}

/**
 * Load and merge feature flag configuration
 */
export function loadFeatureFlagConfig(): FeatureFlagConfig {
  const environment = getCurrentEnvironment();
  const envFlags = loadFlagsFromEnvironment();
  const configFileFlags = loadFlagsFromConfigFile();

  // Merge flags in order of precedence: env vars > config file > defaults
  const mergedFlags = { ...defaultFlags, ...configFileFlags, ...envFlags };

  return {
    flags: mergedFlags,
    environment,
    defaultEnabled: process.env.FEATURE_FLAGS_DEFAULT_ENABLED === 'true',
    logUsage: process.env.FEATURE_FLAGS_LOG_USAGE !== 'false', // Default to true
  };
}

/**
 * Get a specific feature flag configuration
 */
export function getFeatureFlagConfig(key: string): FeatureFlag | null {
  const config = loadFeatureFlagConfig();
  return config.flags[key] || null;
}

/**
 * Check if feature flags are enabled globally
 */
export function areFeatureFlagsEnabled(): boolean {
  return process.env.FEATURE_FLAGS_ENABLED !== 'false'; // Default to true
}
