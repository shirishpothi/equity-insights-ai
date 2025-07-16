'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Clock, RefreshCw, AlertTriangle } from 'lucide-react'

interface SessionStatusProps {
  showDetails?: boolean
  className?: string
}

export function SessionStatus({ showDetails = false, className }: SessionStatusProps) {
  const { session, sessionExpiresAt, refreshSession, loading } = useAuth()
  const [timeUntilExpiry, setTimeUntilExpiry] = useState<number | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    if (!sessionExpiresAt) return

    const updateTimer = () => {
      const now = Date.now()
      const remaining = Math.max(0, sessionExpiresAt - now)
      setTimeUntilExpiry(remaining)
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [sessionExpiresAt])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refreshSession()
    } catch (error) {
      console.error('Failed to refresh session:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const formatTime = (ms: number): string => {
    const minutes = Math.floor(ms / (1000 * 60))
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}d ${hours % 24}h`
    if (hours > 0) return `${hours}h ${minutes % 60}m`
    return `${minutes}m`
  }

  const getExpiryStatus = () => {
    if (!timeUntilExpiry) return { status: 'unknown', color: 'gray' }
    
    const hours = timeUntilExpiry / (1000 * 60 * 60)
    
    if (hours < 1) return { status: 'critical', color: 'red' }
    if (hours < 6) return { status: 'warning', color: 'yellow' }
    return { status: 'good', color: 'green' }
  }

  const getProgressValue = () => {
    if (!timeUntilExpiry || !session?.expires_at) return 0
    
    const totalDuration = 60 * 60 * 1000 // 1 hour in ms (typical session duration)
    const remaining = timeUntilExpiry
    
    return Math.max(0, Math.min(100, (remaining / totalDuration) * 100))
  }

  if (loading || !session) {
    return null
  }

  const expiryStatus = getExpiryStatus()
  const progressValue = getProgressValue()

  if (!showDetails) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Clock className="h-4 w-4" />
        <span className="text-sm">
          {timeUntilExpiry ? formatTime(timeUntilExpiry) : 'Unknown'}
        </span>
        {expiryStatus.status === 'critical' && (
          <AlertTriangle className="h-4 w-4 text-red-500" />
        )}
        <Button
          onClick={handleRefresh}
          disabled={isRefreshing}
          size="sm"
          variant="ghost"
        >
          <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Clock className="h-5 w-5" />
          <span>Session Status</span>
        </CardTitle>
        <CardDescription>
          Current authentication session information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Status</span>
          <Badge 
            variant={expiryStatus.status === 'good' ? 'default' : 
                    expiryStatus.status === 'warning' ? 'secondary' : 'destructive'}
          >
            {expiryStatus.status === 'good' ? 'Active' :
             expiryStatus.status === 'warning' ? 'Expiring Soon' : 'Critical'}
          </Badge>
        </div>

        {timeUntilExpiry && (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Time Remaining</span>
                <span className="text-sm">{formatTime(timeUntilExpiry)}</span>
              </div>
              <Progress value={progressValue} className="h-2" />
            </div>

            {expiryStatus.status === 'critical' && (
              <div className="flex items-center space-x-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-700">
                  Session expires soon. Please refresh or sign in again.
                </span>
              </div>
            )}
          </>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Expires At</span>
            <span className="text-sm">
              {sessionExpiresAt ? 
                new Date(sessionExpiresAt).toLocaleString() : 
                'Unknown'
              }
            </span>
          </div>
        </div>

        <Button
          onClick={handleRefresh}
          disabled={isRefreshing}
          variant="outline"
          className="w-full"
        >
          {isRefreshing ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Refreshing...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Session
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
