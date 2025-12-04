'use client'

import { useEffect, useState } from 'react'
import { testSupabaseConnection, testSupabaseAuth } from '@/lib/supabase/test-connection'
import type { ConnectionTestResult } from '@/lib/supabase/test-connection'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle2, XCircle, Loader2, RefreshCw } from 'lucide-react'

export default function SupabaseTestPage() {
  const [connectionResult, setConnectionResult] = useState<ConnectionTestResult | null>(null)
  const [authResult, setAuthResult] = useState<ConnectionTestResult | null>(null)
  const [loading, setLoading] = useState(false)

  const runTests = async () => {
    setLoading(true)
    setConnectionResult(null)
    setAuthResult(null)

    try {
      const connResult = await testSupabaseConnection()
      setConnectionResult(connResult)

      if (connResult.success) {
        const authRes = await testSupabaseAuth()
        setAuthResult(authRes)
      }
    } catch (error) {
      console.error('Test error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    runTests()
  }, [])

  const StatusIcon = ({ success }: { success: boolean }) => {
    if (loading) return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
    return success ? (
      <CheckCircle2 className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500" />
    )
  }

  return (
    <div className="container mx-auto py-10 max-w-4xl">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Supabase Connection Test</h1>
            <p className="text-muted-foreground mt-2">
              Verify your Supabase configuration and connection
            </p>
          </div>
          <Button onClick={runTests} disabled={loading} variant="outline">
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Re-test
          </Button>
        </div>

        {/* Connection Test */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  Database Connection
                  {connectionResult && <StatusIcon success={connectionResult.success} />}
                </CardTitle>
                <CardDescription>
                  Tests connection to Supabase database
                </CardDescription>
              </div>
              {connectionResult && (
                <Badge variant={connectionResult.success ? 'default' : 'destructive'}>
                  {connectionResult.success ? 'Connected' : 'Failed'}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {connectionResult && (
              <div className="space-y-3">
                <Alert variant={connectionResult.success ? 'default' : 'destructive'}>
                  <AlertDescription>{connectionResult.message}</AlertDescription>
                </Alert>
                {connectionResult.details && (
                  <div className="space-y-2 text-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-muted-foreground">Supabase URL:</span>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {connectionResult.details.url || 'Not set'}
                      </code>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-muted-foreground">Auth Configured:</span>
                      <span>{connectionResult.details.authConfigured ? '✅ Yes' : '❌ No'}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-muted-foreground">Can Connect:</span>
                      <span>{connectionResult.details.canConnect ? '✅ Yes' : '❌ No'}</span>
                    </div>
                    {connectionResult.details.error && (
                      <div className="mt-2">
                        <span className="text-muted-foreground">Error:</span>
                        <pre className="mt-1 text-xs bg-destructive/10 text-destructive p-2 rounded overflow-x-auto">
                          {connectionResult.details.error}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            {!connectionResult && loading && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Testing connection...
              </div>
            )}
          </CardContent>
        </Card>

        {/* Auth Test */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  Authentication System
                  {authResult && <StatusIcon success={authResult.success} />}
                </CardTitle>
                <CardDescription>
                  Tests Supabase Auth configuration
                </CardDescription>
              </div>
              {authResult && (
                <Badge variant={authResult.success ? 'default' : 'destructive'}>
                  {authResult.success ? 'Working' : 'Failed'}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {authResult && (
              <div className="space-y-3">
                <Alert variant={authResult.success ? 'default' : 'destructive'}>
                  <AlertDescription>{authResult.message}</AlertDescription>
                </Alert>
                {authResult.details?.error && (
                  <div className="mt-2">
                    <span className="text-muted-foreground">Error:</span>
                    <pre className="mt-1 text-xs bg-destructive/10 text-destructive p-2 rounded overflow-x-auto">
                      {authResult.details.error}
                    </pre>
                  </div>
                )}
              </div>
            )}
            {!authResult && connectionResult?.success && loading && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Testing auth system...
              </div>
            )}
            {!authResult && !connectionResult?.success && !loading && (
              <div className="text-muted-foreground text-sm">
                Connection test must pass first
              </div>
            )}
          </CardContent>
        </Card>

        {/* Setup Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Setup Instructions</CardTitle>
            <CardDescription>
              If tests are failing, follow these steps
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">1. Create a Supabase Project</h4>
              <p className="text-sm text-muted-foreground">
                Go to{' '}
                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  supabase.com/dashboard
                </a>{' '}
                and create a new project
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">2. Get Your API Keys</h4>
              <p className="text-sm text-muted-foreground">
                In your project settings, go to API section and copy:
              </p>
              <ul className="text-sm text-muted-foreground list-disc list-inside pl-4">
                <li>Project URL</li>
                <li>anon/public key</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">3. Update .env.local</h4>
              <p className="text-sm text-muted-foreground">
                Add your keys to <code className="bg-muted px-1 py-0.5 rounded">.env.local</code>:
              </p>
              <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                {`NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here`}
              </pre>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">4. Restart Dev Server</h4>
              <p className="text-sm text-muted-foreground">
                Stop and restart your dev server to load the new environment variables
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
