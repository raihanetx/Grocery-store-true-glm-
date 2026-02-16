'use client';
import React, { useState, use, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/cart-context';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Variety {
  id: string;
  name: string;
  price: number;
  stock: number;
  hasDiscount: boolean;
  discountType: string | null;
  discountValue: number | null;
}

interface FAQ {
  id: string;
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
  category: { id: string; name: string };
  varieties: Variety[];
  faqs: FAQ[];
  images: { id: string; url: string }[];
}

interface RelatedProduct {
  id: string;
  name: string;
  categoryId: string;
  varieties: { price: number }[];
  images: { url: string }[];
}

interface Review {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

// Skeleton loader for instant perceived speed
function ProductSkeleton() {
  return (
    <section className="bg-white text-gray-800 antialiased pb-10">
      <div className="border-b border-gray-100 bg-white sticky top-[60px] md:top-[90px] z-30">
        <div className="max-w-5xl mx-auto px-5 py-3">
          <div className="w-8 h-8 bg-gray-100 rounded-lg animate-pulse" />
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-5 pt-6 md:pt-10 pb-6 md:pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
          <div className="flex flex-col gap-4">
            <div className="relative w-full h-80 md:h-96 bg-gray-100 rounded-2xl animate-pulse" />
          </div>
          <div className="flex flex-col gap-4">
            <div className="h-8 bg-gray-100 rounded-lg w-3/4 animate-pulse" />
            <div className="h-6 bg-gray-100 rounded-lg w-1/4 animate-pulse" />
            <div className="h-4 bg-gray-100 rounded-lg w-full animate-pulse" />
            <div className="h-4 bg-gray-100 rounded-lg w-2/3 animate-pulse" />
            <div className="flex gap-2 mt-4">
              <div className="h-10 bg-gray-100 rounded-full w-20 animate-pulse" />
              <div className="h-10 bg-gray-100 rounded-full w-20 animate-pulse" />
            </div>
            <div className="flex gap-3 mt-6">
              <div className="h-12 bg-gray-100 rounded-xl flex-1 animate-pulse" />
              <div className="h-12 bg-gray-100 rounded-xl flex-1 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const resolvedParams = use(params);
    const { addToCart } = useCart();
    const { toast } = useToast();
    
    // State
    const [product, setProduct] = useState<Product | null>(null);
    const [relatedProducts, setRelatedProducts] = useState<RelatedProduct[]>([]);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [activeTab, setActiveTab] = useState('descTab');
    const [selectedVariety, setSelectedVariety] = useState<Variety | null>(null);
    
    // Review State
    const [isReviewModalOpen, setReviewModalOpen] = useState(false);
    const [reviewName, setReviewName] = useState('');
    const [reviewText, setReviewText] = useState('');
    const [reviewRating, setReviewRating] = useState(0);
    const [submitting, setSubmitting] = useState(false);

    // Single API call for ALL product detail data
    useEffect(() => {
        const productId = resolvedParams.id;
        
        fetch(`/api/product-detail/${productId}`)
          .then(res => res.json())
          .then(data => {
            if (data.product) {
              setProduct(data.product);
              if (data.product.varieties?.length > 0) {
                setSelectedVariety(data.product.varieties[0]);
              }
            }
            if (data.relatedProducts) {
              setRelatedProducts(data.relatedProducts);
            }
            if (data.reviews) {
              setReviews(data.reviews);
            }
            setLoading(false);
            
            // Track view (non-blocking)
            if (data.product?.id) {
              fetch('/api/analytics/track-view', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId: data.product.id }),
              }).catch(() => {});
            }
          })
          .catch(() => setLoading(false));
    }, [resolvedParams.id]);

    // Show skeleton instantly while loading
    if (loading) {
      return <ProductSkeleton />;
    }

    if (!product) {
      return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center">
          <i className="ri-emotion-sad-line text-6xl text-gray-300 mb-4" />
          <p className="text-gray-500">Product not found</p>
          <Button onClick={() => router.push('/')} className="mt-4 bg-primary text-white">
            Go Home
          </Button>
        </div>
      );
    }

    const activeImage = product.images[0]?.url;

    const getDiscountedPrice = (variety: Variety) => {
      if (!variety.hasDiscount || !variety.discountValue) return variety.price;
      if (variety.discountType === 'percentage') {
        return variety.price - (variety.price * variety.discountValue / 100);
      }
      return variety.price - variety.discountValue;
    };

    const handleAddToCart = () => {
      if (!selectedVariety) return;
      addToCart({
        id: product.id,
        name: product.name,
        price: getDiscountedPrice(selectedVariety),
        unit: selectedVariety.name,
        image: product.images[0]?.url || '',
        category: product.category?.name || ''
      }, quantity);

      fetch('/api/analytics/track-cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, quantity }),
      }).catch(() => {});

      toast({ title: "Added to cart!", description: `${product.name} (${selectedVariety.name}) added to cart.` });
    };

    const handleBuyNow = () => {
      if (!selectedVariety) return;
      addToCart({
        id: product.id,
        name: product.name,
        price: getDiscountedPrice(selectedVariety),
        unit: selectedVariety.name,
        image: product.images[0]?.url || '',
        category: product.category?.name || ''
      }, quantity);

      fetch('/api/analytics/track-cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, quantity }),
      }).catch(() => {});

      router.push('/checkout');
    };

    const handleSubmitReview = async (e: React.FormEvent) => {
      e.preventDefault();
      if (reviewRating === 0 || !reviewName || !reviewText) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please fill all fields' });
        return;
      }

      setSubmitting(true);
      try {
        const res = await fetch('/api/reviews', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId: product.id, userName: reviewName, rating: reviewRating, comment: reviewText }),
        });
        if (res.ok) {
          const newReview = await res.json();
          setReviews([newReview, ...reviews]);
          toast({ title: 'Review submitted!' });
          setReviewModalOpen(false);
          setReviewRating(0);
          setReviewName('');
          setReviewText('');
        }
      } catch {
        toast({ variant: 'destructive', title: 'Error' });
      } finally {
        setSubmitting(false);
      }
    };

    const formatDate = (dateString: string) => {
      const diffDays = Math.floor((Date.now() - new Date(dateString).getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 0) return 'Just now';
      if (diffDays === 1) return '1 day ago';
      if (diffDays < 7) return `${diffDays} days ago`;
      return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return (
      <section className="bg-white text-gray-800 antialiased pb-10">
        <div className="border-b border-gray-100 bg-white sticky top-[60px] md:top-[90px] z-30">
          <div className="max-w-5xl mx-auto px-5 py-3 flex justify-start items-center">
            <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-800 font-semibold text-sm cursor-pointer hover:text-primary transition-colors">
              <i className="ri-arrow-left-line h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-5 pt-6 md:pt-10 pb-6 md:pb-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 items-start">
            <div className="flex flex-col gap-4">
              <div className="relative w-full h-80 md:h-96 bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                {product.isOffer && (
                  <div className="absolute top-3 left-3 bg-red-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-md z-10 shadow-md">OFFER</div>
                )}
                {activeImage ? (
                  <Image src={activeImage} fill className="object-cover" alt={product.name} priority sizes="500px" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <i className="ri-image-line text-6xl text-gray-300" />
                  </div>
                )}
              </div>
              {product.images.length > 1 && (
                <div className="grid grid-cols-4 gap-4">
                  {product.images.slice(0, 4).map((img, index) => (
                    <div key={img.id} className={cn('relative aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all hover:border-primary', index === 0 ? 'border-primary' : 'border-gray-100')}>
                      <Image src={img.url} fill className="object-cover" alt={`${product.name} ${index + 1}`} loading="lazy" sizes="100px" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col justify-center">
              <h1 className="text-xl md:text-3xl font-bold text-gray-800 leading-tight mb-3">{product.name}</h1>
              
              <div className="flex items-center flex-wrap gap-4 mb-5">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-green-600">৳{selectedVariety ? getDiscountedPrice(selectedVariety).toFixed(0) : 0}</span>
                  {selectedVariety?.hasDiscount && selectedVariety.discountValue && (
                    <span className="text-sm text-gray-300 line-through font-medium">৳{selectedVariety.price}</span>
                  )}
                </div>
                <div className="w-px h-4 bg-gray-200"></div>
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">{selectedVariety?.name || 'Select variety'}</span>
                <div className="w-px h-4 bg-gray-200"></div>
                <div className="flex items-center gap-3">
                  <Button size="icon" onClick={() => setQuantity(q => Math.max(1, q - 1))} className="bg-gray-200 text-gray-700 hover:bg-gray-300 rounded-lg"><i className="ri-subtract-line" /></Button>
                  <span className="text-base font-bold text-gray-800 w-4 text-center">{quantity}</span>
                  <Button size="icon" onClick={() => setQuantity(q => q + 1)} className="bg-gray-200 text-gray-700 hover:bg-gray-300 rounded-lg"><i className="ri-add-line" /></Button>
                </div>
              </div>

              <p className="text-sm text-gray-600 leading-relaxed mb-6 line-clamp-2">{product.longDesc || product.shortDesc || 'Quality product from our store.'}</p>

              {product.varieties.length > 0 && (
                <div className="mb-8">
                  <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest block mb-2.5">Select Variety</span>
                  <div className="flex flex-wrap gap-2.5">
                    {product.varieties.map((variety) => (
                      <button key={variety.id} onClick={() => setSelectedVariety(variety)} className={cn("btn-tap border-2 font-medium px-5 py-2 rounded-full text-xs transition-all", selectedVariety?.id === variety.id ? "border-green-600 bg-green-600 text-white font-semibold" : "border-gray-300 text-gray-600 hover:border-green-600 hover:bg-gray-50")}>
                        {variety.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button onClick={handleBuyNow} size="lg" className="btn-tap flex-1 bg-green-600 text-white h-12 rounded-xl text-sm font-bold shadow-lg shadow-green-200 hover:bg-green-700 transition-all uppercase tracking-wide">Buy Now</Button>
                <Button onClick={handleAddToCart} size="lg" className="btn-tap flex-1 bg-white text-green-600 border-2 border-green-600 h-12 rounded-xl text-sm font-bold hover:bg-green-600 hover:text-white transition-all uppercase tracking-wide">Add to Cart</Button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-12">
            <div className="flex justify-center items-center gap-5 border-y border-gray-200 py-2.5 mb-8">
              <button onClick={() => setActiveTab('descTab')} className={cn("tab-head text-sm transition-colors", activeTab === 'descTab' ? 'font-bold text-gray-800' : 'font-medium text-gray-400 hover:text-gray-800')}>Description</button>
              <div className="w-px h-3 bg-gray-300"></div>
              <button onClick={() => setActiveTab('revTab')} className={cn("tab-head text-sm transition-colors", activeTab === 'revTab' ? 'font-bold text-gray-800' : 'font-medium text-gray-400 hover:text-gray-800')}>Reviews ({reviews.length})</button>
              {product.faqEnabled && product.faqs.length > 0 && (
                <>
                  <div className="w-px h-3 bg-gray-300"></div>
                  <button onClick={() => setActiveTab('qaTab')} className={cn("tab-head text-sm transition-colors", activeTab === 'qaTab' ? 'font-bold text-gray-800' : 'font-medium text-gray-400 hover:text-gray-800')}>FAQ</button>
                </>
              )}
            </div>

            <div className="max-w-3xl mx-auto">
              {activeTab === 'descTab' && (
                <div className="text-sm text-gray-600 leading-7 text-center md:text-left">
                  <p className="mb-4">{product.longDesc || product.shortDesc || 'Quality product from our store.'}</p>
                  <ul className="inline-block text-left space-y-2 mt-2">
                    <li className="flex items-center gap-2"><i className="ri-check-line text-green-500" /> 100% Quality Assured</li>
                    <li className="flex items-center gap-2"><i className="ri-check-line text-green-500" /> Freshly Sourced</li>
                  </ul>
                </div>
              )}
              {activeTab === 'revTab' && (
                <div className="max-w-3xl mx-auto">
                  <div onClick={() => setReviewModalOpen(true)} className="flex items-center gap-3 mb-8 cursor-pointer group">
                    <div className="w-12 h-12 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 group-hover:border-primary group-hover:text-primary transition bg-white">
                      <i className="ri-user-line" />
                    </div>
                    <div className="flex-1 border border-gray-300 rounded-full h-12 px-4 flex items-center text-gray-400 bg-white group-hover:border-primary group-hover:text-primary transition">Write a review...</div>
                  </div>
                  {reviews.length === 0 ? (
                    <div className="text-center py-8">
                      <i className="ri-chat-smile-3-line text-4xl text-gray-300 mb-3" />
                      <p className="text-gray-500">No reviews yet</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-5">
                      {reviews.map((review) => (
                        <div key={review.id} className="p-5 rounded-xl bg-white border border-gray-200 shadow-sm">
                          <div className="flex gap-3 items-start">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center font-bold text-blue-600">{review.userName[0].toUpperCase()}</div>
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-sm text-gray-800">{review.userName}</h4>
                                <span className="text-xs text-gray-400">• {formatDate(review.createdAt)}</span>
                              </div>
                              <div className="flex gap-0.5 mt-0.5">
                                {[...Array(5)].map((_, i) => (
                                  <i key={i} className={cn("ri-star-fill w-3.5 h-3.5", i < review.rating ? 'text-yellow-400' : 'text-gray-200')} />
                                ))}
                              </div>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 leading-relaxed mt-2 pl-13">{review.comment}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {activeTab === 'qaTab' && product.faqEnabled && product.faqs.length > 0 && (
                <div className="space-y-6 text-center md:text-left">
                  {product.faqs.map((faq) => (
                    <div key={faq.id} className="pb-4 border-b border-gray-50 last:border-0">
                      <p className="text-sm font-bold text-gray-800 mb-1 flex items-center justify-center md:justify-start gap-2"><i className="ri-question-line text-primary" /> {faq.question}</p>
                      <p className="text-sm text-gray-600 md:pl-6">{faq.answer}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <div className="mt-12">
              <h3 className="text-center text-[10px] font-bold uppercase tracking-[0.2em] text-gray-300 mb-8">You May Also Like</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {relatedProducts.map((rp) => (
                  <Link href={`/product/${rp.id}`} key={rp.id} className="group cursor-pointer">
                    <div className="aspect-square bg-gray-50 rounded-xl overflow-hidden mb-3 border border-gray-100 relative">
                      {rp.images?.[0]?.url ? (
                        <Image src={rp.images[0].url} fill className="object-cover group-hover:scale-105 transition-transform duration-500" alt={rp.name} loading="lazy" sizes="200px" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><i className="ri-image-line text-4xl text-gray-300" /></div>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-gray-800 mb-1 group-hover:text-primary transition-colors">{rp.name}</h4>
                    <span className="text-xs font-bold text-primary">৳{rp.varieties?.[0]?.price || 0}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Review Modal */}
        {isReviewModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
              <div className="bg-gray-50 p-4 border-b border-gray-200">
                <h3 className="font-bold text-lg text-gray-700 text-center">Rate your experience</h3>
              </div>
              <form onSubmit={handleSubmitReview} className="p-6 flex flex-col gap-5">
                <div className="flex justify-center gap-2">
                  {[...Array(5)].map((_, i) => (
                    <button key={i} type="button" onClick={() => setReviewRating(i + 1)} className="focus:outline-none transition transform hover:scale-110">
                      <i className={cn("ri-star-fill h-8 w-8", i < reviewRating ? 'text-yellow-400' : 'text-gray-300')} />
                    </button>
                  ))}
                </div>
                <input type="text" value={reviewName} onChange={(e) => setReviewName(e.target.value)} placeholder="Your Name" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600" />
                <textarea value={reviewText} onChange={(e) => setReviewText(e.target.value)} rows={4} placeholder="Share your thoughts..." className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 resize-none" />
                <div className="flex gap-3">
                  <Button type="button" onClick={() => setReviewModalOpen(false)} className="flex-1 py-3 h-auto rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300">Cancel</Button>
                  <Button type="submit" disabled={submitting} className="flex-1 py-3 h-auto rounded-lg bg-green-600 text-white hover:bg-green-700">{submitting ? 'Submitting...' : 'Submit'}</Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </section>
    );
}
