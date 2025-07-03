# Vercel Authentication Setup Guide

## 🚨 Critical Issue Identified

Your Supabase authentication is failing in Vercel because the OAuth redirect URLs are not configured for your Vercel domain.

## Current Configuration Issues

1. **Site URL**: Currently set to `http://localhost:3000` (development only)
2. **URI Allow List**: Missing your Vercel production domain
3. **OAuth Redirect URLs**: Not configured for production environment

## Step-by-Step Fix

### 1. Get Your Vercel Domain

First, identify your Vercel deployment URL:
- Go to your Vercel dashboard
- Find your project deployment URL (e.g., `https://your-app-name.vercel.app`)

### 2. Update Supabase Configuration

Go to your Supabase dashboard (https://supabase.com/dashboard) and update:

#### A. Site URL
1. Navigate to **Authentication > Settings**
2. Update **Site URL** to: `https://your-vercel-domain.vercel.app`

#### B. Redirect URLs
1. In **Authentication > Settings**
2. Add to **Redirect URLs**:
   ```
   https://your-vercel-domain.vercel.app/auth/callback
   http://localhost:9002/auth/callback
   ```

#### C. URI Allow List (if using custom domains)
1. Navigate to **Authentication > Settings**
2. Update **URI Allow List** to include:
   ```
   https://your-vercel-domain.vercel.app/**
   http://localhost:9002/**
   ```

### 3. Verify Environment Variables in Vercel

Ensure these environment variables are set in your Vercel project:

1. Go to Vercel Dashboard > Your Project > Settings > Environment Variables
2. Verify these are set:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://cnncodajczcuofseptkm.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   GOOGLE_GENAI_API_KEY=your_gemini_api_key
   ```

### 4. Google OAuth Configuration

If you haven't already, ensure your Google OAuth app includes your Vercel domain:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services > Credentials**
3. Edit your OAuth 2.0 Client ID
4. Add to **Authorized redirect URIs**:
   ```
   https://cnncodajczcuofseptkm.supabase.co/auth/v1/callback
   ```

### 5. Test the Configuration

After making these changes:

1. Deploy your updated code to Vercel
2. Visit your Vercel deployment
3. Try signing in with Google
4. Check the enhanced error logging in Vercel's function logs

## Common Issues and Solutions

### Issue: "Invalid redirect URL"
- **Cause**: Redirect URL not added to Supabase settings
- **Solution**: Add your Vercel domain to redirect URLs

### Issue: "Site URL mismatch"
- **Cause**: Site URL still set to localhost
- **Solution**: Update Site URL to your Vercel domain

### Issue: "OAuth error: redirect_uri_mismatch"
- **Cause**: Google OAuth app doesn't include Supabase callback URL
- **Solution**: Add Supabase callback URL to Google OAuth settings

## Enhanced Debugging

The updated auth callback route now provides detailed logging. Check Vercel's function logs:

1. Go to Vercel Dashboard > Your Project > Functions
2. Click on the auth callback function
3. View the logs for detailed error information

## Quick Verification Checklist

- [ ] Supabase Site URL updated to Vercel domain
- [ ] Vercel domain added to Supabase Redirect URLs
- [ ] Environment variables set in Vercel
- [ ] Google OAuth includes Supabase callback URL
- [ ] Code deployed to Vercel
- [ ] Test authentication flow

## Need Help?

If you're still experiencing issues:

1. Check the enhanced error page at `/auth/auth-code-error`
2. Copy the error details using the "Copy Error Details" button
3. Check Vercel function logs for detailed debugging information
4. Visit `/test-auth` to verify Supabase connectivity

## Example Configuration

For a Vercel app at `https://equity-insights-ai.vercel.app`:

**Supabase Settings:**
- Site URL: `https://equity-insights-ai.vercel.app`
- Redirect URLs: 
  - `https://equity-insights-ai.vercel.app/auth/callback`
  - `http://localhost:9002/auth/callback`

**Google OAuth:**
- Authorized redirect URIs: `https://cnncodajczcuofseptkm.supabase.co/auth/v1/callback`
