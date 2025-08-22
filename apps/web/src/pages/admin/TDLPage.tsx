import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { formatDateTime } from '@/lib/utils'
import { Webhook, RefreshCw, Key, Activity, AlertCircle } from 'lucide-react'

interface TDLStats {
  activeWebhooks: number
  totalIngestions: number
  lastIngestionAt: string
  webhooks: Array<{
    id: string
    kind: string
    isActive: boolean
    createdAt: string
    lastUsedAt?: string
  }>
  recentIngestions: Array<{
    id: string
    kind: string
    status: 'success' | 'error'
    createdAt: string
    errorMessage?: string
  }>
}

export default function AdminTDLPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: stats, isLoading, refetch } = useQuery({
    queryKey: ['admin-tdl'],
    queryFn: () => api.get<TDLStats>('/admin/tdl'),
  })

  const rotateSecretMutation = useMutation({
    mutationFn: (webhookId: string) => api.post(`/admin/webhooks/${webhookId}/rotate-secret`),
    onSuccess: () => {
      toast({
        title: 'Secret rotated',
        description: 'Webhook secret has been rotated successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['admin-tdl'] })
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to rotate secret.',
      })
    },
  })

  const toggleWebhookMutation = useMutation({
    mutationFn: ({ webhookId, isActive }: { webhookId: string; isActive: boolean }) => 
      api.post(`/admin/webhooks/${webhookId}/toggle`, { isActive }),
    onSuccess: () => {
      toast({
        title: 'Webhook updated',
        description: 'Webhook status has been updated successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['admin-tdl'] })
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update webhook.',
      })
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">TDL Management</h1>
          <p className="text-muted-foreground">Manage Third-party Data Layer webhooks</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="skeleton h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">TDL Management</h1>
        <p className="text-muted-foreground">Manage Third-party Data Layer webhooks and ingestion</p>
      </div>

      {/* TDL Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Webhooks</CardTitle>
            <Webhook className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeWebhooks || 0}</div>
            <p className="text-xs text-muted-foreground">
              Currently enabled
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Ingestions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalIngestions || 0}</div>
            <p className="text-xs text-muted-foreground">
              All time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Ingestion</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.lastIngestionAt ? '✓' : '—'}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.lastIngestionAt ? formatDateTime(stats.lastIngestionAt) : 'Never'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Webhooks Management */}
      <Card>
        <CardHeader>
          <CardTitle>Webhook Endpoints</CardTitle>
          <CardDescription>Manage TDL webhook configurations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats?.webhooks?.map((webhook) => (
              <div key={webhook.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Webhook className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <h4 className="font-medium">{webhook.kind}</h4>
                    <p className="text-sm text-muted-foreground">
                      Created: {formatDateTime(webhook.createdAt)}
                      {webhook.lastUsedAt && (
                        <> • Last used: {formatDateTime(webhook.lastUsedAt)}</>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    webhook.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {webhook.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => rotateSecretMutation.mutate(webhook.id)}
                    disabled={rotateSecretMutation.isPending}
                  >
                    <Key className="h-4 w-4 mr-2" />
                    Rotate Secret
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleWebhookMutation.mutate({ 
                      webhookId: webhook.id, 
                      isActive: !webhook.isActive 
                    })}
                    disabled={toggleWebhookMutation.isPending}
                  >
                    {webhook.isActive ? 'Disable' : 'Enable'}
                  </Button>
                </div>
              </div>
            ))}
            
            {(!stats?.webhooks || stats.webhooks.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                <Webhook className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No webhooks configured</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Ingestions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Ingestions</CardTitle>
          <CardDescription>Latest data ingestion events from TDL</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats?.recentIngestions?.map((ingestion) => (
              <div key={ingestion.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Activity className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <h4 className="font-medium">{ingestion.kind}</h4>
                    <p className="text-sm text-muted-foreground">
                      {formatDateTime(ingestion.createdAt)}
                    </p>
                    {ingestion.errorMessage && (
                      <p className="text-sm text-red-600">{ingestion.errorMessage}</p>
                    )}
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  ingestion.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {ingestion.status}
                </span>
              </div>
            ))}
            
            {(!stats?.recentIngestions || stats.recentIngestions.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No recent ingestions</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}