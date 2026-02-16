'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/contexts/cart-context';
import type { Product } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';


interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const { toast } = useToast();
  const placeholder = PlaceHolderImages.find(p => p.id === product.imageId);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    addToCart(product, 1);
    toast({
        title: "Added to cart!",
        description: `${product.name} has been added to your cart.`,
    });
  };

  return (
    <div 
        className="bg-white p-3 shadow-sm relative cursor-pointer transition-all duration-300 flex flex-col border border-gray-200 rounded-[15px] hover:shadow-lg w-full"
    >
        {product.badge && (
            <span className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded z-10">
                {product.badge}
            </span>
        )}

        <Link href={`/product/${product.id}`} className="flex-grow flex items-center justify-center mb-2">
            <div className="relative w-[140px] h-[140px]">
                <Image 
                  src={placeholder?.imageUrl || `https://picsum.photos/seed/${product.id}/400/300`}
                  alt={product.name}
                  fill
                  className="object-contain"
                  loading="lazy"
                />
            </div>
        </Link>

        <div className="flex flex-col mt-auto">
            <Link href={`/product/${product.id}`}>
              <h3 className="text-sm font-medium text-gray-900 mb-0.5 truncate">
                {product.name}
              </h3>
            </Link>

            <div className="flex items-center gap-2 mb-1.5">
                <span className="text-sm font-semibold text-primary">
                  TK {product.price}
                </span>
                {product.oldPrice && (
                    <span className="text-sm line-through text-gray-500">
                    TK {product.oldPrice}
                    </span>
                )}
            </div>

            <Button 
                onClick={handleAddToCart}
                size="sm"
                className="w-full text-xs font-bold py-1.5 h-auto flex items-center justify-center gap-1 bg-primary text-white rounded-full border-none cursor-pointer transition-transform active:scale-95"
            >
                <i className="ri-shopping-cart-line h-3.5 w-3.5" />
                Add to Cart
            </Button>
        </div>
    </div>
  );
}
