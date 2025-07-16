'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { 
  getFeatureFlagService, 
  useFeatureFlag, 
  useAllFeatureFlags,
  FEATURE_FLAGS,
  type FeatureFlagResult 
} from '@/lib/feature-flags'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import {
  ArrowLeft,
  Settings,
  Shield,
  RefreshCw,
  AlertTriangle
} from 'lucide-react'
import Link from 'next/link'
import { formatFeatureFlagKey, getFeatureFlagCategory } from '@/lib/feature-flags/utils'

export default function FeatureFlagsAdminPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Check if user has access to feature flag management
  const hasAdminAccess = useFeatureFlag(FEATURE_FLAGS.ADMIN_FEATURE_FLAG_MANAGEMENT)
  const allFlags = useAllFeatureFlags()

  const service = getFeatureFlagService()

  // Filter flags based on search query
  const filteredFlags: [string, FeatureFlagResult][] = Object.entries(allFlags).filter(([key]) => {
    const searchLower = searchQuery.toLowerCase()
    return (
      key.toLowerCase().includes(searchLower) ||
      formatFeatureFlagKey(key).toLowerCase().includes(searchLower) ||
      getFeatureFlagCategory(key).toLowerCase().includes(searchLower)
    )
  }) as [string, FeatureFlagResult][]

  // Group flags by category
  const flagsByCategory = filteredFlags.reduce((acc, [key, result]) => {
    const category = getFeatureFlagCategory(key)
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push([key, result])
    return acc
  }, {} as Record<string, [string, FeatureFlagResult][]>)

  const handleToggleFlag = async (flagKey: string) => {
    setLoading(true)
    try {
      const success: boolean = service.toggleFlag(flagKey)
      if (success) {
        toast({
          title: 'Flag Updated',
          description: `Successfully toggled ${formatFeatureFlagKey(flagKey)}`,
        })
        // Refresh the page to show updated state
        window.location.reload()
      } else {
        toast({
          title: 'Update Failed',
          description: 'Failed to toggle flag. Only boolean flags can be toggled.',
          variant: 'destructive',
        })
      }
    } catch {
      toast({
        title: 'Error',
        description: 'An error occurred while updating the flag.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRefreshConfig = () => {
    service.refreshConfig()
    toast({
      title: 'Configuration Refreshed',
      description: 'Feature flag configuration has been reloaded.',
    })
    window.location.reload()
  }

  // Check authentication and access
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Alert variant="destructive">
            <Shield className="h-4 w-4" />
            <AlertTitle>Authentication Required</AlertTitle>
            <AlertDescription>
              You must be signed in to access the admin interface.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  if (!hasAdminAccess) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Alert variant="destructive">
            <Shield className="h-4 w-4" />
            <AlertTitle>Access Denied</AlertTitle>
            <AlertDescription>
              You don&apos;t have permission to access the feature flag management interface.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center">
                <Settings className="mr-3 h-8 w-8" />
                Feature Flag Management
              </h1>
              <p className="text-muted-foreground">
                Manage feature flags for the Equity Insights AI application
              </p>
            </div>
            <Button onClick={handleRefreshConfig} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Config
            </Button>
          </div>
        </div>

        <Alert className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Admin Interface</AlertTitle>
          <AlertDescription>
            Changes made here affect the application immediately. Use caution when modifying feature flags.
          </AlertDescription>
        </Alert>

        <div className="mb-6">
          <Label htmlFor="search">Search Flags</Label>
          <Input
            id="search"
            placeholder="Search by name, key, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mt-2"
          />
        </div>

        <Tabs defaultValue="by-category" className="space-y-6">
          <TabsList>
            <TabsTrigger value="by-category">By Category</TabsTrigger>
            <TabsTrigger value="all-flags">All Flags</TabsTrigger>
          </TabsList>

          <TabsContent value="by-category" className="space-y-6">
            {Object.entries(flagsByCategory).map(([category, flags]) => (
              <Card key={category}>
                <CardHeader>
                  <CardTitle>{category}</CardTitle>
                  <CardDescription>
                    {flags.length} flag{flags.length !== 1 ? 's' : ''} in this category
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {flags.map(([key, result]) => (
                      <FlagItem
                        key={key}
                        flagKey={key}
                        result={result}
                        onToggle={handleToggleFlag}
                        loading={loading}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="all-flags" className="space-y-4">
            {filteredFlags.map(([key, result]) => (
              <Card key={key}>
                <CardContent className="p-4">
                  <FlagItem
                    flagKey={key}
                    result={result}
                    onToggle={handleToggleFlag}
                    loading={loading}
                  />
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

interface FlagItemProps {
  flagKey: string
  result: FeatureFlagResult
  onToggle: (key: string) => void
  loading: boolean
}

function FlagItem({ flagKey, result, onToggle, loading }: FlagItemProps) {
  const flag = result.flag

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex-1">
        <div className="flex items-center space-x-2 mb-2">
          <h4 className="font-medium">{formatFeatureFlagKey(flagKey)}</h4>
          <Badge variant={result.enabled ? 'default' : 'secondary'}>
            {result.enabled ? 'Enabled' : 'Disabled'}
          </Badge>
          {flag && (
            <Badge variant="outline">
              {flag.type}
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground mb-1">
          Key: <code className="bg-muted px-1 rounded">{flagKey}</code>
        </p>
        {flag?.description && (
          <p className="text-sm text-muted-foreground mb-2">{flag.description}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Reason: {result.reason}
        </p>
        {flag?.type === 'percentage' && (
          <p className="text-xs text-muted-foreground">
            Percentage: {(flag as { percentage: number }).percentage}%
          </p>
        )}
      </div>
      <div className="flex items-center space-x-2">
        {flag?.type === 'boolean' && (
          <Switch
            checked={result.enabled}
            onCheckedChange={() => onToggle(flagKey)}
            disabled={loading}
          />
        )}
        {flag?.type !== 'boolean' && (
          <Badge variant="outline">
            {flag?.type === 'percentage' ? 'Percentage' : 'User Specific'}
          </Badge>
        )}
      </div>
    </div>
  )
}
