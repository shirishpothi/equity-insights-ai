'use client'

import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LoginButton } from './login-button'
import { LoaderCircle, Shield } from 'lucide-react'

interface AuthGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoaderCircle className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-xl">Authentication Required</CardTitle>
            <CardDescription>
              Please sign in to access this feature and save your analysis history.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <LoginButton className="w-full" />
            <p className="mt-4 text-xs text-muted-foreground">
              Your data is secure and private. We only use your email to identify your account.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}
