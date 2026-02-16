'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import AdminLayout from '@/components/admin/AdminLayout';

interface Review {
  id: string;
  productId: string;
  productName: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export default function ReviewsPage() {
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = useCallback(async () => {
    try {
      const response = await fetch('/api/reviews');
      if (!response.ok) throw new Error('Failed to fetch reviews');
      const data = await response.json();
      setReviews(data.map((r: { productId: string; product: { name: string } }) => ({
        ...r,
        productName: r.product?.name || 'Unknown Product'
      })));
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast({ title: 'Error', description: 'Failed to load reviews', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this review?')) return;
    try {
      const res = await fetch(`/api/reviews/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchReviews();
        toast({ title: 'Review deleted' });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const content = loading ? (
    <div className="flex justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
    </div>
  ) : reviews.length === 0 ? (
    <div className="bg-white rounded-lg p-8 text-center">
      <i className="ri-chat-smile-3-line text-4xl text-gray-300 mb-2 block" />
      <p className="text-gray-500">No reviews yet</p>
    </div>
  ) : (
    <div className="space-y-3">
      {reviews.map((review) => (
        <div key={review.id} className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold">{review.userName}</span>
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <i
                      key={i}
                      className={`ri-star-fill text-sm ${i < review.rating ? 'text-yellow-400' : 'text-gray-200'}`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-xs text-gray-500 mb-2">{review.productName} • {formatDate(review.createdAt)}</p>
              <p className="text-sm text-gray-600">{review.comment}</p>
            </div>
            <button
              onClick={() => handleDelete(review.id)}
              className="p-2 text-red-500 hover:bg-red-50 rounded transition-colors"
            >
              <i className="ri-delete-bin-line" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <AdminLayout title="Reviews" subtitle="Manage customer reviews">
      {content}
    </AdminLayout>
  );
}
