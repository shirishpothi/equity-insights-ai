# OAuth Setup Guide for Equity Insights AI

This guide walks you through setting up Google OAuth authentication for the Equity Insights AI application.

## Prerequisites

- Supabase project created and configured
- Google Cloud Console access
- Environment variables properly set

## Step 1: Google Cloud Console Setup

### 1.1 Create OAuth 2.0 Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project or create a new one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth 2.0 Client ID**
5. Configure the consent screen if prompted
6. Select **Web application** as the application type
7. Add the following **Authorized redirect URIs**:

   **For Development:**
   ```
   https://cgqpqlmpywtbanztanvy.supabase.co/auth/v1/callback
   ```

   **For Production (replace with your domain):**
   ```
   https://cgqpqlmpywtbanztanvy.supabase.co/auth/v1/callback
   ```

8. Click **Create** and save your **Client ID** and **Client Secret**

### 1.2 Configure OAuth Consent Screen

1. Go to **APIs & Services** > **OAuth consent screen**
2. Choose **External** user type (unless you have a Google Workspace)
3. Fill in the required information:
   - App name: `Equity Insights AI`
   - User support email: Your email
   - Developer contact information: Your email
4. Add scopes (optional, basic profile info is included by default)
5. Add test users if in development mode

## Step 2: Supabase Configuration

### 2.1 Enable Google OAuth Provider

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `Equity Insights AI`
3. Navigate to **Authentication** > **Providers**
4. Find **Google** and click to configure
5. Enable the Google provider
6. Enter your **Client ID** and **Client Secret** from Step 1.1
7. Click **Save**

### 2.2 Configure Redirect URLs

1. In the same **Authentication** section, go to **Settings**
2. Update the **Site URL** based on your environment:

   **Development:**
   ```
   http://localhost:9002
   ```

   **Production:**
   ```
   https://your-production-domain.com
   ```

3. Update **Redirect URLs** to include:

   **Development:**
   ```
   http://localhost:9002/**
   http://localhost:3000/**
   http://127.0.0.1:9002/**
   http://127.0.0.1:3000/**
   ```

   **Production:**
   ```
   https://your-production-domain.com/**
   http://localhost:9002/**
   http://localhost:3000/**
   ```

4. Click **Save**

## Step 3: Environment Variables

Ensure your `.env.local` file contains:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://cgqpqlmpywtbanztanvy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:9002  # Change for production

# Google AI (for analysis features)
GOOGLE_GENAI_API_KEY=your_google_ai_api_key
```

## Step 4: Testing

### 4.1 Development Testing

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Visit the test page:
   ```
   http://localhost:9002/test-auth
   ```

3. Click "Sign In with Google" and test the flow

### 4.2 Production Testing

1. Deploy your application to your hosting platform
2. Update environment variables in production
3. Test the authentication flow on your live site

## Step 5: Troubleshooting

### Common Issues

1. **"redirect_uri_mismatch" error**
   - Check that your redirect URIs in Google Console match exactly
   - Ensure Supabase redirect URLs are configured correctly

2. **"invalid_client" error**
   - Verify your Client ID and Secret are correct in Supabase
   - Check that the OAuth consent screen is properly configured

3. **Authentication callback errors**
   - Check browser console for detailed error messages
   - Verify environment variables are set correctly
   - Ensure NEXT_PUBLIC_APP_URL matches your actual domain

4. **Database connection issues**
   - Verify Supabase project is active
   - Check that RLS policies are properly configured
   - Ensure database tables exist

### Debug Steps

1. Check the browser network tab during authentication
2. Look at server logs for detailed error messages
3. Use the `/test-auth` page to verify configuration
4. Check Supabase logs in the dashboard

## Step 6: Production Deployment

### 6.1 Environment-Specific Configuration

**Vercel:**
```bash
# Set environment variables in Vercel dashboard
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

**Netlify:**
```bash
# Set environment variables in Netlify dashboard
NEXT_PUBLIC_APP_URL=https://your-app.netlify.app
```

### 6.2 Update OAuth Settings

1. Add your production domain to Google OAuth redirect URIs
2. Update Supabase redirect URLs to include your production domain
3. Test the complete authentication flow in production

## Security Considerations

1. **Never expose service role keys** in client-side code
2. **Use HTTPS in production** for all authentication flows
3. **Regularly rotate** OAuth credentials
4. **Monitor authentication logs** for suspicious activity
5. **Implement proper error handling** to avoid information leakage

## Support

If you encounter issues:

1. Check the [Supabase Auth documentation](https://supabase.com/docs/guides/auth)
2. Review [Google OAuth documentation](https://developers.google.com/identity/protocols/oauth2)
3. Check application logs and error messages
4. Use the built-in test page at `/test-auth` for debugging
