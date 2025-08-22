import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { formatCurrency, formatDateTime, getStatusColor } from '@/lib/utils'
import { ArrowLeft, Check, X, Package, Building, Calendar, Truck } from 'lucide-react'
import { Order } from '@bizzplus/types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export default function ManufacturerOrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [showAcceptDialog, setShowAcceptDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [showFulfillDialog, setShowFulfillDialog] = useState(false)

  const { data: order, isLoading } = useQuery({
    queryKey: ['manufacturer-order', id],
    queryFn: () => api.get<Order>(`/m/orders/${id}`),
    enabled: !!id,
  })

  const acceptOrderMutation = useMutation({
    mutationFn: () => api.post(`/m/orders/${id}/accept`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manufacturer-order', id] })
      toast({
        title: 'Order accepted',
        description: 'The order has been accepted successfully.',
      })
      setShowAcceptDialog(false)
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Failed to accept order',
        description: error.message || 'Something went wrong.',
      })
    },
  })

  const rejectOrderMutation = useMutation({
    mutationFn: () => api.post(`/m/orders/${id}/reject`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manufacturer-order', id] })
      toast({
        title: 'Order rejected',
        description: 'The order has been rejected.',
      })
      setShowRejectDialog(false)
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Failed to reject order',
        description: error.message || 'Something went wrong.',
      })
    },
  })

  const fulfillOrderMutation = useMutation({
    mutationFn: () => api.post(`/m/orders/${id}/fulfill`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manufacturer-order', id] })
      toast({
        title: 'Order fulfilled',
        description: 'The order has been marked as fulfilled and vouchers have been created.',
      })
      setShowFulfillDialog(false)
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Failed to fulfill order',
        description: error.message || 'Something went wrong.',
      })
    },
  })

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
        <Button onClick={() => navigate('/manufacturer/orders')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Orders
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
            onClick={() => navigate('/manufacturer/orders')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Order #{order.number}</h1>
            <p className="text-muted-foreground">
              Order details and management
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {order.status === 'placed' && (
            <>
              <Button
                variant="outline"
                onClick={() => setShowRejectDialog(true)}
                disabled={rejectOrderMutation.isPending}
              >
                <X className="h-4 w-4 mr-2" />
                Reject
              </Button>
              <Button
                onClick={() => setShowAcceptDialog(true)}
                disabled={acceptOrderMutation.isPending}
              >
                <Check className="h-4 w-4 mr-2" />
                Accept
              </Button>
            </>
          )}
          {order.status === 'accepted' && (
            <Button
              onClick={() => setShowFulfillDialog(true)}
              disabled={fulfillOrderMutation.isPending}
            >
              <Truck className="h-4 w-4 mr-2" />
              Fulfill
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Order Information</CardTitle>
                  <CardDescription>
                    Placed on {formatDateTime(order.createdAt)}
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
                    <h4 className="font-medium">Distributor</h4>
                    <p className="text-sm text-muted-foreground">{order.distributor?.name}</p>
                    {order.distributor?.city && (
                      <p className="text-xs text-muted-foreground">{order.distributor.city}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <h4 className="font-medium">Timeline</h4>
                    <p className="text-sm text-muted-foreground">
                      Created: {formatDateTime(order.createdAt)}
                    </p>
                    {order.placedAt && (
                      <p className="text-xs text-muted-foreground">
                        Placed: {formatDateTime(order.placedAt)}
                      </p>
                    )}
                    {order.fulfilledAt && (
                      <p className="text-xs text-muted-foreground">
                        Fulfilled: {formatDateTime(order.fulfilledAt)}
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
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Accept Dialog */}
      <Dialog open={showAcceptDialog} onOpenChange={setShowAcceptDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Accept Order</DialogTitle>
            <DialogDescription>
              Are you sure you want to accept this order? This will notify the distributor.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAcceptDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => acceptOrderMutation.mutate()} disabled={acceptOrderMutation.isPending}>
              {acceptOrderMutation.isPending ? 'Accepting...' : 'Accept Order'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Order</DialogTitle>
            <DialogDescription>
              Are you sure you want to reject this order? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => rejectOrderMutation.mutate()} 
              disabled={rejectOrderMutation.isPending}
            >
              {rejectOrderMutation.isPending ? 'Rejecting...' : 'Reject Order'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fulfill Dialog */}
      <Dialog open={showFulfillDialog} onOpenChange={setShowFulfillDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fulfill Order</DialogTitle>
            <DialogDescription>
              Mark this order as fulfilled? This will create vouchers and update inventory.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFulfillDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => fulfillOrderMutation.mutate()} disabled={fulfillOrderMutation.isPending}>
              {fulfillOrderMutation.isPending ? 'Fulfilling...' : 'Fulfill Order'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}