#!/usr/bin/env node

/**
 * Script to set up OAuth configuration for the Equity Insights AI application
 * 
 * This script:
 * 1. Configures Supabase authentication settings
 * 2. Sets up proper redirect URLs for different environments
 * 3. Provides instructions for Google OAuth setup
 * 
 * Usage:
 * node scripts/setup-oauth.js [environment]
 * 
 * Examples:
 * node scripts/setup-oauth.js development
 * node scripts/setup-oauth.js production https://your-domain.com
 */

const https = require('https');

const SUPABASE_PROJECT_ID = 'cgqpqlmpywtbanztanvy';
const SUPABASE_API_URL = 'https://api.supabase.com';

function makeSupabaseRequest(path, method, data, token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.supabase.com',
      path: path,
      method: method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${parsed.message || body}`));
          }
        } catch (error) {
          reject(new Error(`Failed to parse response: ${body}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function setupOAuth(environment, customDomain) {
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  
  if (!token) {
    console.error('❌ SUPABASE_ACCESS_TOKEN environment variable is required');
    console.log('Get your access token from: https://supabase.com/dashboard/account/tokens');
    process.exit(1);
  }

  console.log(`🔧 Setting up OAuth for ${environment} environment...`);

  // Determine URLs based on environment
  let siteUrl, allowedUrls;
  
  if (environment === 'development') {
    siteUrl = 'http://localhost:9002';
    allowedUrls = [
      'http://localhost:9002/**',
      'http://localhost:3000/**',
      'http://127.0.0.1:9002/**',
      'http://127.0.0.1:3000/**'
    ];
  } else if (environment === 'production') {
    if (!customDomain) {
      console.error('❌ Production domain is required for production environment');
      console.log('Usage: node scripts/setup-oauth.js production https://your-domain.com');
      process.exit(1);
    }
    
    // Ensure domain starts with https://
    if (!customDomain.startsWith('http')) {
      customDomain = `https://${customDomain}`;
    }
    
    siteUrl = customDomain;
    allowedUrls = [
      `${customDomain}/**`,
      'http://localhost:9002/**', // Keep for local development
      'http://localhost:3000/**'
    ];
  } else {
    console.error('❌ Invalid environment. Use "development" or "production"');
    process.exit(1);
  }

  try {
    // Get current configuration
    console.log('📋 Getting current auth configuration...');
    const currentConfig = await makeSupabaseRequest(
      `/v1/projects/${SUPABASE_PROJECT_ID}/config/auth`,
      'GET',
      null,
      token
    );

    // Update configuration
    const updatedConfig = {
      ...currentConfig,
      site_url: siteUrl,
      uri_allow_list: allowedUrls.join(','),
      // Enable email confirmation for production
      mailer_autoconfirm: environment === 'development',
      // Security settings
      security_manual_linking_enabled: false,
      disable_signup: false,
    };

    console.log('🔄 Updating auth configuration...');
    await makeSupabaseRequest(
      `/v1/projects/${SUPABASE_PROJECT_ID}/config/auth`,
      'PATCH',
      updatedConfig,
      token
    );

    console.log('✅ Successfully updated Supabase auth configuration!');
    console.log('\n📝 Configuration Summary:');
    console.log(`   Environment: ${environment}`);
    console.log(`   Site URL: ${siteUrl}`);
    console.log(`   Allowed URIs: ${allowedUrls.join(', ')}`);
    
    console.log('\n🔗 Next Steps:');
    console.log('\n1. Set up Google OAuth credentials:');
    console.log('   - Go to: https://console.cloud.google.com/apis/credentials');
    console.log('   - Create OAuth 2.0 Client ID');
    console.log('   - Add authorized redirect URIs:');
    console.log(`     • https://${SUPABASE_PROJECT_ID}.supabase.co/auth/v1/callback`);
    
    console.log('\n2. Configure Google OAuth in Supabase:');
    console.log('   - Go to: https://supabase.com/dashboard/project/' + SUPABASE_PROJECT_ID + '/auth/providers');
    console.log('   - Enable Google provider');
    console.log('   - Add your Google OAuth Client ID and Secret');
    
    console.log('\n3. Test the authentication flow:');
    console.log(`   - Visit: ${siteUrl}/test-auth`);
    console.log('   - Try signing in with Google');
    
    if (environment === 'production') {
      console.log('\n4. Update environment variables:');
      console.log(`   - Set NEXT_PUBLIC_APP_URL=${siteUrl}`);
      console.log('   - Deploy your application');
    }

  } catch (error) {
    console.error('❌ Failed to setup OAuth configuration:', error.message);
    process.exit(1);
  }
}

// Parse command line arguments
const environment = process.argv[2] || 'development';
const customDomain = process.argv[3];

// Run the script
setupOAuth(environment, customDomain);
