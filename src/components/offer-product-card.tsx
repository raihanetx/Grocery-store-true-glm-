'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { categories } from '@/lib/data';

interface OfferProductCardProps {
  product: Product;
}

export function OfferProductCard({ product }: OfferProductCardProps) {
  const placeholder = PlaceHolderImages.find(p => p.id === product.imageId);
  const categoryName = categories.find(c => c.id === product.category)?.name || product.category;

  const discount = product.oldPrice ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100) : 0;

  return (
    <Link href={`/product/${product.id}`} className="group block">
        <div 
            className="w-full bg-white rounded-2xl flex items-center overflow-hidden shadow-card transition-all duration-300 border border-gray-100 hover:-translate-y-0.5 hover:shadow-lg h-full"
        >
            {/* Image Section */}
            <div className="w-24 h-full flex justify-center items-center p-2 flex-shrink-0">
                <Image 
                  src={placeholder?.imageUrl || `https://picsum.photos/seed/${product.id}/200/200`}
                  alt={product.name}
                  width={90}
                  height={90}
                  className="object-contain"
                  loading="lazy"
                />
            </div>
            
            {/* Divider */}
            <div className="w-px h-[70%] bg-gray-200"></div>

            {/* Info Section */}
            <div className="flex-1 p-3 flex flex-col justify-center">
                <span className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">{categoryName}</span>
                <h2 className="text-sm font-bold text-gray-800 m-0 mb-1 truncate group-hover:text-primary transition-colors">{product.name}</h2>
                <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-green-600">TK {product.price}</span>
                    {product.oldPrice && (
                        <span className="text-xs line-through text-gray-400">TK {product.oldPrice}</span>
                    )}
                </div>
                {discount > 0 && (
                     <div className="text-[10px] font-semibold bg-red-100 text-red-600 px-2 py-0.5 rounded-md self-start mt-2">
                        Save {discount}% today
                    </div>
                )}
            </div>
        </div>
    </Link>
  );
}
