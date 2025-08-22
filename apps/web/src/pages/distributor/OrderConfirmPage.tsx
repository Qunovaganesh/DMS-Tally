import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { formatCurrency, formatDateTime, getStatusColor } from '@/lib/utils'
import { ArrowLeft, Check, Package, Building, Calendar } from 'lucide-react'
import { Order } from '@bizzplus/types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export default function OrderConfirmPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => api.get<Order>(`/orders/${id}`),
    enabled: !!id,
  })

  const placeOrderMutation = useMutation({
    mutationFn: () => api.post(`/orders/${id}/place`),
    onSuccess: () => {
      toast({
        title: 'Order placed successfully',
        description: 'Your order has been submitted to the manufacturer.',
      })
      setShowConfirmDialog(false)
      navigate('/distributor')
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Failed to place order',
        description: error.message || 'Something went wrong.',
      })
    },
  })

  const handlePlaceOrder = () => {
    setShowConfirmDialog(true)
  }

  const confirmPlaceOrder = () => {
    placeOrderMutation.mutate()
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <div className="skeleton h-8 w-8" />
          <div className="skeleton h-8 w-48" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                <div className="skeleton h-64 w-full" />
              </CardContent>
            </Card>
          </div>
          <div>
            <Card>
              <CardContent className="p-6">
                <div className="skeleton h-48 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Order not found</h2>
        <p className="text-muted-foreground mb-4">The order you're looking for doesn't exist.</p>
        <Button onClick={() => navigate('/distributor')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/distributor')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Order Confirmation</h1>
            <p className="text-muted-foreground">
              Review your order details before placing
            </p>
          </div>
        </div>
        {order.status === 'draft' && (
          <Button onClick={handlePlaceOrder} disabled={placeOrderMutation.isPending}>
            <Check className="h-4 w-4 mr-2" />
            Place Order
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Order #{order.number}</CardTitle>
                  <CardDescription>
                    Created on {formatDateTime(order.createdAt)}
                  </CardDescription>
                </div>
                <span className={`status-badge ${getStatusColor(order.status)}`}>
                  {order.status}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start space-x-3">
                  <Building className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <h4 className="font-medium">Manufacturer</h4>
                    <p className="text-sm text-muted-foreground">{order.manufacturer?.name}</p>
                    {order.manufacturer?.city && (
                      <p className="text-xs text-muted-foreground">{order.manufacturer.city}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <h4 className="font-medium">Order Date</h4>
                    <p className="text-sm text-muted-foreground">
                      {formatDateTime(order.createdAt)}
                    </p>
                    {order.placedAt && (
                      <p className="text-xs text-muted-foreground">
                        Placed: {formatDateTime(order.placedAt)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
              <CardDescription>{order.items?.length} items</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items?.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{item.sku?.name}</h4>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>SKU: {item.sku?.skuCode}</span>
                        <span>Qty: {item.qty} {item.sku?.uom}</span>
                        <span>Rate: {formatCurrency(item.rate)}</span>
                        <span>GST: {item.gstPercent}%</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(item.lineGrandTotal)}</p>
                      <p className="text-xs text-muted-foreground">
                        (incl. {formatCurrency(item.lineGst)} GST)
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <div>
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(order.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>GST Total:</span>
                    <span>{formatCurrency(order.gstTotal)}</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between font-medium text-lg">
                      <span>Grand Total:</span>
                      <span>{formatCurrency(order.grandTotal)}</span>
                    </div>
                  </div>
                </div>

                {order.status === 'draft' && (
                  <Button 
                    className="w-full" 
                    onClick={handlePlaceOrder}
                    disabled={placeOrderMutation.isPending}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Place Order
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Order Placement</DialogTitle>
            <DialogDescription>
              Are you sure you want to place this order? Once placed, you cannot modify the order details.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Amount:</span>
                <span className="text-lg font-bold">{formatCurrency(order.grandTotal)}</span>
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {order.items?.length} items to {order.manufacturer?.name}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmPlaceOrder} disabled={placeOrderMutation.isPending}>
              {placeOrderMutation.isPending ? 'Placing...' : 'Yes, Place Order'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}