#!/usr/bin/env node

/**
 * Script to update Supabase authentication configuration for Vercel deployment
 * 
 * Usage:
 * node scripts/update-supabase-auth.js <vercel-domain>
 * 
 * Example:
 * node scripts/update-supabase-auth.js https://equity-insights-ai.vercel.app
 */

const https = require('https');

const SUPABASE_PROJECT_ID = 'cnncodajczcuofseptkm';
const SUPABASE_API_URL = 'https://api.supabase.com';

function makeSupabaseRequest(path, method, data, token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.supabase.com',
      port: 443,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    };

    if (data) {
      const postData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsedData);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${parsedData.message || responseData}`));
          }
        } catch (error) {
          reject(new Error(`Failed to parse response: ${responseData}`));
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

async function updateSupabaseAuth(vercelDomain) {
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  
  if (!token) {
    console.error('❌ SUPABASE_ACCESS_TOKEN environment variable is required');
    console.log('Get your access token from: https://supabase.com/dashboard/account/tokens');
    process.exit(1);
  }

  if (!vercelDomain) {
    console.error('❌ Vercel domain is required');
    console.log('Usage: node scripts/update-supabase-auth.js <vercel-domain>');
    console.log('Example: node scripts/update-supabase-auth.js https://equity-insights-ai.vercel.app');
    process.exit(1);
  }

  // Ensure domain starts with https://
  if (!vercelDomain.startsWith('http')) {
    vercelDomain = `https://${vercelDomain}`;
  }

  console.log(`🔧 Updating Supabase auth configuration for: ${vercelDomain}`);

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
      site_url: vercelDomain,
      uri_allow_list: [
        `${vercelDomain}/**`,
        'http://localhost:9002/**',
        'http://localhost:3000/**',
        // Keep existing allowed URIs
        ...currentConfig.uri_allow_list.split(',').filter(uri => 
          !uri.includes('localhost') && uri.trim() !== ''
        )
      ].join(',')
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
    console.log(`   Site URL: ${updatedConfig.site_url}`);
    console.log(`   Allowed URIs: ${updatedConfig.uri_allow_list}`);
    
    console.log('\n🔗 Next Steps:');
    console.log('1. Add these redirect URLs in Supabase Dashboard > Authentication > Settings:');
    console.log(`   - ${vercelDomain}/auth/callback`);
    console.log('   - http://localhost:9002/auth/callback');
    console.log('\n2. Verify Google OAuth settings include:');
    console.log(`   - https://${SUPABASE_PROJECT_ID}.supabase.co/auth/v1/callback`);
    console.log('\n3. Deploy your updated code to Vercel');
    console.log('4. Test the authentication flow');

  } catch (error) {
    console.error('❌ Failed to update Supabase configuration:', error.message);
    process.exit(1);
  }
}

// Run the script
const vercelDomain = process.argv[2];
updateSupabaseAuth(vercelDomain);
