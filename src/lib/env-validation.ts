/**
 * Environment variable validation utility
 * Helps diagnose configuration issues in production
 */

export interface EnvValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  config: {
    supabaseUrl?: string;
    supabaseAnonKey?: string;
    hasServiceRoleKey: boolean;
    hasGeminiApiKey: boolean;
    nodeEnv: string;
    isProduction: boolean;
    isDevelopment: boolean;
  };
}

export function validateEnvironment(): EnvValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const geminiApiKey = process.env.GOOGLE_GENAI_API_KEY;
  const nodeEnv = process.env.NODE_ENV || 'development';

  // Validate Supabase URL
  if (!supabaseUrl) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL is not set');
  } else if (supabaseUrl === 'https://placeholder.supabase.co') {
    errors.push('NEXT_PUBLIC_SUPABASE_URL is still set to placeholder value');
  } else if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL appears to be invalid');
  }

  // Validate Supabase Anon Key
  if (!supabaseAnonKey) {
    errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set');
  } else if (supabaseAnonKey === 'placeholder-key') {
    errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is still set to placeholder value');
  } else if (supabaseAnonKey.length < 100) {
    warnings.push('NEXT_PUBLIC_SUPABASE_ANON_KEY appears to be too short');
  }

  // Validate Service Role Key (optional but recommended)
  if (!serviceRoleKey) {
    warnings.push('SUPABASE_SERVICE_ROLE_KEY is not set (optional for client-side auth)');
  } else if (serviceRoleKey.length < 100) {
    warnings.push('SUPABASE_SERVICE_ROLE_KEY appears to be too short');
  }

  // Validate Gemini API Key
  if (!geminiApiKey) {
    warnings.push('GOOGLE_GENAI_API_KEY is not set (AI features will not work)');
  }

  // Production-specific validations
  if (nodeEnv === 'production') {
    if (!supabaseUrl || !supabaseAnonKey) {
      errors.push('Critical environment variables missing in production');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    config: {
      supabaseUrl,
      supabaseAnonKey: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 10)}...` : undefined,
      hasServiceRoleKey: !!serviceRoleKey,
      hasGeminiApiKey: !!geminiApiKey,
      nodeEnv,
      isProduction: nodeEnv === 'production',
      isDevelopment: nodeEnv === 'development',
    },
  };
}

export function logEnvironmentStatus(): void {
  const validation = validateEnvironment();
  
  console.log('🔍 Environment Validation Results:');
  console.log('================================');
  
  if (validation.isValid) {
    console.log('✅ Environment configuration is valid');
  } else {
    console.log('❌ Environment configuration has errors');
  }

  if (validation.errors.length > 0) {
    console.log('\n🚨 Errors:');
    validation.errors.forEach(error => console.log(`   - ${error}`));
  }

  if (validation.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    validation.warnings.forEach(warning => console.log(`   - ${warning}`));
  }

  console.log('\n📋 Configuration:');
  console.log(`   Node Environment: ${validation.config.nodeEnv}`);
  console.log(`   Supabase URL: ${validation.config.supabaseUrl || 'NOT SET'}`);
  console.log(`   Supabase Anon Key: ${validation.config.supabaseAnonKey || 'NOT SET'}`);
  console.log(`   Service Role Key: ${validation.config.hasServiceRoleKey ? 'SET' : 'NOT SET'}`);
  console.log(`   Gemini API Key: ${validation.config.hasGeminiApiKey ? 'SET' : 'NOT SET'}`);
}

// Client-side validation (safe for browser)
export function validateClientEnvironment(): Omit<EnvValidationResult, 'config'> & {
  config: Pick<EnvValidationResult['config'], 'nodeEnv' | 'isProduction' | 'isDevelopment'>;
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const nodeEnv = process.env.NODE_ENV || 'development';

  if (!supabaseUrl || supabaseUrl === 'https://placeholder.supabase.co') {
    errors.push('Supabase URL not configured');
  }

  if (!supabaseAnonKey || supabaseAnonKey === 'placeholder-key') {
    errors.push('Supabase anonymous key not configured');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    config: {
      nodeEnv,
      isProduction: nodeEnv === 'production',
      isDevelopment: nodeEnv === 'development',
    },
  };
}
