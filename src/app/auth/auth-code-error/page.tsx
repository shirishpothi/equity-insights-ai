'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, Copy } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useState } from 'react'

export default function AuthCodeError() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')
  const [copied, setCopied] = useState(false)

  const copyErrorDetails = () => {
    const errorDetails = {
      error,
      errorDescription,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    }
    navigator.clipboard.writeText(JSON.stringify(errorDetails, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-xl">Authentication Error</CardTitle>
          <CardDescription>
            Sorry, we couldn&apos;t complete your sign-in process.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-left">
              <p className="text-sm font-medium text-red-800">Error: {error}</p>
              {errorDescription && (
                <p className="text-sm text-red-600 mt-1">{errorDescription}</p>
              )}
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={copyErrorDetails}
              >
                <Copy className="h-3 w-3 mr-1" />
                {copied ? 'Copied!' : 'Copy Error Details'}
              </Button>
            </div>
          )}

          <p className="text-sm text-muted-foreground">
            This could be due to:
          </p>
          <ul className="text-sm text-muted-foreground text-left space-y-1">
            <li>• The authentication link has expired</li>
            <li>• The link has already been used</li>
            <li>• There was a network error</li>
            <li>• OAuth redirect URL configuration issue</li>
            <li>• Supabase environment variables not set correctly</li>
          </ul>
          <div className="pt-4 space-y-2">
            <Button asChild className="w-full">
              <Link href="/">
                Return to Home
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/test-auth">
                Test Authentication Setup
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
