'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import AdminLayout from '@/components/admin/AdminLayout';

interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
}

interface Coupon {
  id: string;
  code: string;
  type: string;
  value: number;
  applyTo: string;
  categoryId: string | null;
  productId: string | null;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
}

export default function CouponsAdmin() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  const [code, setCode] = useState('');
  const [type, setType] = useState<'percentage' | 'fixed'>('percentage');
  const [value, setValue] = useState('');
  const [applyTo, setApplyTo] = useState<'all' | 'category' | 'product'>('all');
  const [categoryId, setCategoryId] = useState('');
  const [productId, setProductId] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [isActive, setIsActive] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [couponsRes, catsRes, prodsRes] = await Promise.all([
        fetch('/api/coupons'),
        fetch('/api/categories'),
        fetch('/api/products'),
      ]);
      if (couponsRes.ok) setCoupons(await couponsRes.json());
      if (catsRes.ok) setCategories(await catsRes.json());
      if (prodsRes.ok) setProducts(await prodsRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const resetForm = () => {
    setCode('');
    setType('percentage');
    setValue('');
    setApplyTo('all');
    setCategoryId('');
    setProductId('');
    setExpiresAt('');
    setIsActive(true);
    setEditingCoupon(null);
  };

  const openNewModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setCode(coupon.code);
    setType(coupon.type as 'percentage' | 'fixed');
    setValue(coupon.value.toString());
    setApplyTo(coupon.applyTo as 'all' | 'category' | 'product');
    setCategoryId(coupon.categoryId || '');
    setProductId(coupon.productId || '');
    setExpiresAt(coupon.expiresAt ? coupon.expiresAt.split('T')[0] : '');
    setIsActive(coupon.isActive);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const fd = new FormData();
    fd.append('code', code);
    fd.append('type', type);
    fd.append('value', value);
    fd.append('applyTo', applyTo);
    if (applyTo === 'category') fd.append('categoryId', categoryId);
    if (applyTo === 'product') fd.append('productId', productId);
    if (expiresAt) fd.append('expiresAt', expiresAt);
    fd.append('isActive', isActive.toString());

    try {
      const url = editingCoupon ? `/api/coupons/${editingCoupon.id}` : '/api/coupons';
      const res = await fetch(url, {
        method: editingCoupon ? 'PUT' : 'POST',
        body: fd,
      });

      if (res.ok) {
        setIsModalOpen(false);
        resetForm();
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this coupon?')) return;
    try {
      const res = await fetch(`/api/coupons/${id}`, { method: 'DELETE' });
      if (res.ok) fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const toggleActive = async (coupon: Coupon) => {
    try {
      const fd = new FormData();
      fd.append('code', coupon.code);
      fd.append('type', coupon.type);
      fd.append('value', coupon.value.toString());
      fd.append('applyTo', coupon.applyTo);
      if (coupon.categoryId) fd.append('categoryId', coupon.categoryId);
      if (coupon.productId) fd.append('productId', coupon.productId);
      if (coupon.expiresAt) fd.append('expiresAt', coupon.expiresAt);
      fd.append('isActive', (!coupon.isActive).toString());

      const res = await fetch(`/api/coupons/${coupon.id}`, {
        method: 'PUT',
        body: fd,
      });
      if (res.ok) fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const content = loading ? (
    <div className="flex justify-center py-16">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
    </div>
  ) : (
    <>
      <div className="flex justify-end mb-6">
        <Button onClick={openNewModal} className="bg-green-600 text-white hover:bg-green-700">
          <i className="ri-add-line mr-2" />Add Coupon
        </Button>
      </div>

      {coupons.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center">
          <i className="ri-coupon-line text-5xl text-gray-300 mb-4 block" />
          <p className="text-gray-500 mb-4">No coupons yet</p>
          <Button onClick={openNewModal} className="bg-green-600 text-white hover:bg-green-700">
            <i className="ri-add-line mr-2" />Add Coupon
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Code</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Discount</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Applies To</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {coupons.map(coupon => (
                  <tr key={coupon.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="font-mono font-bold text-green-600">{coupon.code}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("px-2 py-1 rounded text-sm font-medium", coupon.type === 'percentage' ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700")}>
                        {coupon.type === 'percentage' ? `${coupon.value}%` : `৳${coupon.value}`}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {coupon.applyTo === 'all' && 'All Products'}
                      {coupon.applyTo === 'category' && `Category: ${categories.find(c => c.id === coupon.categoryId)?.name || 'Unknown'}`}
                      {coupon.applyTo === 'product' && `Product: ${products.find(p => p.id === coupon.productId)?.name || 'Unknown'}`}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleActive(coupon)}
                        className={cn("px-3 py-1 rounded-full text-xs font-medium transition", 
                          coupon.isActive && !isExpired(coupon.expiresAt) 
                            ? "bg-green-100 text-green-700 hover:bg-green-200" 
                            : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                        )}
                      >
                        {isExpired(coupon.expiresAt) ? 'Expired' : coupon.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openEditModal(coupon)}
                        className="p-2 text-green-600 hover:bg-green-100 rounded transition-colors"
                      >
                        <i className="ri-edit-line" />
                      </button>
                      <button 
                        onClick={() => handleDelete(coupon.id)} 
                        className="p-2 text-red-500 hover:bg-red-50 rounded transition-colors"
                      >
                        <i className="ri-delete-bin-line" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold">{editingCoupon ? 'Edit' : 'Add'} Coupon</h3>
              <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="text-gray-400 hover:text-gray-600">
                <i className="ri-close-line text-xl" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Coupon Code *</label>
                <Input
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g., SAVE20"
                  required
                  className="font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Discount Type *</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setType('percentage')}
                    className={cn(
                      "flex-1 py-2.5 rounded-lg border-2 text-sm font-medium transition-colors",
                      type === 'percentage'
                        ? "border-green-600 bg-green-600 text-white"
                        : "border-gray-300 text-gray-600 hover:border-gray-400"
                    )}
                  >
                    <i className="ri-percent-line mr-1" />Percentage
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('fixed')}
                    className={cn(
                      "flex-1 py-2.5 rounded-lg border-2 text-sm font-medium transition-colors",
                      type === 'fixed'
                        ? "border-green-600 bg-green-600 text-white"
                        : "border-gray-300 text-gray-600 hover:border-gray-400"
                    )}
                  >
                    <i className="ri-money-dollar-circle-line mr-1" />Fixed
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  {type === 'percentage' ? 'Percentage (%)' : 'Amount (৳)'} *
                </label>
                <Input
                  type="number"
                  value={value}
                  onChange={e => setValue(e.target.value)}
                  placeholder={type === 'percentage' ? '20' : '100'}
                  required
                  min="0"
                  max={type === 'percentage' ? '100' : undefined}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Applies To *</label>
                <div className="grid grid-cols-3 gap-2">
                  {['all', 'category', 'product'].map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setApplyTo(opt as 'all' | 'category' | 'product')}
                      className={cn(
                        "py-2 rounded-lg border-2 text-sm font-medium transition-colors",
                        applyTo === opt
                          ? "border-green-600 bg-green-600 text-white"
                          : "border-gray-300 text-gray-600 hover:border-gray-400"
                      )}
                    >
                      {opt.charAt(0).toUpperCase() + opt.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {applyTo === 'category' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Select Category *</label>
                  <select
                    value={categoryId}
                    onChange={e => setCategoryId(e.target.value)}
                    className="w-full h-10 px-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                    required
                  >
                    <option value="">Choose category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {applyTo === 'product' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Select Product *</label>
                  <select
                    value={productId}
                    onChange={e => setProductId(e.target.value)}
                    className="w-full h-10 px-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                    required
                  >
                    <option value="">Choose product</option>
                    {products.map(prod => (
                      <option key={prod.id} value={prod.id}>{prod.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Expiry Date (Optional)</label>
                <Input
                  type="date"
                  value={expiresAt}
                  onChange={e => setExpiresAt(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <label className="font-medium">Active</label>
                  <p className="text-sm text-gray-500">Enable this coupon</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={cn("w-14 h-7 rounded-full transition relative", isActive ? "bg-green-600" : "bg-gray-300")}
                >
                  <span className={cn("absolute top-1 w-5 h-5 bg-white rounded-full shadow transition", isActive ? "left-8" : "left-1")} />
                </button>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  onClick={() => { setIsModalOpen(false); resetForm(); }}
                  className="flex-1 bg-gray-200 text-gray-700 hover:bg-gray-300"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-green-600 text-white hover:bg-green-700"
                >
                  {editingCoupon ? 'Update' : 'Add'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );

  return (
    <AdminLayout title="Coupons" subtitle="Manage discount coupons">
      {content}
    </AdminLayout>
  );
}
