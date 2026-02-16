'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import AdminLayout from '@/components/admin/AdminLayout';

interface Stats {
  total: number;
  unique: number;
  repeat: number;
  today: number;
  week: number;
  month: number;
}

interface ProductStat {
  id: string | null;
  name: string;
  image: string | null;
  views?: number;
  count?: number;
  quantity?: number;
  orders?: number;
}

interface AnalyticsData {
  stats: Stats;
  mostViewed: ProductStat[];
  mostCartAdded: ProductStat[];
  mostCheckout: ProductStat[];
}

export default function AnalyticsPage() {
  const { toast } = useToast();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch('/api/analytics');
      if (!response.ok) throw new Error('Failed to fetch analytics');
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({ title: 'Error', description: 'Failed to load analytics', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const content = loading ? (
    <div className="flex justify-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" />
    </div>
  ) : (
    <>
      {/* Top Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white text-center">
          <i className="ri-group-line text-3xl mb-2 block" />
          <p className="text-3xl font-bold">{data?.stats.total || 0}</p>
          <p className="text-sm opacity-90 mt-1">Total Visitors</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white text-center">
          <i className="ri-user-add-line text-3xl mb-2 block" />
          <p className="text-3xl font-bold">{data?.stats.unique || 0}</p>
          <p className="text-sm opacity-90 mt-1">Unique Visitors</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white text-center">
          <i className="ri-user-heart-line text-3xl mb-2 block" />
          <p className="text-3xl font-bold">{data?.stats.repeat || 0}</p>
          <p className="text-sm opacity-90 mt-1">Repeat Visitors</p>
        </div>
      </div>

      {/* Visitor Timeline */}
      <div className="bg-white rounded-xl p-6 mb-6">
        <h2 className="font-semibold mb-4 text-gray-700 flex items-center gap-2">
          <i className="ri-calendar-line" />
          Visitor Timeline
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{data?.stats.today || 0}</p>
            <p className="text-sm text-gray-500 mt-1">Today</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">{data?.stats.week || 0}</p>
            <p className="text-sm text-gray-500 mt-1">This Week</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-2xl font-bold text-purple-600">{data?.stats.month || 0}</p>
            <p className="text-sm text-gray-500 mt-1">This Month</p>
          </div>
        </div>
      </div>

      {/* Three Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Most Viewed */}
        <div className="bg-white rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b bg-gray-50">
            <h2 className="font-semibold text-gray-700 flex items-center gap-2">
              <i className="ri-eye-line" />
              Most Viewed
            </h2>
          </div>
          {(!data?.mostViewed || data.mostViewed.length === 0) ? (
            <div className="p-6 text-center text-gray-500">
              <i className="ri-eye-off-line text-3xl mb-2 block" />
              <p className="text-sm">No views yet</p>
            </div>
          ) : (
            <div className="divide-y max-h-80 overflow-y-auto">
              {data.mostViewed.map((product, index) => (
                <div key={product.id || index} className="px-4 py-3 flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-500 text-sm flex items-center justify-center font-medium flex-shrink-0">
                    {index + 1}
                  </span>
                  <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 relative">
                    {product.image ? (
                      <Image src={product.image} alt={product.name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <i className="ri-image-line text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{product.name}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-green-600">{product.views}</p>
                    <p className="text-xs text-gray-400">views</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Most Cart Added */}
        <div className="bg-white rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b bg-gray-50">
            <h2 className="font-semibold text-gray-700 flex items-center gap-2">
              <i className="ri-shopping-cart-line" />
              Most Added to Cart
            </h2>
          </div>
          {(!data?.mostCartAdded || data.mostCartAdded.length === 0) ? (
            <div className="p-6 text-center text-gray-500">
              <i className="ri-shopping-cart-2-line text-3xl mb-2 block" />
              <p className="text-sm">No cart data yet</p>
            </div>
          ) : (
            <div className="divide-y max-h-80 overflow-y-auto">
              {data.mostCartAdded.map((product, index) => (
                <div key={product.id || index} className="px-4 py-3 flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-500 text-sm flex items-center justify-center font-medium flex-shrink-0">
                    {index + 1}
                  </span>
                  <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 relative">
                    {product.image ? (
                      <Image src={product.image} alt={product.name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <i className="ri-image-line text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{product.name}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-green-600">{product.count}</p>
                    <p className="text-xs text-gray-400">times</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Most Checkout */}
        <div className="bg-white rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b bg-gray-50">
            <h2 className="font-semibold text-gray-700 flex items-center gap-2">
              <i className="ri-checkbox-circle-line" />
              Most Checkout
            </h2>
          </div>
          {(!data?.mostCheckout || data.mostCheckout.length === 0) ? (
            <div className="p-6 text-center text-gray-500">
              <i className="ri-file-list-3-line text-3xl mb-2 block" />
              <p className="text-sm">No orders yet</p>
            </div>
          ) : (
            <div className="divide-y max-h-80 overflow-y-auto">
              {data.mostCheckout.map((product, index) => (
                <div key={product.id || index} className="px-4 py-3 flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-500 text-sm flex items-center justify-center font-medium flex-shrink-0">
                    {index + 1}
                  </span>
                  <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 relative">
                    {product.image ? (
                      <Image src={product.image} alt={product.name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <i className="ri-image-line text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{product.name}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-green-600">{product.orders}</p>
                    <p className="text-xs text-gray-400">orders</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );

  return (
    <AdminLayout title="Analytics" subtitle="View visitor and sales analytics">
      {content}
    </AdminLayout>
  );
}
