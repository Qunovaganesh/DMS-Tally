import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { api } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { formatDateTime } from '@/lib/utils'
import { Monitor, Smartphone, Tablet, X, Shield } from 'lucide-react'

interface Session {
  id: string
  userAgent: string
  ip: string
  createdAt: string
}

export default function SessionsPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: sessions, isLoading } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => api.get<Session[]>('/auth/sessions'),
  })

  const revokeSessionMutation = useMutation({
    mutationFn: (sessionId: string) => api.delete(`/auth/sessions/${sessionId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      toast({
        title: 'Session revoked',
        description: 'The session has been revoked successfully.',
      })
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to revoke session.',
      })
    },
  })

  const getDeviceIcon = (userAgent: string) => {
    if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone')) {
      return <Smartphone className="h-5 w-5" />
    }
    if (userAgent.includes('Tablet') || userAgent.includes('iPad')) {
      return <Tablet className="h-5 w-5" />
    }
    return <Monitor className="h-5 w-5" />
  }

  const getDeviceInfo = (userAgent: string) => {
    if (userAgent.includes('Chrome')) return 'Chrome Browser'
    if (userAgent.includes('Firefox')) return 'Firefox Browser'
    if (userAgent.includes('Safari')) return 'Safari Browser'
    if (userAgent.includes('Edge')) return 'Edge Browser'
    return 'Unknown Browser'
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Active Sessions</h1>
          <p className="text-muted-foreground">Manage your active login sessions</p>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="skeleton w-10 h-10 rounded-full" />
                    <div className="space-y-2">
                      <div className="skeleton h-4 w-32" />
                      <div className="skeleton h-3 w-24" />
                    </div>
                  </div>
                  <div className="skeleton h-8 w-16" />
                </div>
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
        <h1 className="text-3xl font-bold">Active Sessions</h1>
        <p className="text-muted-foreground">
          Manage your active login sessions. You can revoke any session to log out from that device.
        </p>
      </div>

      <div className="space-y-4">
        {sessions?.map((session) => (
          <Card key={session.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-muted rounded-lg">
                    {getDeviceIcon(session.userAgent)}
                  </div>
                  <div>
                    <h3 className="font-medium">{getDeviceInfo(session.userAgent)}</h3>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span>{session.ip}</span>
                      <span>•</span>
                      <span>Active since {formatDateTime(session.createdAt)}</span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => revokeSessionMutation.mutate(session.id)}
                  disabled={revokeSessionMutation.isPending}
                >
                  <X className="h-4 w-4 mr-2" />
                  Revoke
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {sessions?.length === 0 && (
          <Card>
            <CardHeader className="text-center">
              <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <CardTitle>No Active Sessions</CardTitle>
              <CardDescription>
                You don't have any active sessions at the moment.
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </div>
  )
}