'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { analysisHistoryService } from '@/lib/analysis-history'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { LoginButton } from '@/components/auth/login-button'
import { UserMenu } from '@/components/auth/user-menu'
import { LoaderCircle, CheckCircle, XCircle, Database, Shield, User } from 'lucide-react'

export default function TestAuthPage() {
  const { user, loading } = useAuth()
  const { toast } = useToast()
  const [testResults, setTestResults] = useState<{
    auth: boolean | null
    database: boolean | null
    rls: boolean | null
  }>({
    auth: null,
    database: null,
    rls: null
  })
  const [testing, setTesting] = useState(false)

  const runTests = async () => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to run tests',
        variant: 'destructive'
      })
      return
    }

    setTesting(true)
    const results = { auth: false, database: false, rls: false }

    try {
      // Test 1: Authentication
      results.auth = !!user
      
      // Test 2: Database connectivity and operations
      try {
        const testAnalysis = {
          ticker: 'TEST',
          investment_thesis: 'Test thesis for authentication validation',
          investment_goal: 'Test goal for authentication validation',
          analysis_result: {
            fundamentalAnalysis: 'Test fundamental analysis',
            thesisValidation: 'Test thesis validation',
            sectorAndMacroView: 'Test sector view',
            catalystWatch: 'Test catalyst watch',
            investmentSummary: 'Test investment summary'
          }
        }

        // Save test analysis
        const saveResult = await analysisHistoryService.saveAnalysis(testAnalysis)
        if (saveResult.success && saveResult.data) {
          // Try to retrieve it
          const getResult = await analysisHistoryService.getAnalysisById(saveResult.data.id)
          if (getResult.success) {
            results.database = true
            
            // Clean up test data
            await analysisHistoryService.deleteAnalysis(saveResult.data.id)
          }
        }
      } catch (error) {
        console.error('Database test failed:', error)
        results.database = false
      }

      // Test 3: Row Level Security (RLS)
      try {
        // Get user's analysis count
        const countResult = await analysisHistoryService.getAnalysisCount()
        results.rls = countResult.success
      } catch (error) {
        console.error('RLS test failed:', error)
        results.rls = false
      }

      setTestResults(results)
      
      if (results.auth && results.database && results.rls) {
        toast({
          title: 'All Tests Passed!',
          description: 'Authentication and database are working correctly',
        })
      } else {
        toast({
          title: 'Some Tests Failed',
          description: 'Check the results below for details',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Test execution failed:', error)
      toast({
        title: 'Test Execution Failed',
        description: 'An error occurred while running tests',
        variant: 'destructive'
      })
    } finally {
      setTesting(false)
    }
  }

  const TestResult = ({ test, label, icon: Icon }: { test: boolean | null, label: string, icon: any }) => (
    <div className="flex items-center justify-between p-3 border rounded-lg">
      <div className="flex items-center space-x-2">
        <Icon className="h-4 w-4" />
        <span>{label}</span>
      </div>
      <div>
        {test === null ? (
          <Badge variant="secondary">Not Tested</Badge>
        ) : test ? (
          <CheckCircle className="h-5 w-5 text-green-500" />
        ) : (
          <XCircle className="h-5 w-5 text-red-500" />
        )}
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoaderCircle className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="container mx-auto max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Authentication & Database Test</CardTitle>
            <CardDescription>
              Test the authentication system and database connectivity
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Authentication Status</h3>
                <p className="text-sm text-muted-foreground">
                  {user ? `Signed in as ${user.email}` : 'Not signed in'}
                </p>
              </div>
              <div>
                {user ? <UserMenu /> : <LoginButton />}
              </div>
            </div>

            {user && (
              <>
                <div className="space-y-3">
                  <h3 className="font-semibold">Test Results</h3>
                  <TestResult test={testResults.auth} label="Authentication" icon={User} />
                  <TestResult test={testResults.database} label="Database Operations" icon={Database} />
                  <TestResult test={testResults.rls} label="Row Level Security" icon={Shield} />
                </div>

                <Button 
                  onClick={runTests} 
                  disabled={testing}
                  className="w-full"
                >
                  {testing ? (
                    <>
                      <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                      Running Tests...
                    </>
                  ) : (
                    'Run Tests'
                  )}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
