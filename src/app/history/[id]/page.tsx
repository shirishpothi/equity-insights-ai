'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AuthGuard } from '@/components/auth/auth-guard'
import { analysisHistoryService, type AnalysisHistoryItem } from '@/lib/analysis-history'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'

import { PdfReport } from '@/components/pdf-report'
import { 
  ArrowLeft, 
  Calendar, 
  Download,
  Trash2, 
  LoaderCircle,
  AlertCircle
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'


function AnalysisDetailContent() {
  const params = useParams()
  const router = useRouter()
  const [analysis, setAnalysis] = useState<AnalysisHistoryItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const { toast } = useToast()

  const loadAnalysis = useCallback(async (id: string) => {
    setLoading(true)
    const result = await analysisHistoryService.getAnalysisById(id)
    
    if (result.success && result.data) {
      setAnalysis(result.data)
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to load analysis',
        variant: 'destructive',
      })
    }
    setLoading(false)
  }, [toast])

  useEffect(() => {
    if (params.id) {
      loadAnalysis(params.id as string)
    }
  }, [params.id, loadAnalysis])

  const handleDelete = async () => {
    if (!analysis) return

    setIsDeleting(true)
    const result = await analysisHistoryService.deleteAnalysis(analysis.id)
    
    if (result.success) {
      toast({
        title: 'Deleted',
        description: 'Analysis deleted successfully',
      })
      router.push('/history')
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to delete analysis',
        variant: 'destructive',
      })
    }
    setIsDeleting(false)
  }

  const handleGeneratePdf = async () => {
    if (!analysis) return

    setIsGeneratingPdf(true)
    try {
      // Use the existing PDF generation logic
      const { jsPDF } = await import('jspdf')
      const html2canvas = (await import('html2canvas')).default

      const reportElement = document.getElementById('pdf-report')
      if (!reportElement) {
        throw new Error('Report element not found')
      }

      const canvas = await html2canvas(reportElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      
      const imgWidth = 210
      const pageHeight = 295
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight

      let position = 0

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      pdf.save(`${analysis.ticker}_analysis_${format(new Date(analysis.created_at), 'yyyy-MM-dd')}.pdf`)
      
      toast({
        title: 'PDF Generated',
        description: 'Your analysis report has been downloaded.',
      })
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast({
        title: 'PDF Generation Failed',
        description: 'There was an error generating the PDF. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoaderCircle className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading analysis...</p>
        </div>
      </div>
    )
  }

  if (!analysis) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-12">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Analysis Not Found</h3>
            <p className="text-muted-foreground mb-4">
              The analysis you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to view it.
            </p>
            <Button asChild>
              <Link href="/history">
                Back to History
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const createdAt = new Date(analysis.created_at)

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/history">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to History
            </Link>
          </Button>
          
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="font-mono text-lg px-3 py-1">
                  {analysis.ticker}
                </Badge>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="mr-1 h-3 w-3" />
                  {format(createdAt, 'PPP')}
                </div>
              </div>
              <h1 className="text-3xl font-bold">{analysis.investment_thesis}</h1>
              <p className="text-muted-foreground">{analysis.investment_goal}</p>
            </div>
            
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                onClick={handleGeneratePdf}
                disabled={isGeneratingPdf}
              >
                {isGeneratingPdf ? (
                  <>
                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                  </>
                )}
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        <div id="pdf-report">
          <PdfReport 
            ticker={analysis.ticker}
            analysisResult={analysis.analysis_result}
            submittedTicker={analysis.ticker}
          />
        </div>
      </div>
    </div>
  )
}

export default function AnalysisDetailPage() {
  return (
    <AuthGuard>
      <AnalysisDetailContent />
    </AuthGuard>
  )
}
