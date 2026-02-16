'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import AdminLayout from '@/components/admin/AdminLayout';
import { cn } from '@/lib/utils';

interface Session {
  id: string;
  visitorId: string;
  entryTime: string;
  exitTime: string | null;
  timeSpent: number | null;
  customerName: string | null;
  customerPhone: string | null;
  customerAddress: string | null;
  cartItems: string;
  subtotal: number;
  appliedCoupons: string | null;
  discountAmount: number;
  orderCompleted: boolean;
  visitor: {
    visitorId: string;
    name: string | null;
    phone: string | null;
  };
}

export default function TrackingPage() {
  const { toast } = useToast();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'active' | 'completed' | 'abandoned'>('active');

  const fetchSessions = useCallback(async () => {
    try {
      const response = await fetch('/api/tracking');
      if (!response.ok) throw new Error('Failed to fetch sessions');
      const data = await response.json();
      // API returns { sessions, visitors } object
      const sessionsArray = Array.isArray(data) ? data : (Array.isArray(data.sessions) ? data.sessions : []);
      setSessions(sessionsArray);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast({ title: 'Error', description: 'Failed to load tracking data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const activeSessions = sessions.filter(s => !s.exitTime && !s.orderCompleted);
  const completedSessions = sessions.filter(s => s.orderCompleted);
  const abandonedSessions = sessions.filter(s => s.exitTime && !s.orderCompleted);

  const displaySessions = filter === 'active' ? activeSessions : filter === 'completed' ? completedSessions : abandonedSessions;

  const formatTime = (seconds: number | null) => {
    if (!seconds) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatCartItems = (cartItemsStr: string) => {
    try {
      const items = JSON.parse(cartItemsStr);
      return items.map((i: { name: string; quantity: number }) => `${i.name} (${i.quantity})`).join(', ');
    } catch {
      return '-';
    }
  };

  const content = (
    <>
      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setFilter('active')}
          className={cn(
            "px-4 py-2 rounded-lg font-medium transition border-2",
            filter === 'active'
              ? 'bg-blue-500 text-white border-blue-500'
              : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
          )}
        >
          Active ({activeSessions.length})
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={cn(
            "px-4 py-2 rounded-lg font-medium transition border-2",
            filter === 'completed'
              ? 'bg-green-500 text-white border-green-500'
              : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
          )}
        >
          Completed ({completedSessions.length})
        </button>
        <button
          onClick={() => setFilter('abandoned')}
          className={cn(
            "px-4 py-2 rounded-lg font-medium transition border-2",
            filter === 'abandoned'
              ? 'bg-red-500 text-white border-red-500'
              : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
          )}
        >
          Abandoned ({abandonedSessions.length})
        </button>
      </div>

      {/* Sessions */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
        </div>
      ) : displaySessions.length === 0 ? (
        <div className="bg-white rounded-lg p-8 text-center">
          <i className="ri-user-search-line text-4xl text-gray-300 mb-2 block" />
          <p className="text-gray-500">No {filter} sessions</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displaySessions.map((session) => (
            <div key={session.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="px-4 py-2 bg-gray-50 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm text-gray-600">{session.visitor.visitorId.slice(0, 8)}...</span>
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded",
                    session.orderCompleted ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  )}>
                    {session.orderCompleted ? 'Order Placed' : 'Browsing'}
                  </span>
                </div>
                <span className="text-sm text-gray-500">
                  {formatTime(session.timeSpent)}
                </span>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Customer</p>
                    <p className="font-medium">{session.customerName || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Phone</p>
                    <p className="font-medium">{session.customerPhone || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Cart Items</p>
                    <p className="font-medium truncate">{formatCartItems(session.cartItems)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Subtotal</p>
                    <p className="font-medium text-green-600">৳{session.subtotal.toFixed(0)}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );

  return (
    <AdminLayout title="Tracking" subtitle="Track visitor sessions">
      {content}
    </AdminLayout>
  );
}
