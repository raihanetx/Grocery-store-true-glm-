'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useCart } from '@/contexts/cart-context';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { getStatusInfo } from '@/lib/steadfast';

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

const ORDER_STATUS_CONFIG: Record<string, { label: string; color: string; step: number }> = {
  pending: { label: 'Pending', color: 'text-yellow-600', step: 1 },
  approved: { label: 'Approved', color: 'text-blue-600', step: 2 },
  processing: { label: 'Processing', color: 'text-purple-600', step: 3 },
  delivered: { label: 'Delivered', color: 'text-green-600', step: 4 },
  cancelled: { label: 'Cancelled', color: 'text-red-600', step: 0 },
  partial_delivered: { label: 'Partial Delivery', color: 'text-orange-600', step: 4 },
};

export default function OrdersPage() {
  const { orders: localOrders } = useCart();
  const [phone, setPhone] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const { toast } = useToast();

  // Check for phone in localStorage
  useEffect(() => {
    const savedPhone = localStorage.getItem('lumina-last-order-phone');
    if (savedPhone) {
      setPhone(savedPhone);
      searchOrders(savedPhone);
    }
  }, []);

  const searchOrders = async (searchPhone?: string) => {
    const phoneNumber = searchPhone || phone;
    if (!phoneNumber.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter your phone number',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      const response = await fetch(`/api/orders/track?phone=${encodeURIComponent(phoneNumber)}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }

      const data = await response.json();
      setOrders(data);
      
      // Save phone for next time
      localStorage.setItem('lumina-last-order-phone', phoneNumber);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch your orders',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const config = ORDER_STATUS_CONFIG[status] || { label: status, color: 'text-gray-600', step: 0 };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium bg-gray-100 ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getCourierStatusBadge = (courierStatus: string | null) => {
    const statusInfo = getStatusInfo(courierStatus);
    const colorMap: Record<string, string> = {
      green: 'bg-green-100 text-green-700',
      blue: 'bg-blue-100 text-blue-700',
      yellow: 'bg-yellow-100 text-yellow-700',
      red: 'bg-red-100 text-red-700',
      orange: 'bg-orange-100 text-orange-700',
      gray: 'bg-gray-100 text-gray-700',
      purple: 'bg-purple-100 text-purple-700',
    };
    const colorClass = colorMap[statusInfo.color] || colorMap.gray;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
        {statusInfo.label}
      </span>
    );
  };

  // If no search has been done yet and no local orders
  if (!searched && localOrders.length === 0) {
    return (
      <section className="min-h-[calc(100vh-150px)] flex items-center justify-center bg-gray-100 px-6 pb-6 text-center">
        <div className="w-full max-w-md">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400 border">
            <i className="ri-shopping-bag-3-line h-10 w-10" />
          </div>
          <h1 className="text-xl font-bold mb-2">Track Your Orders</h1>
          <p className="text-gray-500 mb-6">Enter your phone number to view your orders</p>
          
          <div className="flex gap-2">
            <Input
              type="tel"
              placeholder="Enter phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="flex-1"
            />
            <Button onClick={() => searchOrders()} disabled={loading} className="bg-green-600 hover:bg-green-700">
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-gray-100 px-4 py-6 pb-20">
      {/* Search Bar */}
      <div className="max-w-md mx-auto mb-6">
        <div className="flex gap-2">
          <Input
            type="tel"
            placeholder="Enter phone number to track orders"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="flex-1"
          />
          <Button onClick={() => searchOrders()} disabled={loading} className="bg-green-600 hover:bg-green-700">
            {loading ? '...' : 'Search'}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <i className="ri-loader-4-line text-4xl text-green-600 animate-spin" />
          <p className="mt-4 text-gray-500">Loading your orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 max-w-md mx-auto">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400 border">
            <i className="ri-inbox-line h-10 w-10" />
          </div>
          <h2 className="text-xl font-bold mb-2">No Orders Found</h2>
          <p className="text-gray-500 mb-6">No orders found for this phone number.</p>
          <Button asChild className="bg-green-600 hover:bg-green-700">
            <Link href="/">Start Shopping</Link>
          </Button>
        </div>
      ) : (
        <div className="max-w-md mx-auto space-y-4">
          <h2 className="text-lg font-bold text-gray-800">Your Orders</h2>
          
          {orders.map((order) => (
            <Card key={order.id} className="overflow-hidden">
              <CardContent className="p-0">
                {/* Order Header */}
                <div className="bg-white p-4 border-b">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-mono text-sm font-medium text-green-600">{order.invoice}</p>
                      <p className="text-xs text-gray-500 mt-1">{formatDate(order.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">৳{order.total.toFixed(0)}</div>
                      {getStatusBadge(order.status)}
                    </div>
                  </div>
                  
                  {/* Tracking Code */}
                  {order.trackingCode && (
                    <div className="mt-3 p-2 bg-blue-50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600">Tracking Code:</span>
                        <span className="font-mono font-bold text-blue-700">{order.trackingCode}</span>
                      </div>
                      {order.courierStatus && (
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-xs text-gray-600">Courier:</span>
                          {getCourierStatusBadge(order.courierStatus)}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Order Items */}
                <div className="bg-gray-50 p-4">
                  <p className="text-xs font-medium text-gray-500 mb-2">ITEMS</p>
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0">
                      <div>
                        <span className="text-sm font-medium">{item.productName}</span>
                        {item.varietyName && (
                          <span className="text-xs text-gray-500 ml-1">({item.varietyName})</span>
                        )}
                        <span className="text-xs text-gray-500 ml-2">x{item.quantity}</span>
                      </div>
                      <span className="text-sm font-medium">৳{item.total.toFixed(0)}</span>
                    </div>
                  ))}
                </div>

                {/* Order Status Progress */}
                <div className="bg-white p-4">
                  <div className="relative flex items-center justify-between z-0">
                    <div className="absolute top-1/2 left-0 w-full h-[2px] bg-gray-200 -z-10 rounded-full"></div>
                    <div 
                      className="absolute top-1/2 left-0 h-[2px] bg-green-600 -z-10 rounded-full transition-all"
                      style={{ width: `${(ORDER_STATUS_CONFIG[order.status]?.step || 0) * 33.33}%` }}
                    ></div>
                    {['pending', 'approved', 'processing', 'delivered'].map((s, i) => {
                      const step = ORDER_STATUS_CONFIG[s]?.step || 0;
                      const currentStep = ORDER_STATUS_CONFIG[order.status]?.step || 0;
                      const isActive = step <= currentStep;
                      const isCurrent = s === order.status;
                      return (
                        <div key={s} className="bg-white px-1">
                          <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-green-600' : 'bg-gray-200'} ${isCurrent ? 'ring-2 ring-green-600/30' : ''}`}></div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between text-[9px] font-bold mt-2 uppercase text-gray-400">
                    <span className={order.status === 'pending' ? 'text-green-600' : ''}>Pending</span>
                    <span className={order.status === 'approved' ? 'text-green-600' : ''}>Approved</span>
                    <span className={order.status === 'processing' ? 'text-green-600' : ''}>Processing</span>
                    <span className={order.status === 'delivered' ? 'text-green-600' : ''}>Delivered</span>
                  </div>
                </div>

                {/* Latest Update */}
                {order.trackingMessage && (
                  <div className="bg-yellow-50 p-3 border-t">
                    <p className="text-xs text-gray-600">
                      <i className="ri-information-line mr-1" />
                      {order.trackingMessage}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
