import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { formatCurrency, calculateLineTotal, calculateGST, debounce } from '@/lib/utils'
import { Search, Plus, Minus, ShoppingCart } from 'lucide-react'
import { Manufacturer, SKU, OrderTotals } from '@bizzplus/types'

interface OrderItem {
  skuId: string
  sku: SKU
  qty: number
  rate: number
  gstPercent: number
  lineTotal: number
  lineGst: number
  lineGrandTotal: number
}

export default function NewOrderPage() {
  const [selectedManufacturer, setSelectedManufacturer] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const navigate = useNavigate()
  const { toast } = useToast()

  // Fetch manufacturers
  const { data: manufacturersData } = useQuery({
    queryKey: ['manufacturers'],
    queryFn: () => api.get<{ data: Manufacturer[], pagination: any }>('/manufacturers'),
  })

  // Fetch SKUs for selected manufacturer
  const { data: skusData, isLoading: skusLoading } = useQuery({
    queryKey: ['manufacturer-skus', selectedManufacturer, searchQuery, currentPage],
    queryFn: () => api.get<{ data: SKU[], pagination: any }>(`/manufacturers/${selectedManufacturer}/skus?page=${currentPage}&limit=20&q=${searchQuery}`),
    enabled: !!selectedManufacturer,
  })

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: (data: { manufacturerId: string, items: { skuId: string, qty: number }[] }) =>
      api.post('/orders', data),
    onSuccess: (data) => {
      toast({
        title: 'Order created successfully',
        description: 'Your order has been created and saved as draft.',
      })
      navigate(`/distributor/order/${data.id}/confirm`)
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Failed to create order',
        description: error.message || 'Something went wrong.',
      })
    },
  })

  // Debounced search
  const debouncedSearch = debounce((query: string) => {
    setSearchQuery(query)
    setCurrentPage(1)
  }, 300)

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(e.target.value)
  }

  const addToOrder = (sku: SKU) => {
    const existingItem = orderItems.find(item => item.skuId === sku.id)
    
    if (existingItem) {
      updateQuantity(sku.id, existingItem.qty + 1)
    } else {
      const newItem: OrderItem = {
        skuId: sku.id,
        sku,
        qty: 1,
        rate: sku.currentPrice || 0,
        gstPercent: sku.gstPercent,
        lineTotal: calculateLineTotal(1, sku.currentPrice || 0),
        lineGst: calculateGST(calculateLineTotal(1, sku.currentPrice || 0), sku.gstPercent),
        lineGrandTotal: 0
      }
      newItem.lineGrandTotal = newItem.lineTotal + newItem.lineGst
      setOrderItems([...orderItems, newItem])
    }
  }

  const updateQuantity = (skuId: string, newQty: number) => {
    if (newQty <= 0) {
      removeFromOrder(skuId)
      return
    }

    setOrderItems(items =>
      items.map(item => {
        if (item.skuId === skuId) {
          const lineTotal = calculateLineTotal(newQty, item.rate)
          const lineGst = calculateGST(lineTotal, item.gstPercent)
          return {
            ...item,
            qty: newQty,
            lineTotal,
            lineGst,
            lineGrandTotal: lineTotal + lineGst
          }
        }
        return item
      })
    )
  }

  const removeFromOrder = (skuId: string) => {
    setOrderItems(items => items.filter(item => item.skuId !== skuId))
  }

  const calculateTotals = (): OrderTotals => {
    const subtotal = orderItems.reduce((sum, item) => sum + item.lineTotal, 0)
    const gstTotal = orderItems.reduce((sum, item) => sum + item.lineGst, 0)
    const grandTotal = subtotal + gstTotal
    return { subtotal, gstTotal, grandTotal }
  }

  const handleCreateOrder = () => {
    if (!selectedManufacturer || orderItems.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Invalid order',
        description: 'Please select a manufacturer and add items to your order.',
      })
      return
    }

    createOrderMutation.mutate({
      manufacturerId: selectedManufacturer,
      items: orderItems.map(item => ({
        skuId: item.skuId,
        qty: item.qty
      }))
    })
  }

  const totals = calculateTotals()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Create New Order</h1>
        <p className="text-muted-foreground">
          Select a manufacturer and add products to your order
        </p>
      </div>

      {/* Manufacturer Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Manufacturer</CardTitle>
          <CardDescription>Choose the manufacturer you want to order from</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {manufacturersData?.data.map((manufacturer) => (
              <Card
                key={manufacturer.id}
                className={`cursor-pointer transition-all ${
                  selectedManufacturer === manufacturer.id
                    ? 'ring-2 ring-primary bg-primary/5'
                    : 'hover:shadow-md'
                }`}
                onClick={() => setSelectedManufacturer(manufacturer.id)}
              >
                <CardContent className="p-4">
                  <h3 className="font-medium">{manufacturer.name}</h3>
                  <p className="text-sm text-muted-foreground">{manufacturer.city}</p>
                  {manufacturer.gstin && (
                    <p className="text-xs text-muted-foreground">GSTIN: {manufacturer.gstin}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* SKU Selection */}
      {selectedManufacturer && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* SKU List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Products</CardTitle>
                <CardDescription>Search and add products to your order</CardDescription>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products..."
                    className="pl-10"
                    onChange={handleSearchChange}
                  />
                </div>
              </CardHeader>
              <CardContent>
                {skusLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-2">
                          <div className="skeleton h-4 w-48" />
                          <div className="skeleton h-3 w-32" />
                        </div>
                        <div className="skeleton h-8 w-20" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {skusData?.data.map((sku) => {
                      const orderItem = orderItems.find(item => item.skuId === sku.id)
                      return (
                        <div key={sku.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-medium">{sku.name}</h4>
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                              <span>SKU: {sku.skuCode}</span>
                              <span>GST: {sku.gstPercent}%</span>
                              <span>UOM: {sku.uom}</span>
                              {sku.currentPrice && (
                                <span className="font-medium text-foreground">
                                  {formatCurrency(sku.currentPrice)}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {orderItem ? (
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateQuantity(sku.id, orderItem.qty - 1)}
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                                <span className="w-12 text-center">{orderItem.qty}</span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateQuantity(sku.id, orderItem.qty + 1)}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => addToOrder(sku)}
                                disabled={!sku.currentPrice}
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Add
                              </Button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Pagination */}
                {skusData?.pagination && skusData.pagination.totalPages > 1 && (
                  <div className="flex justify-center space-x-2 mt-6">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="flex items-center px-4 text-sm">
                      Page {currentPage} of {skusData.pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => p + 1)}
                      disabled={currentPage === skusData.pagination.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div>
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
                <CardDescription>{orderItems.length} items</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orderItems.map((item) => (
                    <div key={item.skuId} className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.sku.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.qty} × {formatCurrency(item.rate)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-sm">
                          {formatCurrency(item.lineGrandTotal)}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromOrder(item.skuId)}
                          className="h-auto p-0 text-xs text-destructive hover:text-destructive"
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}

                  {orderItems.length === 0 && (
                    <div className="text-center py-8">
                      <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No items in order</p>
                    </div>
                  )}
                </div>

                {orderItems.length > 0 && (
                  <>
                    <div className="border-t pt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal:</span>
                        <span>{formatCurrency(totals.subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>GST:</span>
                        <span>{formatCurrency(totals.gstTotal)}</span>
                      </div>
                      <div className="flex justify-between font-medium">
                        <span>Total:</span>
                        <span>{formatCurrency(totals.grandTotal)}</span>
                      </div>
                    </div>

                    <Button
                      className="w-full"
                      onClick={handleCreateOrder}
                      disabled={createOrderMutation.isPending}
                    >
                      {createOrderMutation.isPending ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Creating...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <ShoppingCart className="h-4 w-4" />
                          <span>Create Order</span>
                        </div>
                      )}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}