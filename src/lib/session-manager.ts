import { createClient } from '@/lib/supabase-client'
import type { Session, User } from '@supabase/supabase-js'
import { isFeatureEnabled, FEATURE_FLAGS } from '@/lib/feature-flags'

export interface SessionInfo {
  user: User | null
  session: Session | null
  isValid: boolean
  expiresAt: number | null
  refreshToken: string | null
}

class SessionManager {
  private supabase = createClient()
  private sessionCheckInterval: NodeJS.Timeout | null = null
  private readonly SESSION_CHECK_INTERVAL = 5 * 60 * 1000 // 5 minutes
  private readonly REFRESH_THRESHOLD = 10 * 60 * 1000 // 10 minutes before expiry

  /**
   * Initialize session management with automatic refresh
   */
  initialize() {
    // Only initialize if session persistence is enabled
    if (isFeatureEnabled(FEATURE_FLAGS.AUTH_SESSION_PERSISTENCE)) {
      this.startSessionMonitoring()
      this.setupVisibilityChangeHandler()
      this.setupBeforeUnloadHandler()
    }
  }

  /**
   * Clean up session management
   */
  cleanup() {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval)
      this.sessionCheckInterval = null
    }
  }

  /**
   * Get current session information
   */
  async getSessionInfo(): Promise<SessionInfo> {
    try {
      const { data: { session }, error } = await this.supabase.auth.getSession()
      
      if (error) {
        console.warn('Error getting session:', error)
        return {
          user: null,
          session: null,
          isValid: false,
          expiresAt: null,
          refreshToken: null
        }
      }

      const isValid = this.isSessionValid(session)
      
      return {
        user: session?.user || null,
        session,
        isValid,
        expiresAt: session?.expires_at ? new Date(session.expires_at * 1000).getTime() : null,
        refreshToken: session?.refresh_token || null
      }
    } catch (error) {
      console.error('Failed to get session info:', error)
      return {
        user: null,
        session: null,
        isValid: false,
        expiresAt: null,
        refreshToken: null
      }
    }
  }

  /**
   * Check if session is valid and not expired
   */
  private isSessionValid(session: Session | null): boolean {
    if (!session) return false
    
    const now = Date.now()
    const expiresAt = session.expires_at ? new Date(session.expires_at * 1000).getTime() : 0
    
    return expiresAt > now
  }

  /**
   * Check if session needs refresh
   */
  private needsRefresh(session: Session | null): boolean {
    if (!session || !session.expires_at) return false
    
    const now = Date.now()
    const expiresAt = new Date(session.expires_at * 1000).getTime()
    
    return (expiresAt - now) < this.REFRESH_THRESHOLD
  }

  /**
   * Refresh session if needed
   */
  async refreshSessionIfNeeded(): Promise<{ success: boolean; error?: string }> {
    try {
      const sessionInfo = await this.getSessionInfo()
      
      if (!sessionInfo.session) {
        return { success: false, error: 'No active session' }
      }

      if (!this.needsRefresh(sessionInfo.session)) {
        return { success: true }
      }

      console.log('Refreshing session...')
      const { data, error } = await this.supabase.auth.refreshSession()
      
      if (error) {
        console.error('Session refresh failed:', error)
        return { success: false, error: error.message }
      }

      if (data.session) {
        console.log('Session refreshed successfully')
        return { success: true }
      }

      return { success: false, error: 'No session returned after refresh' }
    } catch (error) {
      console.error('Session refresh error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Start monitoring session and auto-refresh
   */
  private startSessionMonitoring() {
    this.sessionCheckInterval = setInterval(async () => {
      await this.refreshSessionIfNeeded()
    }, this.SESSION_CHECK_INTERVAL)
  }

  /**
   * Handle page visibility changes to refresh session when page becomes visible
   */
  private setupVisibilityChangeHandler() {
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', async () => {
        if (!document.hidden) {
          // Page became visible, check if session needs refresh
          await this.refreshSessionIfNeeded()
        }
      })
    }
  }

  /**
   * Handle page unload to clean up resources
   */
  private setupBeforeUnloadHandler() {
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.cleanup()
      })
    }
  }

  /**
   * Clear all session data and clean up
   */
  async clearSession(): Promise<{ success: boolean; error?: string }> {
    try {
      // Sign out from Supabase
      const { error } = await this.supabase.auth.signOut()
      
      if (error) {
        console.error('Error during sign out:', error)
        return { success: false, error: error.message }
      }

      // Clear any local storage or session storage if needed
      if (typeof window !== 'undefined') {
        // Clear any app-specific storage
        try {
          localStorage.removeItem('supabase.auth.token')
          sessionStorage.clear()
        } catch (storageError) {
          console.warn('Error clearing storage:', storageError)
        }
      }

      this.cleanup()
      return { success: true }
    } catch (error) {
      console.error('Session cleanup error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Validate session and refresh if necessary
   */
  async validateAndRefreshSession(): Promise<SessionInfo> {
    const sessionInfo = await this.getSessionInfo()
    
    if (sessionInfo.session && !sessionInfo.isValid) {
      // Session is expired, try to refresh
      const refreshResult = await this.refreshSessionIfNeeded()
      
      if (refreshResult.success) {
        // Get updated session info after refresh
        return await this.getSessionInfo()
      }
    }
    
    return sessionInfo
  }

  /**
   * Get time until session expires
   */
  getTimeUntilExpiry(session: Session | null): number | null {
    if (!session || !session.expires_at) return null
    
    const now = Date.now()
    const expiresAt = new Date(session.expires_at * 1000).getTime()
    
    return Math.max(0, expiresAt - now)
  }

  /**
   * Check if user is authenticated with valid session
   */
  async isAuthenticated(): Promise<boolean> {
    const sessionInfo = await this.getSessionInfo()
    return sessionInfo.isValid && !!sessionInfo.user
  }
}

export const sessionManager = new SessionManager()
