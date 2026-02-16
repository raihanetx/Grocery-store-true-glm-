'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import AdminLayout from '@/components/admin/AdminLayout';

// Types
interface Category {
  id: string;
  name: string;
  code: string;
  imageUrl: string | null;
}

interface Variety {
  id?: string;
  name: string;
  price: string;
  stock: string;
  hasDiscount: boolean;
  discountType: 'fixed' | 'percentage' | null;
  discountValue: string;
}

interface FAQ {
  id?: string;
  question: string;
  answer: string;
}

interface Product {
  id: string;
  name: string;
  categoryId: string;
  isOffer: boolean;
  shortDesc: string | null;
  longDesc: string | null;
  faqEnabled: boolean;
  category: Category;
  varieties: Variety[];
  faqs: FAQ[];
  images: { id: string; url: string }[];
  createdAt: string;
}

const emptyVariety: Variety = {
  name: '',
  price: '',
  stock: '',
  hasDiscount: false,
  discountType: null,
  discountValue: '',
};

const emptyFAQ: FAQ = {
  question: '',
  answer: '',
};

export default function ProductsAdmin() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [uploading, setUploading] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [isOffer, setIsOffer] = useState(false);
  const [shortDesc, setShortDesc] = useState('');
  const [longDesc, setLongDesc] = useState('');
  const [faqEnabled, setFaqEnabled] = useState(false);
  const [varieties, setVarieties] = useState<Variety[]>([{ ...emptyVariety }]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [selectedRelatedIds, setSelectedRelatedIds] = useState<string[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/categories'),
      ]);
      if (prodRes.ok) setProducts(await prodRes.json());
      if (catRes.ok) setCategories(await catRes.json());
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
    setName('');
    setCategoryId('');
    setIsOffer(false);
    setShortDesc('');
    setLongDesc('');
    setFaqEnabled(false);
    setVarieties([{ ...emptyVariety }]);
    setFaqs([]);
    setImages([]);
    setSelectedRelatedIds([]);
    setEditingProduct(null);
  };

  const openNewModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = async (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setCategoryId(product.categoryId);
    setIsOffer(product.isOffer);
    setShortDesc(product.shortDesc || '');
    setLongDesc(product.longDesc || '');
    setFaqEnabled(product.faqEnabled);
    setVarieties((product.varieties || []).length > 0 ? (product.varieties || []).map(v => ({
      id: v.id,
      name: v.name,
      price: v.price.toString(),
      stock: v.stock.toString(),
      hasDiscount: v.hasDiscount,
      discountType: v.discountType as 'fixed' | 'percentage' | null,
      discountValue: v.discountValue?.toString() || '',
    })) : [{ ...emptyVariety }]);
    setFaqs((product.faqs || []).map(f => ({ id: f.id, question: f.question, answer: f.answer })));
    setImages((product.images || []).map(img => img.url));
    
    try {
      const res = await fetch(`/api/related-products?productId=${product.id}`);
      if (res.ok) {
        const related = await res.json();
        setSelectedRelatedIds(related.map((r: { relatedId: string }) => r.relatedId));
      }
    } catch (e) {
      console.error(e);
    }
    
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const uploadedUrls: string[] = [];
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('folder', 'products');
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        if (res.ok) {
          const data = await res.json();
          uploadedUrls.push(data.url);
        }
      }
      setImages(prev => [...prev, ...uploadedUrls]);
    } catch (e) {
      console.error(e);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const addVariety = () => {
    setVarieties(prev => [...prev, { ...emptyVariety }]);
  };

  const removeVariety = (index: number) => {
    if (varieties.length > 1) {
      setVarieties(prev => prev.filter((_, i) => i !== index));
    }
  };

  const updateVariety = (index: number, field: keyof Variety, value: string | boolean) => {
    setVarieties(prev => prev.map((v, i) => (i === index ? { ...v, [field]: value } : v)));
  };

  const addFAQ = () => {
    setFaqs(prev => [...prev, { ...emptyFAQ }]);
  };

  const removeFAQ = (index: number) => {
    setFaqs(prev => prev.filter((_, i) => i !== index));
  };

  const updateFAQ = (index: number, field: keyof FAQ, value: string) => {
    setFaqs(prev => prev.map((f, i) => (i === index ? { ...f, [field]: value } : f)));
  };

  const toggleRelatedProduct = (productId: string) => {
    setSelectedRelatedIds(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      }
      if (prev.length >= 4) {
        return prev;
      }
      return [...prev, productId];
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const fd = new FormData();
    fd.append('name', name);
    fd.append('categoryId', categoryId);
    fd.append('isOffer', isOffer.toString());
    fd.append('shortDesc', shortDesc);
    fd.append('longDesc', longDesc);
    fd.append('faqEnabled', faqEnabled.toString());
    fd.append('varieties', JSON.stringify(varieties));
    fd.append('faqs', JSON.stringify(faqs));
    fd.append('images', JSON.stringify(images));

    try {
      const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
      const res = await fetch(url, {
        method: editingProduct ? 'PUT' : 'POST',
        body: fd,
      });

      if (res.ok) {
        if (editingProduct) {
          await fetch('/api/related-products', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              productId: editingProduct.id,
              relatedIds: selectedRelatedIds,
            }),
          });
        }
        
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
    if (!confirm('Delete this product?')) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (res.ok) fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const getDiscountedPrice = (v: Variety) => {
    if (!v.hasDiscount || !v.discountValue) return null;
    const price = parseFloat(v.price) || 0;
    const discVal = parseFloat(v.discountValue) || 0;
    if (v.discountType === 'percentage') {
      return price - (price * discVal / 100);
    }
    return price - discVal;
  };

  const availableProducts = products.filter(p => p.id !== editingProduct?.id);

  const content = (
    <>
      <div className="flex justify-between items-center mb-6">
        <Button onClick={openNewModal} className="bg-green-600 text-white hover:bg-green-700">
          <i className="ri-add-line mr-2" />Add Product
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center">
          <i className="ri-shopping-bag-line text-5xl text-gray-300 mb-4 block" />
          <p className="text-gray-500 mb-4">No products yet</p>
          <Button onClick={openNewModal} className="bg-green-600 text-white hover:bg-green-700">
            <i className="ri-add-line mr-2" />Add Product
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {products.map(product => (
            <div key={product.id} className="bg-white rounded-xl overflow-hidden shadow-sm">
              <div className="h-32 bg-gray-100 flex items-center justify-center relative">
                {(product.images || [])[0] ? (
                  <Image src={(product.images || [])[0].url} alt={product.name} fill className="object-cover" />
                ) : (
                  <i className="ri-image-line text-4xl text-gray-300" />
                )}
                {product.isOffer && (
                  <span className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded">Offer</span>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold truncate">{product.name}</h3>
                <p className="text-xs text-gray-400 mt-1">{product.category?.name}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm font-medium text-green-600">
                    {(product.varieties || [])[0] && `৳${(product.varieties || [])[0].price}`}
                  </span>
                  <span className="text-xs text-gray-400">{(product.varieties || []).length} varieties</span>
                </div>
                <div className="flex gap-2 mt-3 pt-3 border-t">
                  <button
                    onClick={() => openEditModal(product)}
                    className="flex-1 py-2 text-sm bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                  >
                    <i className="ri-edit-line" />
                  </button>
                  <button 
                    onClick={() => handleDelete(product.id)} 
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

      {/* Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/50 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl my-8 overflow-hidden">
            <div className="px-6 py-4 border-b sticky top-0 bg-white z-10 flex justify-between items-center">
              <h3 className="text-lg font-semibold">{editingProduct ? 'Edit' : 'Add'} Product</h3>
              <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="text-gray-400 hover:text-gray-600">
                <i className="ri-close-line text-xl" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Product Name *</label>
                  <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Fresh Apple" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Category *</label>
                  <select
                    value={categoryId}
                    onChange={e => setCategoryId(e.target.value)}
                    className="w-full h-10 px-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                    required
                  >
                    <option value="">Select category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Offer Toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <label className="font-medium">Offer Product</label>
                  <p className="text-sm text-gray-500">Enable if this product has special offer</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOffer(!isOffer)}
                  className={cn("w-14 h-7 rounded-full transition relative", isOffer ? "bg-green-600" : "bg-gray-300")}
                >
                  <span className={cn("absolute top-1 w-5 h-5 bg-white rounded-full shadow transition", isOffer ? "left-8" : "left-1")} />
                </button>
              </div>

              {/* Descriptions */}
              <div>
                <label className="block text-sm font-medium mb-1">Short Description</label>
                <Input value={shortDesc} onChange={e => setShortDesc(e.target.value)} placeholder="Brief product description" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Long Description</label>
                <textarea
                  value={longDesc}
                  onChange={e => setLongDesc(e.target.value)}
                  placeholder="Detailed product description"
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                />
              </div>

              {/* FAQ Section */}
              <div className="border rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="font-medium">FAQ Section</label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-sm text-gray-500">Enable</span>
                    <button
                      type="button"
                      onClick={() => setFaqEnabled(!faqEnabled)}
                      className={cn("w-12 h-6 rounded-full transition relative", faqEnabled ? "bg-green-600" : "bg-gray-300")}
                    >
                      <span className={cn("absolute top-1 w-4 h-4 bg-white rounded-full transition", faqEnabled ? "left-7" : "left-1")} />
                    </button>
                  </label>
                </div>

                {faqs.length > 0 && (
                  <div className="space-y-3 mb-3">
                    {faqs.map((faq, index) => (
                      <div key={index} className="flex gap-2 items-start">
                        <div className="flex-1 space-y-2">
                          <Input
                            value={faq.question}
                            onChange={e => updateFAQ(index, 'question', e.target.value)}
                            placeholder="Question"
                          />
                          <Input
                            value={faq.answer}
                            onChange={e => updateFAQ(index, 'answer', e.target.value)}
                            placeholder="Answer"
                          />
                        </div>
                        <button type="button" onClick={() => removeFAQ(index)} className="p-2 text-red-500 hover:bg-red-50 rounded transition-colors">
                          <i className="ri-delete-bin-line" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <button type="button" onClick={addFAQ} className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:text-green-600 hover:border-green-600 transition">
                  <i className="ri-add-line mr-1" />Add Question
                </button>
              </div>

              {/* Varieties Section */}
              <div className="border rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="font-medium">Varieties *</label>
                  <button type="button" onClick={addVariety} className="text-sm text-green-600 hover:underline">
                    <i className="ri-add-line mr-1" />Add Variety
                  </button>
                </div>

                <div className="space-y-4">
                  {varieties.map((variety, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg space-y-3">
                      <div className="grid grid-cols-3 gap-2">
                        <Input
                          value={variety.name}
                          onChange={e => updateVariety(index, 'name', e.target.value)}
                          placeholder="Variety name (e.g., 1kg)"
                          required
                        />
                        <Input
                          type="number"
                          value={variety.price}
                          onChange={e => updateVariety(index, 'price', e.target.value)}
                          placeholder="Price (৳)"
                          required
                        />
                        <Input
                          type="number"
                          value={variety.stock}
                          onChange={e => updateVariety(index, 'stock', e.target.value)}
                          placeholder="Stock"
                          required
                        />
                      </div>

                      {/* Discount */}
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={variety.hasDiscount}
                            onChange={e => updateVariety(index, 'hasDiscount', e.target.checked)}
                            className="w-4 h-4 rounded accent-green-600"
                          />
                          <span className="text-sm">Discount</span>
                        </label>

                        {variety.hasDiscount && (
                          <div className="flex gap-2 flex-1">
                            <select
                              value={variety.discountType || ''}
                              onChange={e => updateVariety(index, 'discountType', e.target.value as 'fixed' | 'percentage')}
                              className="h-9 px-2 border rounded text-sm"
                            >
                              <option value="">Type</option>
                              <option value="fixed">Fixed (৳)</option>
                              <option value="percentage">Percentage (%)</option>
                            </select>
                            <Input
                              type="number"
                              value={variety.discountValue}
                              onChange={e => updateVariety(index, 'discountValue', e.target.value)}
                              placeholder="Value"
                              className="w-24"
                            />
                            {getDiscountedPrice(variety) !== null && (
                              <span className="text-sm text-green-600 self-center">
                                Final: ৳{getDiscountedPrice(variety)?.toFixed(0)}
                              </span>
                            )}
                          </div>
                        )}

                        {varieties.length > 1 && (
                          <button type="button" onClick={() => removeVariety(index)} className="p-2 text-red-500 hover:bg-red-100 rounded transition-colors">
                            <i className="ri-close-line" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Images */}
              <div className="border rounded-xl p-4">
                <label className="font-medium block mb-3">Product Images</label>

                {images.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {images.map((url, index) => (
                      <div key={index} className="relative w-20 h-20 rounded-lg overflow-hidden border">
                        <Image src={url} alt={`Product ${index + 1}`} fill className="object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                  id="product-images"
                />
                <label
                  htmlFor="product-images"
                  className="w-full py-4 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-green-600 hover:text-green-600 transition"
                >
                  {uploading ? (
                    <span className="text-sm"><i className="ri-loader-4-line animate-spin mr-2" />Uploading...</span>
                  ) : (
                    <span className="text-sm text-gray-500"><i className="ri-image-add-line mr-2" />Click to upload images</span>
                  )}
                </label>
              </div>

              {/* Related Products */}
              {editingProduct && (
                <div className="border rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <label className="font-medium">Related Products</label>
                      <p className="text-xs text-gray-500">Select up to 4 products to show as related</p>
                    </div>
                    <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded">
                      {selectedRelatedIds.length}/4 selected
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                    {availableProducts.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => toggleRelatedProduct(p.id)}
                        className={cn(
                          "relative aspect-square rounded-lg overflow-hidden border-2 transition",
                          selectedRelatedIds.includes(p.id) 
                            ? "border-green-600 ring-2 ring-green-600/30" 
                            : "border-gray-200 hover:border-gray-300"
                        )}
                      >
                        {p.images[0] ? (
                          <Image src={p.images[0].url} alt={p.name} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                            <i className="ri-image-line text-gray-300" />
                          </div>
                        )}
                        {selectedRelatedIds.includes(p.id) && (
                          <div className="absolute top-1 right-1 w-5 h-5 bg-green-600 text-white rounded-full flex items-center justify-center text-xs">
                            <i className="ri-check-line" />
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[9px] py-1 px-1 truncate">
                          {p.name}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 pt-4 border-t">
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
                  {editingProduct ? 'Update' : 'Add'} Product
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );

  return (
    <AdminLayout title="Products" subtitle="Manage your products">
      {content}
    </AdminLayout>
  );
}
