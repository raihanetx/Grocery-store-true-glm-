'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import AdminLayout from '@/components/admin/AdminLayout';

interface Category {
  id: string;
  name: string;
  code: string;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

type IconType = 'icon' | 'image';

export default function AdminDashboard() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [uploading, setUploading] = useState(false);
  const [iconType, setIconType] = useState<IconType>('icon');
  
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    imageUrl: '',
  });

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/categories');
      if (res.ok) setCategories(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', 'categories');
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      if (res.ok) {
        const data = await res.json();
        setFormData(prev => ({ ...prev, imageUrl: data.url }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUploading(false);
    }
  };

  const openNewModal = () => {
    setEditingCategory(null);
    setIconType('icon');
    setFormData({ name: '', code: '', imageUrl: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setIconType(cat.imageUrl && !cat.code.startsWith('ri-') ? 'image' : 'icon');
    setFormData({ name: cat.name, code: cat.code, imageUrl: cat.imageUrl || '' });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('name', formData.name);
    const code = editingCategory 
      ? formData.code 
      : (iconType === 'image' ? `img_${Date.now()}` : formData.code);
    fd.append('code', code);
    if (iconType === 'image' && formData.imageUrl) {
      fd.append('imageUrl', formData.imageUrl);
    }

    try {
      const url = editingCategory ? `/api/categories/${editingCategory.id}` : '/api/categories';
      const res = await fetch(url, { method: editingCategory ? 'PUT' : 'POST', body: fd });
      if (res.ok) {
        setIsModalOpen(false);
        fetchCategories();
      } else {
        const err = await res.json();
        alert(err.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this category?')) return;
    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      if (res.ok) fetchCategories();
    } catch (e) {
      console.error(e);
    }
  };

  const content = (
    <>
      <div className="flex justify-between items-center mb-6">
        <Button onClick={openNewModal} className="bg-green-600 text-white hover:bg-green-700">
          <i className="ri-add-line mr-2" />Add Category
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
        </div>
      ) : categories.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center">
          <i className="ri-folder-line text-5xl text-gray-300 mb-4 block" />
          <p className="text-gray-500 mb-4">No categories yet</p>
          <Button onClick={openNewModal} className="bg-green-600 text-white hover:bg-green-700">
            <i className="ri-add-line mr-2" />Add Category
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {categories.map(cat => (
            <div key={cat.id} className="bg-white rounded-xl overflow-hidden shadow-sm">
              <div className="h-32 bg-gray-100 flex items-center justify-center relative">
                {cat.imageUrl ? (
                  <Image src={cat.imageUrl} alt={cat.name} fill className="object-cover" />
                ) : cat.code.startsWith('ri-') ? (
                  <i className={`${cat.code} text-4xl text-gray-600`} />
                ) : (
                  <i className="ri-folder-line text-4xl text-gray-300" />
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold">{cat.name}</h3>
                <p className="text-xs text-gray-400 mt-1">{cat.code}</p>
                <div className="flex gap-2 mt-3 pt-3 border-t">
                  <button
                    onClick={() => openEditModal(cat)}
                    className="flex-1 py-2 text-sm bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                  >
                    <i className="ri-edit-line" />
                  </button>
                  <button 
                    onClick={() => handleDelete(cat.id)} 
                    className="flex-1 py-2 text-sm bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                  >
                    <i className="ri-delete-bin-line" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold">{editingCategory ? 'Edit' : 'Add'} Category</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <i className="ri-close-line text-xl" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Icon Type */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIconType('icon')}
                  className={cn(
                    "flex-1 py-2.5 rounded-lg border-2 text-sm font-medium transition-colors",
                    iconType === 'icon'
                      ? "border-green-600 bg-green-600 text-white"
                      : "border-gray-300 text-gray-600 hover:border-gray-400"
                  )}
                >
                  <i className="ri-remixicon-line mr-1" />Icon
                </button>
                <button
                  type="button"
                  onClick={() => setIconType('image')}
                  className={cn(
                    "flex-1 py-2.5 rounded-lg border-2 text-sm font-medium transition-colors",
                    iconType === 'image'
                      ? "border-green-600 bg-green-600 text-white"
                      : "border-gray-300 text-gray-600 hover:border-gray-400"
                  )}
                >
                  <i className="ri-image-line mr-1" />Image
                </button>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium mb-1">Category Name *</label>
                <Input value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} placeholder="e.g., Fruits" required />
              </div>

              {/* Icon Code OR Image Upload */}
              {iconType === 'icon' ? (
                <div>
                  <label className="block text-sm font-medium mb-1">Icon Code *</label>
                  <div className="flex gap-2 items-center">
                    <Input value={formData.code} onChange={e => setFormData(p => ({ ...p, code: e.target.value }))} placeholder="ri-leaf-line" required />
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center border">
                      {formData.code ? <i className={`${formData.code} text-xl`} /> : <i className="ri-question-line text-xl text-gray-300" />}
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium mb-1">Upload Image *</label>
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden border flex items-center justify-center">
                      {formData.imageUrl ? <Image src={formData.imageUrl} alt="" width={64} height={64} className="object-cover" /> : <i className="ri-image-line text-2xl text-gray-300" />}
                    </div>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="img" />
                    <label htmlFor="img" className="px-4 py-2 bg-gray-100 rounded-lg text-sm cursor-pointer hover:bg-gray-200 transition-colors">
                      {uploading ? 'Uploading...' : <><i className="ri-upload-2-line mr-1" />Upload</>}
                    </label>
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-gray-200 text-gray-700 hover:bg-gray-300"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-green-600 text-white hover:bg-green-700"
                >
                  {editingCategory ? 'Update' : 'Add'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );

  return (
    <AdminLayout title="Categories" subtitle="Manage your product categories">
      {content}
    </AdminLayout>
  );
}
