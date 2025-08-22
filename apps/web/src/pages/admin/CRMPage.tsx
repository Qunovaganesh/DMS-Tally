import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { formatDateTime } from '@/lib/utils'
import { RefreshCw, Users, Mail, MessageSquare, AlertCircle } from 'lucide-react'

interface CRMStats {
  totalContacts: number
  lastSyncAt: string
  syncStatus: 'healthy' | 'warning' | 'error'
  pendingProvisions: number
  recentActivity: Array<{
    id: string
    type: 'provision' | 'update' | 'sync'
    description: string
    createdAt: string
    status: 'success' | 'error'
  }>
}

export default function AdminCRMPage() {
  const { toast } = useToast()

  const { data: stats, isLoading, refetch } = useQuery({
    queryKey: ['admin-crm'],
    queryFn: () => api.get<CRMStats>('/admin/crm'),
  })

  const triggerProvisioningMutation = useMutation({
    mutationFn: () => api.post('/admin/trigger-provisioning'),
    onSuccess: () => {
      toast({
        title: 'Provisioning triggered',
        description: 'CRM provisioning job has been queued successfully.',
      })
      refetch()
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to trigger provisioning.',
      })
    },
  })

  const syncCRMMutation = useMutation({
    mutationFn: () => api.post('/admin/crm/sync'),
    onSuccess: () => {
      toast({
        title: 'CRM sync started',
        description: 'CRM synchronization has been initiated.',
      })
      refetch()
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to start CRM sync.',
      })
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">CRM Management</h1>
          <p className="text-muted-foreground">Manage CRM integration and provisioning</p>
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
        <h1 className="text-3xl font-bold">CRM Management</h1>
        <p className="text-muted-foreground">Manage CRM integration and provisioning</p>
      </div>

      {/* CRM Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalContacts || 0}</div>
            <p className="text-xs text-muted-foreground">
              Synced from CRM
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sync Status</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              stats?.syncStatus === 'healthy' ? 'text-green-600' :
              stats?.syncStatus === 'warning' ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {stats?.syncStatus === 'healthy' ? '✓' :
               stats?.syncStatus === 'warning' ? '⚠' : '✗'}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.lastSyncAt ? `Last: ${formatDateTime(stats.lastSyncAt)}` : 'Never synced'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Provisions</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pendingProvisions || 0}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting user creation
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>CRM Actions</CardTitle>
          <CardDescription>Manage CRM synchronization and user provisioning</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => triggerProvisioningMutation.mutate()}
              disabled={triggerProvisioningMutation.isPending}
            >
              <Users className="h-4 w-4 mr-2" />
              {triggerProvisioningMutation.isPending ? 'Triggering...' : 'Trigger Provisioning'}
            </Button>
            <Button
              variant="outline"
              onClick={() => syncCRMMutation.mutate()}
              disabled={syncCRMMutation.isPending}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {syncCRMMutation.isPending ? 'Syncing...' : 'Sync CRM'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest CRM synchronization and provisioning events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats?.recentActivity?.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  {activity.type === 'provision' && <Users className="h-5 w-5 text-blue-500" />}
                  {activity.type === 'update' && <Mail className="h-5 w-5 text-green-500" />}
                  {activity.type === 'sync' && <RefreshCw className="h-5 w-5 text-purple-500" />}
                  <div>
                    <p className="font-medium">{activity.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDateTime(activity.createdAt)}
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  activity.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {activity.status}
                </span>
              </div>
            ))}
            
            {(!stats?.recentActivity || stats.recentActivity.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                <RefreshCw className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No recent activity</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}