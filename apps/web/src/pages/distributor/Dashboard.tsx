import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { formatCurrency, formatNumber, getStatusColor } from '@/lib/utils'
import { Link } from 'react-router-dom'
import { 
  Package, 
  AlertTriangle, 
  ShoppingCart, 
  TrendingUp,
  Plus,
  Eye
} from 'lucide-react'

interface DistributorDashboard {
  kpis: {
    onHandSkus: number
    lowStock: number
    openPos: number
    recentSales: number
  }
  alerts: {
    negativeStock: any[]
    pendingReceipts: any[]
  }
  recentVouchers: any[]
}

export default function DistributorDashboard() {
  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['distributor-dashboard'],
    queryFn: () => api.get<DistributorDashboard>('/d/dashboard'),
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="skeleton h-8 w-48 mb-2" />
            <div className="skeleton h-4 w-64" />
          </div>
          <div className="skeleton h-10 w-32" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="skeleton h-4 w-24 mb-2" />
                <div className="skeleton h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Distributor Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor your inventory, orders, and sales performance
          </p>
        </div>
        <Link to="/distributor/order/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Order
          </Button>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SKUs On Hand</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(dashboard?.kpis.onHandSkus || 0)}</div>
            <p className="text-xs text-muted-foreground">
              Products in inventory
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {formatNumber(dashboard?.kpis.lowStock || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Need attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open POs</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(dashboard?.kpis.openPos || 0)}</div>
            <p className="text-xs text-muted-foreground">
              Pending orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Sales</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatNumber(dashboard?.kpis.recentSales || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Today's transactions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Section */}
      {(dashboard?.alerts.negativeStock.length || dashboard?.alerts.pendingReceipts.length) ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Negative Stock Alert */}
          {dashboard?.alerts.negativeStock.length > 0 && (
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-red-600 flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Negative Stock Alert
                </CardTitle>
                <CardDescription>
                  Items with negative inventory levels
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {dashboard.alerts.negativeStock.slice(0, 5).map((item: any) => (
                    <div key={item.id} className="flex justify-between items-center p-2 bg-red-50 rounded">
                      <span className="text-sm font-medium">{item.sku?.name}</span>
                      <span className="text-sm text-red-600">{item.onHand}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pending Receipts */}
          {dashboard?.alerts.pendingReceipts.length > 0 && (
            <Card className="border-yellow-200">
              <CardHeader>
                <CardTitle className="text-yellow-600 flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Pending Receipts
                </CardTitle>
                <CardDescription>
                  Receipts waiting to be processed
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {dashboard.alerts.pendingReceipts.slice(0, 5).map((receipt: any) => (
                    <div key={receipt.id} className="flex justify-between items-center p-2 bg-yellow-50 rounded">
                      <span className="text-sm font-medium">{receipt.type}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(receipt.status)}`}>
                        {receipt.status}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : null}

      {/* Recent Vouchers */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Vouchers</CardTitle>
          <CardDescription>
            Latest voucher transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {dashboard?.recentVouchers.length > 0 ? (
            <div className="space-y-4">
              {dashboard.recentVouchers.slice(0, 10).map((voucher: any) => (
                <div key={voucher.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-muted rounded">
                      <Package className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium capitalize">{voucher.type}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(voucher.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(voucher.status)}`}>
                      {voucher.status}
                    </span>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No recent vouchers</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}