import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api'
import { formatCurrency, formatDateTime, getStatusColor } from '@/lib/utils'
import { Search, Package, Eye } from 'lucide-react'
import { Order } from '@bizzplus/types'

export default function ManufacturerOrdersPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<string>('')

  const { data: orders, isLoading } = useQuery({
    queryKey: ['manufacturer-orders', search, status],
    queryFn: () => api.get<Order[]>(`/m/orders?search=${search}&status=${status}`),
  })

  const filteredOrders = orders?.filter(order => 
    order.number.toLowerCase().includes(search.toLowerCase()) ||
    order.distributor?.name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Orders</h1>
        <p className="text-muted-foreground">Manage orders from distributors</p>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search orders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-3 py-2 border rounded-md bg-background"
        >
          <option value="">All Status</option>
          <option value="placed">Placed</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
          <option value="fulfilled">Fulfilled</option>
        </select>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="skeleton h-20 w-full" />
              </CardContent>
            </Card>
          ))
        ) : filteredOrders?.length ? (
          filteredOrders.map((order) => (
            <Card key={order.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Package className="h-10 w-10 text-muted-foreground" />
                    <div>
                      <h3 className="font-semibold">Order #{order.number}</h3>
                      <p className="text-sm text-muted-foreground">
                        {order.distributor?.name} • {formatDateTime(order.createdAt)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {order.items?.length} items • {formatCurrency(order.grandTotal)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`status-badge ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                    <Button asChild variant="outline" size="sm">
                      <Link to={`/manufacturer/orders/${order.id}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardHeader className="text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <CardTitle>No Orders Found</CardTitle>
              <CardDescription>
                {search || status ? 'No orders match your filters.' : 'No orders have been placed yet.'}
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </div>
  )
}