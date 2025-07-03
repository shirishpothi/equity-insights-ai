import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')
  const next = searchParams.get('next') ?? '/'

  // Log request details for debugging
  console.log('Auth callback - Request details:', {
    url: request.url,
    origin,
    code: code ? 'present' : 'missing',
    error,
    errorDescription,
    headers: {
      host: request.headers.get('host'),
      'x-forwarded-host': request.headers.get('x-forwarded-host'),
      'x-forwarded-proto': request.headers.get('x-forwarded-proto'),
    },
    env: process.env.NODE_ENV,
  })

  // Handle OAuth errors from Supabase
  if (error) {
    console.error('OAuth error from Supabase:', { error, errorDescription })
    const errorUrl = new URL('/auth/auth-code-error', origin)
    errorUrl.searchParams.set('error', error)
    if (errorDescription) {
      errorUrl.searchParams.set('error_description', errorDescription)
    }
    return NextResponse.redirect(errorUrl.toString())
  }

  if (code) {
    try {
      const supabase = await createClient()
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

      if (exchangeError) {
        console.error('Error exchanging code for session:', exchangeError)
        const errorUrl = new URL('/auth/auth-code-error', origin)
        errorUrl.searchParams.set('error', 'exchange_failed')
        errorUrl.searchParams.set('error_description', exchangeError.message)
        return NextResponse.redirect(errorUrl.toString())
      }

      if (data?.session) {
        console.log('Successfully exchanged code for session:', {
          userId: data.user?.id,
          email: data.user?.email,
        })

        // Determine the correct redirect URL
        const forwardedHost = request.headers.get('x-forwarded-host')
        const forwardedProto = request.headers.get('x-forwarded-proto') || 'https'
        const isLocalEnv = process.env.NODE_ENV === 'development'

        let redirectUrl: string

        if (isLocalEnv) {
          redirectUrl = `${origin}${next}`
        } else if (forwardedHost) {
          redirectUrl = `${forwardedProto}://${forwardedHost}${next}`
        } else {
          redirectUrl = `${origin}${next}`
        }

        console.log('Redirecting to:', redirectUrl)
        return NextResponse.redirect(redirectUrl)
      }
    } catch (error) {
      console.error('Unexpected error in auth callback:', error)
      const errorUrl = new URL('/auth/auth-code-error', origin)
      errorUrl.searchParams.set('error', 'unexpected_error')
      errorUrl.searchParams.set('error_description', error instanceof Error ? error.message : 'Unknown error')
      return NextResponse.redirect(errorUrl.toString())
    }
  }

  // No code parameter - invalid callback
  console.error('Auth callback called without code parameter')
  const errorUrl = new URL('/auth/auth-code-error', origin)
  errorUrl.searchParams.set('error', 'missing_code')
  errorUrl.searchParams.set('error_description', 'Authorization code not provided')
  return NextResponse.redirect(errorUrl.toString())
}
