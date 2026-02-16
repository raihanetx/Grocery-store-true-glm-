'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import HelpWidget from '@/components/HelpWidget';

interface Category {
  id: string;
  name: string;
  code: string;
  imageUrl: string | null;
}

interface Product {
  id: string;
  name: string;
  categoryId: string;
  isOffer: boolean;
  shortDesc: string | null;
  category: { id: string; name: string };
  varieties: {
    id: string;
    name: string;
    price: number;
    hasDiscount: boolean;
    discountType: string | null;
    discountValue: number | null;
  }[];
  images: { id: string; url: string }[];
}

// Skeleton Components for instant visual feedback
const CategorySkeleton = () => (
  <div className="flex-shrink-0 flex flex-col items-center animate-pulse">
    <div className="w-[60px] h-[60px] rounded-xl border border-gray-200 bg-gray-100 mb-2" />
    <div className="w-12 h-3 bg-gray-100 rounded" />
  </div>
);

const ProductCardSkeleton = () => (
  <div className="bg-white rounded-xl overflow-hidden shadow-sm animate-pulse">
    <div className="h-36 bg-gray-100" />
    <div className="p-3">
      <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
      <div className="h-3 bg-gray-100 rounded w-1/2 mb-2" />
      <div className="h-3 bg-gray-100 rounded w-full mb-2" />
      <div className="flex justify-between items-center mt-2">
        <div className="h-4 bg-gray-100 rounded w-16" />
        <div className="h-3 bg-gray-100 rounded w-12" />
      </div>
      <div className="h-8 bg-gray-100 rounded w-full mt-3" />
    </div>
  </div>
);

const OfferCardSkeleton = () => (
  <div className="bg-white rounded-xl overflow-hidden shadow-sm border-2 border-red-100 animate-pulse">
    <div className="h-36 bg-gray-100 relative">
      <div className="absolute top-2 right-2 w-10 h-5 bg-red-100 rounded-full" />
    </div>
    <div className="p-3">
      <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
      <div className="h-3 bg-gray-100 rounded w-1/2 mb-2" />
      <div className="flex justify-between items-center">
        <div className="h-4 bg-gray-100 rounded w-16" />
        <div className="h-3 bg-gray-100 rounded w-12" />
      </div>
      <div className="h-8 bg-gray-100 rounded w-full mt-3" />
    </div>
  </div>
);

