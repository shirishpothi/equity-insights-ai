'use client'

import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LoginButton } from './login-button'
import { UserMenu } from './user-menu'
import { LoaderCircle, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react'

interface AuthStatusProps {
  showFullCard?: boolean
  className?: string
}

export function AuthStatus({ showFullCard = false, className }: AuthStatusProps) {
  const { user, loading, error, clearError, retryAuth } = useAuth()

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <LoaderCircle className="h-4 w-4 animate-spin" />
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    )
  }

  if (error) {
    if (showFullCard) {
      return (
        <Card className={className}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <span>Authentication Error</span>
            </CardTitle>
            <CardDescription>
              There was a problem with authentication.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="flex space-x-2">
              <Button onClick={retryAuth} variant="outline" size="sm">
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
              <Button onClick={clearError} variant="ghost" size="sm">
                Dismiss
              </Button>
            </div>
          </CardContent>
        </Card>
      )
    }

    return (
      <Alert variant="destructive" className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>{error}</span>
          <div className="flex space-x-1">
            <Button onClick={retryAuth} variant="ghost" size="sm">
              <RefreshCw className="h-3 w-3" />
            </Button>
            <Button onClick={clearError} variant="ghost" size="sm">
              ×
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  if (user) {
    if (showFullCard) {
      return (
        <Card className={className}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span>Signed In</span>
            </CardTitle>
            <CardDescription>
              You are signed in as {user.email}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UserMenu />
          </CardContent>
        </Card>
      )
    }

    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <CheckCircle className="h-4 w-4 text-green-500" />
        <span className="text-sm">Signed in as {user.email}</span>
        <UserMenu />
      </div>
    )
  }

  if (showFullCard) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Sign In Required</CardTitle>
          <CardDescription>
            Please sign in to access all features and save your analysis history.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginButton className="w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <span className="text-sm text-muted-foreground">Not signed in</span>
      <LoginButton size="sm" variant="outline" />
    </div>
  )
}
