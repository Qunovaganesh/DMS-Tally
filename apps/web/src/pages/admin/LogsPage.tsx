import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api'
import { formatDateTime } from '@/lib/utils'
import { Search, Activity, User, AlertCircle } from 'lucide-react'

interface AuditLog {
  id: string
  actorUserId?: string
  actorUser?: {
    email: string
  }
  event: string
  entity: string
  entityId: string
  diff: any
  createdAt: string
}

export default function AdminLogsPage() {
  const [search, setSearch] = useState('')
  const [entity, setEntity] = useState('')

  const { data: logs, isLoading } = useQuery({
    queryKey: ['admin-logs', search, entity],
    queryFn: () => api.get<AuditLog[]>(`/admin/logs?search=${search}&entity=${entity}`),
  })

  const getEventIcon = (event: string) => {
    if (event.includes('create')) return <User className="h-4 w-4 text-green-500" />
    if (event.includes('update')) return <Activity className="h-4 w-4 text-blue-500" />
    if (event.includes('delete')) return <AlertCircle className="h-4 w-4 text-red-500" />
    return <Activity className="h-4 w-4 text-muted-foreground" />
  }

  const getEventColor = (event: string) => {
    if (event.includes('create')) return 'bg-green-100 text-green-800'
    if (event.includes('update')) return 'bg-blue-100 text-blue-800'
    if (event.includes('delete')) return 'bg-red-100 text-red-800'
    return 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Audit Logs</h1>
        <p className="text-muted-foreground">System activity and change tracking</p>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search logs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={entity}
          onChange={(e) => setEntity(e.target.value)}
          className="px-3 py-2 border rounded-md bg-background"
        >
          <option value="">All Entities</option>
          <option value="user">Users</option>
          <option value="order">Orders</option>
          <option value="sku">SKUs</option>
          <option value="manufacturer">Manufacturers</option>
          <option value="distributor">Distributors</option>
        </select>
      </div>

      {/* Logs List */}
      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 10 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="skeleton h-16 w-full" />
              </CardContent>
            </Card>
          ))
        ) : logs?.length ? (
          logs.map((log) => (
            <Card key={log.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    {getEventIcon(log.event)}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEventColor(log.event)}`}>
                          {log.event}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {log.entity} #{log.entityId}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {log.actorUser?.email || 'System'} • {formatDateTime(log.createdAt)}
                      </p>
                      {log.diff && Object.keys(log.diff).length > 0 && (
                        <details className="text-sm">
                          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                            View changes
                          </summary>
                          <pre className="mt-2 p-3 bg-muted rounded-md text-xs overflow-x-auto">
                            {JSON.stringify(log.diff, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardHeader className="text-center">
              <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <CardTitle>No Logs Found</CardTitle>
              <CardDescription>
                {search || entity ? 'No logs match your filters.' : 'No audit logs available.'}
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </div>
  )
}