// Product Card Component (memoized for performance)
const ProductCard = React.memo(function ProductCard({ product }: { product: Product }) {
  const firstVariety = product.varieties[0];
  const firstImage = product.images[0]?.url;
  
  const getDiscountedPrice = () => {
    if (!firstVariety?.hasDiscount || !firstVariety.discountValue) return null;
    const price = firstVariety.price;
    if (firstVariety.discountType === 'percentage') {
      return price - (price * firstVariety.discountValue / 100);
    }
    return price - firstVariety.discountValue;
  };

  const discountedPrice = getDiscountedPrice();

  return (
    <Link href={`/product/${product.id}`} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow block">
      <div className="h-36 bg-gray-100 relative">
        {firstImage ? (
          <Image src={firstImage} alt={product.name} fill className="object-cover" sizes="200px" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <i className="ri-image-line text-4xl text-gray-300" />
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-sm truncate">{product.name}</h3>
        <p className="text-xs text-gray-400 mt-0.5">{product.category?.name}</p>
        {product.shortDesc && (
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{product.shortDesc}</p>
        )}
        <div className="flex items-center justify-between mt-2">
          {discountedPrice ? (
            <div className="flex items-center gap-1">
              <span className="text-sm font-bold text-green-600">৳{discountedPrice.toFixed(0)}</span>
              <span className="text-xs text-gray-400 line-through">৳{firstVariety.price}</span>
            </div>
          ) : (
            <span className="text-sm font-bold text-green-600">৳{firstVariety?.price || 0}</span>
          )}
          {firstVariety && (
            <span className="text-xs text-gray-400">{firstVariety.name}</span>
          )}
        </div>
        <span className="w-full mt-3 py-2 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition flex items-center justify-center">
          View Details
        </span>
      </div>
    </Link>
  );
});

// Offer Product Card Component (memoized)
const OfferProductCard = React.memo(function OfferProductCard({ product }: { product: Product }) {
  const firstVariety = product.varieties[0];
  const firstImage = product.images[0]?.url;
  
  const getDiscountedPrice = () => {
    if (!firstVariety?.hasDiscount || !firstVariety.discountValue) return null;
    const price = firstVariety.price;
    if (firstVariety.discountType === 'percentage') {
      return price - (price * firstVariety.discountValue / 100);
    }
    return price - firstVariety.discountValue;
  };

  const discountedPrice = getDiscountedPrice();

  return (
    <Link href={`/product/${product.id}`} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border-2 border-red-100 block">
      <div className="h-36 bg-gray-100 relative">
        {firstImage ? (
          <Image src={firstImage} alt={product.name} fill className="object-cover" sizes="200px" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <i className="ri-image-line text-4xl text-gray-300" />
          </div>
        )}
        <span className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
          {firstVariety?.hasDiscount && firstVariety.discountType === 'percentage' 
            ? `-${firstVariety.discountValue}%` 
            : 'Offer'}
        </span>
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-sm truncate">{product.name}</h3>
        <p className="text-xs text-gray-400 mt-0.5">{product.category?.name}</p>
        <div className="flex items-center justify-between mt-2">
          {discountedPrice ? (
            <div className="flex items-center gap-1">
              <span className="text-sm font-bold text-red-500">৳{discountedPrice.toFixed(0)}</span>
              <span className="text-xs text-gray-400 line-through">৳{firstVariety.price}</span>
            </div>
          ) : (
            <span className="text-sm font-bold text-red-500">৳{firstVariety?.price || 0}</span>
          )}
          {firstVariety && (
            <span className="text-xs text-gray-400">{firstVariety.name}</span>
          )}
        </div>
        <span className="w-full mt-3 py-2 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600 transition flex items-center justify-center">
          View Details
        </span>
      </div>
    </Link>
  );
});

export default function HomePage() {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('search') || '';
  
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [currentCategory, setCurrentCategory] = React.useState('all');
  const [loading, setLoading] = React.useState(true);

  // Single API call for all home data
  React.useEffect(() => {
    fetch('/api/home')
      .then(res => res.json())
      .then(data => {
        if (data.categories && data.products) {
          setCategories(data.categories);
          setProducts(data.products);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Memoized filtered products
  const filteredProducts = React.useMemo(() => {
    return products.filter(p => {
      const matchesCategory = currentCategory === 'all' || p.categoryId === currentCategory;
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, currentCategory, searchQuery]);

  const offerProducts = React.useMemo(() => products.filter(p => p.isOffer), [products]);

  return (
    <div className="pb-24 md:pb-0">
      {/* Help Widget */}
      <HelpWidget />
      
      {/* Hero */}
      <section className="w-full pb-4 md:pb-0">
        <div className="mx-6 relative h-[172.5px] md:h-[260px] rounded-2xl overflow-hidden shadow-xl group">
          <Image src="https://images.unsplash.com/photo-1542838132-92c53300491e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2574&q=80" alt="Hero" fill className="object-cover transition-transform duration-700 group-hover:scale-105" priority sizes="100vw" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent" />
        </div>
      </section>

      {/* Categories */}
      <section className="pt-8 pb-6 md:pt-10 md:pb-8">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-4 md:mb-8">
            <h2 className="text-xl md:text-3xl font-bold">Categories</h2>
            <p className="text-gray-500 mt-1 text-sm md:text-base">Find everything you need</p>
          </div>
          
          {loading ? (
            <div className="flex justify-center">
              <div className="flex gap-4 overflow-x-auto pb-2 px-4 no-scrollbar">
                <CategorySkeleton />
                <CategorySkeleton />
                <CategorySkeleton />
                <CategorySkeleton />
                <CategorySkeleton />
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="flex gap-4 overflow-x-auto md:flex-wrap md:justify-center pb-2 md:pb-0 px-4 no-scrollbar">
                <div onClick={() => setCurrentCategory('all')} className="flex-shrink-0 flex flex-col items-center cursor-pointer">
                  <div className={cn("w-[60px] h-[60px] rounded-xl border flex items-center justify-center mb-2 transition-colors", currentCategory === 'all' ? "border-primary text-primary" : "border-gray-300 text-gray-700 hover:text-primary")}>
                    <i className="ri-apps-line text-2xl" />
                  </div>
                  <span className={cn("text-[11px] font-medium", currentCategory === 'all' && "text-primary")}>All</span>
                </div>
                
                {categories.map(cat => (
                  <div key={cat.id} onClick={() => setCurrentCategory(cat.id)} className="flex-shrink-0 flex flex-col items-center cursor-pointer">
                    <div className={cn("w-[60px] h-[60px] rounded-xl border bg-white flex items-center justify-center overflow-hidden mb-2 transition-colors relative", currentCategory === cat.id ? "border-primary text-primary" : "border-gray-300 text-gray-700 hover:text-primary")}>
                      {cat.imageUrl ? (
                        <Image src={cat.imageUrl} alt={cat.name} fill className="object-cover" sizes="60px" loading="lazy" />
                      ) : cat.code.startsWith('ri-') ? (
                        <i className={`${cat.code} text-2xl`} />
                      ) : (
                        <i className="ri-folder-line text-2xl" />
                      )}
                    </div>
                    <span className={cn("text-[11px] font-medium text-center w-[70px]", currentCategory === cat.id && "text-primary")}>{cat.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Offers */}
      {loading ? (
        <section className="pb-12 pt-2">
          <div className="container mx-auto px-4 md:px-6">
            <h2 className="text-center text-xl md:text-3xl font-bold mb-4 md:mb-8">Offers</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              <OfferCardSkeleton />
              <OfferCardSkeleton />
            </div>
          </div>
        </section>
      ) : offerProducts.length > 0 && (
        <section className="pb-12 pt-2">
          <div className="container mx-auto px-4 md:px-6">
            <h2 className="text-center text-xl md:text-3xl font-bold mb-4 md:mb-8">Offers</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {offerProducts.map(p => <OfferProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* Products */}
      <section id="products" className="pb-12 pt-2">
        <div className="container mx-auto px-4 md:px-6">
          <h2 className="text-center text-xl md:text-3xl font-bold mb-4 md:mb-8">All Products</h2>
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
              <ProductCardSkeleton />
              <ProductCardSkeleton />
              <ProductCardSkeleton />
              <ProductCardSkeleton />
              <ProductCardSkeleton />
              <ProductCardSkeleton />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                {filteredProducts.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
              {filteredProducts.length === 0 && <p className="text-center py-16 text-gray-400">No products found</p>}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
