'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase-client'
import { isSupabaseConfigured } from '@/lib/supabase'
import { profileService } from '@/lib/profile-service'
import { sessionManager } from '@/lib/session-manager'
import { isFeatureEnabled, FEATURE_FLAGS } from '@/lib/feature-flags'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  error: string | null
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  clearError: () => void
  retryAuth: () => Promise<void>
  refreshSession: () => Promise<void>
  sessionExpiresAt: number | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [sessionExpiresAt, setSessionExpiresAt] = useState<number | null>(null)
  const supabase = createClient()

  const clearError = () => setError(null)

  const updateSessionState = (session: Session | null) => {
    setSession(session)
    setUser(session?.user ?? null)
    setSessionExpiresAt(
      session?.expires_at ? new Date(session.expires_at * 1000).getTime() : null
    )
  }

  const getInitialSession = async (attempt = 1) => {
    try {
      setError(null)
      const sessionInfo = await sessionManager.validateAndRefreshSession()

      updateSessionState(sessionInfo.session)
      setRetryCount(0)
    } catch (error) {
      console.warn(`Failed to get session (attempt ${attempt}):`, error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to get session'

      // Retry logic for network errors
      if (attempt < 3 && (errorMessage.includes('network') || errorMessage.includes('timeout'))) {
        setTimeout(() => getInitialSession(attempt + 1), 1000 * attempt)
        return
      }

      setError(errorMessage)
      setRetryCount(attempt)
    } finally {
      setLoading(false)
    }
  }

  const retryAuth = async () => {
    setLoading(true)
    await getInitialSession()
  }

  const refreshSession = async () => {
    try {
      const result = await sessionManager.refreshSessionIfNeeded()
      if (result.success) {
        const sessionInfo = await sessionManager.getSessionInfo()
        updateSessionState(sessionInfo.session)
      } else {
        setError(result.error || 'Failed to refresh session')
      }
    } catch (error) {
      console.error('Error refreshing session:', error)
      setError(error instanceof Error ? error.message : 'Failed to refresh session')
    }
  }

  useEffect(() => {
    // Skip auth setup if Supabase is not configured
    if (!isSupabaseConfigured()) {
      setError('Authentication is not configured. Please check your environment variables.')
      setLoading(false)
      return
    }

    // Initialize session manager
    sessionManager.initialize()
    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email)

        if (event === 'SIGNED_OUT') {
          updateSessionState(null)
          setError(null)
          await sessionManager.clearSession()
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          updateSessionState(session)
          setError(null)

          // Ensure user profile exists and is up to date (if feature is enabled)
          if (session?.user && isFeatureEnabled(FEATURE_FLAGS.AUTH_USER_PROFILES)) {
            try {
              const profileResult = await profileService.ensureProfile(session.user)
              if (!profileResult.success) {
                console.warn('Failed to ensure user profile:', profileResult.error)
              }
            } catch (error) {
              console.warn('Error ensuring user profile:', error)
            }
          }
        } else if (event === 'USER_UPDATED') {
          updateSessionState(session)

          // Update profile when user data changes
          if (session?.user) {
            try {
              const profileResult = await profileService.ensureProfile(session.user)
              if (!profileResult.success) {
                console.warn('Failed to update user profile:', profileResult.error)
              }
            } catch (error) {
              console.warn('Error updating user profile:', error)
            }
          }
        }

        setLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
      sessionManager.cleanup()
    }
  }, [supabase.auth, getInitialSession])

  const signInWithGoogle = async () => {
    try {
      setError(null)

      // Check if Google OAuth is enabled via feature flag
      if (!isFeatureEnabled(FEATURE_FLAGS.AUTH_GOOGLE_OAUTH)) {
        throw new Error('Google OAuth authentication is currently disabled.')
      }

      // Check if Supabase integration is enabled
      if (!isFeatureEnabled(FEATURE_FLAGS.AUTH_SUPABASE_INTEGRATION)) {
        throw new Error('Authentication service is currently unavailable.')
      }

      if (!isSupabaseConfigured()) {
        throw new Error('Authentication is not configured. Please check your environment variables.')
      }

      // Determine the correct redirect URL for different environments
      const getRedirectUrl = () => {
        // In production, use the current origin
        if (typeof window !== 'undefined') {
          return `${window.location.origin}/auth/callback`
        }

        // Fallback for SSR
        return '/auth/callback'
      }

      const redirectTo = getRedirectUrl()
      console.log('OAuth redirect URL:', redirectTo)

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      })

      if (error) {
        console.error('Error signing in with Google:', error.message)
        setError(`Sign in failed: ${error.message}`)
        throw error
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setError(errorMessage)
      throw error
    }
  }

  const signOut = async () => {
    try {
      setError(null)

      // Check if Supabase integration is enabled
      if (!isFeatureEnabled(FEATURE_FLAGS.AUTH_SUPABASE_INTEGRATION)) {
        throw new Error('Authentication service is currently unavailable.')
      }

      if (!isSupabaseConfigured()) {
        throw new Error('Authentication is not configured. Please check your environment variables.')
      }

      // Use session manager for comprehensive cleanup
      const result = await sessionManager.clearSession()
      if (!result.success) {
        console.error('Error signing out:', result.error)
        setError(`Sign out failed: ${result.error}`)
        throw new Error(result.error)
      }

      // Clear local state immediately
      updateSessionState(null)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setError(errorMessage)
      throw error
    }
  }

  const value = {
    user,
    session,
    loading,
    error,
    signInWithGoogle,
    signOut,
    clearError,
    retryAuth,
    refreshSession,
    sessionExpiresAt
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
