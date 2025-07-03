# Authentication System Documentation

This document describes the complete authentication system and analysis history feature implemented for the Equity Insights AI application using Supabase.

## Overview

The authentication system provides:
- Google OAuth login/logout
- Secure session management
- User profile management
- Analysis history storage with Row Level Security (RLS)
- Protected routes and components

## Architecture

### Components

1. **Authentication Context** (`src/contexts/auth-context.tsx`)
   - Manages authentication state
   - Provides login/logout functions
   - Handles session persistence

2. **Authentication Components**
   - `LoginButton` - Google OAuth login button
   - `UserMenu` - User profile dropdown menu
   - `AuthGuard` - Component for protecting routes

3. **Database Schema**
   - `profiles` table - User profile information
   - `analysis_history` table - User analysis data

4. **Analysis History Service** (`src/lib/analysis-history.ts`)
   - CRUD operations for analysis data
   - Automatic user association
   - Search functionality

## Database Schema

### Profiles Table
```sql
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Analysis History Table
```sql
CREATE TABLE public.analysis_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  ticker TEXT NOT NULL,
  investment_thesis TEXT NOT NULL,
  investment_goal TEXT NOT NULL,
  analysis_result JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Row Level Security (RLS)

RLS policies ensure users can only access their own data:

### Profiles Policies
- Users can view their own profile
- Users can update their own profile
- Users can insert their own profile

### Analysis History Policies
- Users can view their own analysis history
- Users can insert their own analysis history
- Users can update their own analysis history
- Users can delete their own analysis history

## Environment Variables

Required environment variables in `.env.local`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Google AI API Key
GOOGLE_GENAI_API_KEY=your_google_ai_api_key

# Next.js Configuration
NEXT_PUBLIC_APP_URL=http://localhost:9002
NODE_ENV=development
```

## Features

### Authentication Flow
1. User clicks "Continue with Google"
2. Redirected to Google OAuth
3. After approval, redirected back to `/auth/callback`
4. Session established and user profile created/updated
5. User can access protected features

### Analysis History
- Automatic saving of analysis results for authenticated users
- Manual save option for analyses
- View analysis history with search functionality
- Individual analysis detail pages
- PDF export for saved analyses
- Delete analyses

### Protected Routes
- `/history` - Analysis history page
- `/profile` - User profile page
- Middleware automatically redirects unauthenticated users

## Usage

### Wrapping Components with Authentication
```tsx
import { AuthGuard } from '@/components/auth/auth-guard'

function ProtectedComponent() {
  return (
    <AuthGuard>
      <YourProtectedContent />
    </AuthGuard>
  )
}
```

### Using Authentication Context
```tsx
import { useAuth } from '@/contexts/auth-context'

function MyComponent() {
  const { user, signInWithGoogle, signOut } = useAuth()
  
  return (
    <div>
      {user ? (
        <button onClick={signOut}>Sign Out</button>
      ) : (
        <button onClick={signInWithGoogle}>Sign In</button>
      )}
    </div>
  )
}
```

### Saving Analysis Data
```tsx
import { analysisHistoryService } from '@/lib/analysis-history'

const saveAnalysis = async () => {
  const result = await analysisHistoryService.saveAnalysis({
    ticker: 'AAPL',
    investment_thesis: 'Strong growth potential',
    investment_goal: 'Long-term investment',
    analysis_result: analysisData
  })
  
  if (result.success) {
    console.log('Analysis saved:', result.data)
  }
}
```

## Security Features

1. **Row Level Security (RLS)** - Database-level security ensuring users only access their data
2. **JWT Validation** - Automatic token validation on all requests
3. **Secure Session Management** - Automatic token refresh and session persistence
4. **Protected Routes** - Middleware-based route protection
5. **HTTPS Redirects** - Secure authentication callbacks

## Testing

Visit `/test-auth` to run authentication and database tests:
- Authentication status
- Database connectivity
- Row Level Security validation

## Deployment Considerations

1. **Supabase Configuration**
   - Configure allowed redirect URLs in Supabase dashboard
   - Set up Google OAuth credentials
   - Enable RLS on all tables

2. **Environment Variables**
   - Set all required environment variables in production
   - Use secure service role key storage

3. **Domain Configuration**
   - Update `NEXT_PUBLIC_APP_URL` for production domain
   - Configure OAuth redirect URLs for production

## Troubleshooting

### Common Issues

1. **Authentication Callback Errors**
   - Check redirect URLs in Supabase dashboard
   - Verify OAuth credentials

2. **Database Access Denied**
   - Verify RLS policies are correctly configured
   - Check user authentication status

3. **Session Not Persisting**
   - Check cookie settings
   - Verify domain configuration

### Debug Mode

Enable debug logging by setting:
```env
NEXT_PUBLIC_SUPABASE_DEBUG=true
```

## Support

For issues related to:
- Supabase configuration: Check Supabase documentation
- Google OAuth: Check Google Cloud Console
- Next.js integration: Check Next.js documentation
