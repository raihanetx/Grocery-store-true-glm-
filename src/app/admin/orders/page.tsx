'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import AdminLayout from '@/components/admin/AdminLayout';
import { cn } from '@/lib/utils';

interface OrderItem {
  id: string;
  productName: string;
  varietyName: string | null;
  price: number;
  quantity: number;
  total: number;
}

interface Order {
  id: string;
  invoice: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  subtotal: number;
  discount: number;
  deliveryCharge: number;
  total: number;
  status: string;
  courierStatus: string | null;
  trackingCode: string | null;
  trackingMessage: string | null;
  createdAt: string;
  items: OrderItem[];
}

export default function AdminOrdersPage() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'cancelled'>('pending');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      const response = await fetch('/api/orders');
      if (!response.ok) throw new Error('Failed to fetch orders');
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({ title: 'Error', description: 'Failed to load orders', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const approveOrder = async (order: Order) => {
    setActionLoading(order.id);
    try {
      const updateRes = await fetch(`/api/orders/${order.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' }),
      });
      
      if (!updateRes.ok) throw new Error('Failed to approve');
      
      const courierRes = await fetch(`/api/orders/${order.id}/send-to-courier`, {
        method: 'POST',
      });
      
      const courierData = await courierRes.json();
      
      if (!courierRes.ok) {
        throw new Error(courierData.error || 'Failed to send to courier');
      }
      
      toast({
        title: '✅ Order Approved & Sent to Courier!',
        description: `Tracking: ${courierData.consignment?.tracking_code}`,
      });
      
      fetchOrders();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to approve order',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const cancelOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    
    setActionLoading(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      });
      
      if (!res.ok) throw new Error('Failed to cancel');
      
      toast({ title: '❌ Order Cancelled' });
      fetchOrders();
    } catch (error) {
      toast({ title: 'Error cancelling order', variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  const refreshStatus = async (orderId: string) => {
    setActionLoading(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}/track`);
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);
      
      toast({
        title: 'Status Updated',
        description: `Status: ${data.deliveryStatus}`,
      });
      
      fetchOrders();
    } catch (error) {
      toast({ title: 'Error refreshing status', variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  const pendingOrders = orders.filter(o => o.status === 'pending');
  const approvedOrders = orders.filter(o => o.status !== 'pending' && o.status !== 'cancelled');
  const cancelledOrders = orders.filter(o => o.status === 'cancelled');

  const displayOrders = filter === 'pending' ? pendingOrders : filter === 'approved' ? approvedOrders : cancelledOrders;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const content = (
    <>
      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setFilter('pending')}
          className={cn(
            "px-4 py-2 rounded-lg font-medium transition border-2",
            filter === 'pending'
              ? 'bg-yellow-500 text-white border-yellow-500'
              : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
          )}
        >
          Pending ({pendingOrders.length})
        </button>
        <button
          onClick={() => setFilter('approved')}
          className={cn(
            "px-4 py-2 rounded-lg font-medium transition border-2",
            filter === 'approved'
              ? 'bg-green-500 text-white border-green-500'
              : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
          )}
        >
          Approved ({approvedOrders.length})
        </button>
        <button
          onClick={() => setFilter('cancelled')}
          className={cn(
            "px-4 py-2 rounded-lg font-medium transition border-2",
            filter === 'cancelled'
              ? 'bg-red-500 text-white border-red-500'
              : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
          )}
        >
          Cancelled ({cancelledOrders.length})
        </button>
      </div>

      {/* Orders */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto" />
        </div>
      ) : displayOrders.length === 0 ? (
        <div className="bg-white rounded-lg p-8 text-center">
          <i className="ri-inbox-line text-4xl text-gray-300 mb-2 block" />
          <p className="text-gray-500">No {filter} orders</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayOrders.map((order) => {
            const isLoading = actionLoading === order.id;
            
            return (
              <div key={order.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="px-4 py-2 bg-gray-50 border-b flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-green-600">{order.invoice}</span>
                    <span className="text-xs text-gray-500">{formatDate(order.createdAt)}</span>
                  </div>
                  <span className="font-bold text-lg">৳{order.total.toFixed(0)}</span>
                </div>
                
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{order.customerName}</p>
                      <p className="text-sm text-gray-600">{order.customerPhone}</p>
                      <p className="text-xs text-gray-500 mt-1">{order.customerAddress}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {order.items.length} item(s): {order.items.map(i => `${i.productName} ×${i.quantity}`).join(', ')}
                      </p>
                    </div>
                    
                    <div className="text-right">
                      {filter === 'pending' ? (
                        <div className="flex gap-2">
                          <Button
                            className="bg-green-600 text-white hover:bg-green-700"
                            onClick={() => approveOrder(order)}
                            disabled={isLoading}
                          >
                            {isLoading ? 'Processing...' : '✓ Approve'}
                          </Button>
                          <Button
                            className="bg-red-500 text-white hover:bg-red-600"
                            onClick={() => cancelOrder(order.id)}
                            disabled={isLoading}
                          >
                            ✗ Cancel
                          </Button>
                        </div>
                      ) : filter === 'cancelled' ? (
                        <div className="bg-red-100 text-red-700 px-4 py-2 rounded-lg font-medium">
                          ❌ Cancelled
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {order.courierStatus && (
                            <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium inline-block">
                              {order.courierStatus}
                            </div>
                          )}
                          {order.trackingCode && (
                            <p className="text-xs text-gray-600">
                              Tracking: <span className="font-mono font-bold">{order.trackingCode}</span>
                            </p>
                          )}
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="bg-gray-200 text-gray-700 hover:bg-gray-300"
                              onClick={() => refreshStatus(order.id)}
                              disabled={isLoading}
                            >
                              {isLoading ? '...' : '🔄 Refresh'}
                            </Button>
                            <Button
                              size="sm"
                              className="bg-red-500 text-white hover:bg-red-600"
                              onClick={() => cancelOrder(order.id)}
                              disabled={isLoading}
                            >
                              ✗ Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {order.trackingMessage && (
                    <div className="mt-3 pt-3 border-t text-sm text-gray-600">
                      <i className="ri-information-line mr-1" />
                      {order.trackingMessage}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );

  return (
    <AdminLayout title="Orders" subtitle="Manage customer orders">
      {content}
    </AdminLayout>
  );
}
