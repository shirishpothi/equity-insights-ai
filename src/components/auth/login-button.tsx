'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'
import { useToast } from '@/hooks/use-toast'
import { LoaderCircle } from 'lucide-react'
import { useFeatureFlag, FEATURE_FLAGS } from '@/lib/feature-flags'

interface LoginButtonProps {
  className?: string
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

export function LoginButton({ className, variant = 'default', size = 'default' }: LoginButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { signInWithGoogle, error, clearError } = useAuth()
  const { toast } = useToast()

  // Check if Google OAuth is enabled
  const isGoogleOAuthEnabled = useFeatureFlag(FEATURE_FLAGS.AUTH_GOOGLE_OAUTH)
  const isSupabaseEnabled = useFeatureFlag(FEATURE_FLAGS.AUTH_SUPABASE_INTEGRATION)

  const handleSignIn = async () => {
    // Check feature flags before attempting sign in
    if (!isGoogleOAuthEnabled) {
      toast({
        title: 'Sign In Unavailable',
        description: 'Google OAuth authentication is currently disabled.',
        variant: 'destructive',
      })
      return
    }

    if (!isSupabaseEnabled) {
      toast({
        title: 'Sign In Unavailable',
        description: 'Authentication service is currently unavailable.',
        variant: 'destructive',
      })
      return
    }

    try {
      setIsLoading(true)
      clearError() // Clear any previous errors
      await signInWithGoogle()
    } catch (error) {
      console.error('Sign in error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      toast({
        title: 'Sign In Failed',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Don't render the button if authentication features are disabled
  if (!isGoogleOAuthEnabled || !isSupabaseEnabled) {
    return (
      <Button
        disabled
        className={className}
        variant="outline"
        size={size}
      >
        Sign In Unavailable
      </Button>
    )
  }

  return (
    <Button
      onClick={handleSignIn}
      disabled={isLoading}
      className={className}
      variant={variant}
      size={size}
    >
      {isLoading ? (
        <>
          <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
          Signing in...
        </>
      ) : (
        <>
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </>
      )}
    </Button>
  )
}
