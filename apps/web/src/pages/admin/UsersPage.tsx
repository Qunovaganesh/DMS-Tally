import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { formatDateTime } from '@/lib/utils'
import { Search, UserX, RefreshCw, Mail } from 'lucide-react'
import { User } from '@bizzplus/types'

export default function AdminUsersPage() {
  const [search, setSearch] = useState('')
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users', search],
    queryFn: () => api.get<User[]>(`/admin/users?search=${search}`),
  })

  const disableUserMutation = useMutation({
    mutationFn: (userId: string) => api.post(`/admin/users/${userId}/disable`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      toast({
        title: 'User disabled',
        description: 'The user has been disabled successfully.',
      })
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to disable user.',
      })
    },
  })

  const forceResetMutation = useMutation({
    mutationFn: (userId: string) => api.post(`/admin/users/${userId}/force-reset`),
    onSuccess: () => {
      toast({
        title: 'Password reset sent',
        description: 'A password reset link has been sent to the user.',
      })
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to send password reset.',
      })
    },
  })

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800'
      case 'manufacturer': return 'bg-blue-100 text-blue-800'
      case 'distributor': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'pending_reset': return 'bg-yellow-100 text-yellow-800'
      case 'disabled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">User Management</h1>
        <p className="text-muted-foreground">Manage system users and their access</p>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Users List */}
      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="skeleton h-20 w-full" />
              </CardContent>
            </Card>
          ))
        ) : users?.length ? (
          users.map((user) => (
            <Card key={user.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium">
                        {user.email.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold">{user.email}</h3>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <span>{user.phone}</span>
                        {user.lastLoginAt && (
                          <>
                            <span>•</span>
                            <span>Last login: {formatDateTime(user.lastLoginAt)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                      {user.role}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                      {user.status}
                    </span>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => forceResetMutation.mutate(user.id)}
                        disabled={forceResetMutation.isPending}
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        Reset
                      </Button>
                      {user.status !== 'disabled' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => disableUserMutation.mutate(user.id)}
                          disabled={disableUserMutation.isPending}
                        >
                          <UserX className="h-4 w-4 mr-2" />
                          Disable
                        </Button>
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
              <CardTitle>No Users Found</CardTitle>
              <CardDescription>
                {search ? 'No users match your search.' : 'No users in the system.'}
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </div>
  )
}