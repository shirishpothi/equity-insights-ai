# Vercel Deployment Checklist for Authentication Fix

## 🎯 Quick Fix Summary

Your authentication is failing because Supabase OAuth redirect URLs are not configured for your Vercel domain. Follow this checklist to fix it.

## ✅ Pre-Deployment Checklist

### 1. Get Your Vercel Domain
- [ ] Deploy your app to Vercel (if not already done)
- [ ] Note your Vercel domain (e.g., `https://equity-insights-ai.vercel.app`)

### 2. Update Supabase Configuration

#### A. Site URL
- [ ] Go to [Supabase Dashboard](https://supabase.com/dashboard/project/cnncodajczcuofseptkm/auth/url-configuration)
- [ ] Update **Site URL** from `http://localhost:3000` to your Vercel domain
- [ ] Example: `https://equity-insights-ai.vercel.app`

#### B. Redirect URLs
- [ ] In the same page, add to **Redirect URLs**:
  ```
  https://your-vercel-domain.vercel.app/auth/callback
  http://localhost:9002/auth/callback
  ```

#### C. URI Allow List (Optional)
- [ ] If you have custom domains, update **URI Allow List** to include:
  ```
  https://your-vercel-domain.vercel.app/**
  http://localhost:9002/**
  ```

### 3. Verify Environment Variables in Vercel

- [ ] Go to Vercel Dashboard > Your Project > Settings > Environment Variables
- [ ] Ensure these are set for **Production**:
  ```
  NEXT_PUBLIC_SUPABASE_URL=https://cnncodajczcuofseptkm.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
  SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
  GOOGLE_GENAI_API_KEY=your_gemini_api_key_here
  ```

### 4. Google OAuth Configuration (If Needed)

- [ ] Go to [Google Cloud Console](https://console.cloud.google.com/)
- [ ] Navigate to **APIs & Services > Credentials**
- [ ] Edit your OAuth 2.0 Client ID
- [ ] Ensure **Authorized redirect URIs** includes:
  ```
  https://cnncodajczcuofseptkm.supabase.co/auth/v1/callback
  ```

## 🚀 Deployment Steps

### 1. Deploy Updated Code
- [ ] Commit all changes to your repository
- [ ] Push to your main branch
- [ ] Verify Vercel auto-deploys the changes

### 2. Test the Authentication Flow

#### A. Environment Validation
- [ ] Visit `https://your-vercel-domain.vercel.app/test-auth`
- [ ] Check that "Environment Variables" shows ✅
- [ ] Fix any configuration issues shown

#### B. Authentication Test
- [ ] Click "Sign In with Google" on your Vercel deployment
- [ ] Complete the Google OAuth flow
- [ ] Verify you're redirected back to your app successfully
- [ ] Check that you're signed in (user menu appears)

#### C. Database Test (If Signed In)
- [ ] On `/test-auth` page, click "Run Tests"
- [ ] Verify all tests pass:
  - [ ] Authentication ✅
  - [ ] Database Operations ✅
  - [ ] Row Level Security ✅

## 🔍 Troubleshooting

### If Authentication Still Fails:

1. **Check Vercel Function Logs**
   - Go to Vercel Dashboard > Your Project > Functions
   - Click on `/auth/callback` function
   - Check logs for detailed error messages

2. **Check Enhanced Error Page**
   - If redirected to `/auth/auth-code-error`
   - Use "Copy Error Details" button
   - Share error details for further debugging

3. **Common Issues & Solutions**

   | Error | Cause | Solution |
   |-------|-------|----------|
   | `redirect_uri_mismatch` | Redirect URL not in Supabase | Add Vercel domain to Supabase redirect URLs |
   | `invalid_request` | Site URL mismatch | Update Supabase Site URL to Vercel domain |
   | `access_denied` | Google OAuth issue | Check Google OAuth redirect URI configuration |
   | `exchange_failed` | Code exchange error | Check environment variables in Vercel |

## 📋 Verification Commands

### Local Testing (Optional)
```bash
# Test environment validation
npm run dev
# Visit http://localhost:9002/test-auth

# Update Supabase config (if you have access token)
npm run auth:setup https://your-vercel-domain.vercel.app
```

### Production Testing
```bash
# Check deployment status
vercel ls

# View function logs
vercel logs your-deployment-url
```

## 🎉 Success Indicators

You'll know it's working when:
- [ ] No redirect to `/auth/auth-code-error` page
- [ ] User is successfully signed in after Google OAuth
- [ ] User menu appears in the top navigation
- [ ] `/test-auth` page shows all tests passing
- [ ] No authentication errors in Vercel function logs

## 📞 Need Help?

If you're still experiencing issues:

1. **Check the error details** from the enhanced error page
2. **Review Vercel function logs** for specific error messages
3. **Verify all configuration steps** were completed correctly
4. **Test locally first** to ensure the code changes work

## 🔗 Useful Links

- [Supabase Auth Configuration](https://supabase.com/dashboard/project/cnncodajczcuofseptkm/auth/url-configuration)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)

---

**Remember**: The most common issue is forgetting to update the Supabase Site URL and Redirect URLs for your production domain!
