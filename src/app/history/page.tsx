'use client'

import { useState, useEffect, useCallback } from 'react'

import { AuthGuard } from '@/components/auth/auth-guard'
import { analysisHistoryService, type AnalysisHistoryItem } from '@/lib/analysis-history'
import { useFeatureFlag, FEATURE_FLAGS } from '@/lib/feature-flags'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { 
  ArrowLeft, 
  Search, 
  Calendar, 
  Eye,
  Trash2,
  LoaderCircle,
  FileText
} from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

function AnalysisHistoryContent() {
  const [analyses, setAnalyses] = useState<AnalysisHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)
  const { toast } = useToast()

  // Check if analysis history feature is enabled
  const isAnalysisHistoryEnabled = useFeatureFlag(FEATURE_FLAGS.UI_ANALYSIS_HISTORY)

  const loadAnalyses = useCallback(async () => {
    setLoading(true)
    const result = await analysisHistoryService.getAnalysisHistory(50)
    
    if (result.success && result.data) {
      setAnalyses(result.data)
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to load analysis history',
        variant: 'destructive',
      })
    }
    setLoading(false)
  }, [toast])

  useEffect(() => {
    loadAnalyses()
  }, [loadAnalyses])

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      loadAnalyses()
      return
    }

    setSearchLoading(true)
    const result = await analysisHistoryService.searchAnalyses(query.trim())
    
    if (result.success && result.data) {
      setAnalyses(result.data)
    } else {
      toast({
        title: 'Search Error',
        description: result.error || 'Failed to search analyses',
        variant: 'destructive',
      })
    }
    setSearchLoading(false)
  }

  const handleDelete = async (id: string) => {
    const result = await analysisHistoryService.deleteAnalysis(id)
    
    if (result.success) {
      setAnalyses(prev => prev.filter(analysis => analysis.id !== id))
      toast({
        title: 'Deleted',
        description: 'Analysis deleted successfully',
      })
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to delete analysis',
        variant: 'destructive',
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoaderCircle className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your analysis history...</p>
        </div>
      </div>
    )
  }

  // If analysis history is disabled, show message
  if (!isAnalysisHistoryEnabled) {
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
            <h1 className="text-3xl font-bold">Analysis History</h1>
          </div>
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Analysis History Unavailable</h3>
              <p className="text-muted-foreground">
                The analysis history feature is currently disabled.
              </p>
            </CardContent>
          </Card>
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
          <h1 className="text-3xl font-bold">Analysis History</h1>
          <p className="text-muted-foreground">View and manage your stock analysis history</p>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by ticker, thesis, or goal..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                handleSearch(e.target.value)
              }}
              className="pl-10"
            />
            {searchLoading && (
              <LoaderCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin" />
            )}
          </div>
        </div>

        {analyses.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Analysis History</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? 'No analyses found matching your search.' : 'You haven\'t performed any stock analyses yet.'}
              </p>
              <Button asChild>
                <Link href="/">
                  Start Your First Analysis
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {analyses.map((analysis) => (
              <AnalysisCard 
                key={analysis.id} 
                analysis={analysis} 
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

interface AnalysisCardProps {
  analysis: AnalysisHistoryItem
  onDelete: (id: string) => void
}

function AnalysisCard({ analysis, onDelete }: AnalysisCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    await onDelete(analysis.id)
    setIsDeleting(false)
  }

  const createdAt = new Date(analysis.created_at)
  const timeAgo = formatDistanceToNow(createdAt, { addSuffix: true })

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="font-mono">
                {analysis.ticker}
              </Badge>
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="mr-1 h-3 w-3" />
                {timeAgo}
              </div>
            </div>
            <CardTitle className="text-lg">{analysis.investment_thesis}</CardTitle>
            <CardDescription className="line-clamp-2">
              {analysis.investment_goal}
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/history/${analysis.id}`}>
                <Eye className="mr-1 h-3 w-3" />
                View
              </Link>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <LoaderCircle className="h-3 w-3 animate-spin" />
              ) : (
                <Trash2 className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
    </Card>
  )
}

export default function HistoryPage() {
  return (
    <AuthGuard>
      <AnalysisHistoryContent />
    </AuthGuard>
  )
}
