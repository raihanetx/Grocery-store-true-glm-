import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cache } from '@/lib/cache';

export const dynamic = 'force-dynamic';

// Combined API for product detail page - single request for all data
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    // Check cache
    const cacheKey = `product-detail-${id}`;
    const cached = cache.get<{
      product: unknown;
      relatedProducts: unknown[];
      reviews: unknown[];
    }>(cacheKey);
    
    if (cached) {
      return NextResponse.json(cached);
    }

    // Run all queries in parallel for maximum speed
    const [product, manualRelated, reviews] = await Promise.all([
      // Main product
      db.product.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          categoryId: true,
          isOffer: true,
          shortDesc: true,
          longDesc: true,
          faqEnabled: true,
          category: {
            select: { id: true, name: true }
          },
          varieties: {
            select: {
              id: true,
              name: true,
              price: true,
              stock: true,
              hasDiscount: true,
              discountType: true,
              discountValue: true,
            }
          },
          faqs: {
            select: { id: true, question: true, answer: true }
          },
          images: {
            select: { id: true, url: true }
          },
        },
      }),
      
      // Manual related products
      db.relatedProduct.findMany({
        where: { productId: id },
        select: {
          relatedTo: {
            select: {
              id: true,
              name: true,
              categoryId: true,
              varieties: { select: { price: true }, take: 1 },
              images: { select: { url: true }, take: 1 },
            }
          }
        },
        orderBy: { sortOrder: 'asc' },
        take: 4,
      }),
      
      // Reviews
      db.review.findMany({
        where: { productId: id },
        select: {
          id: true,
          userName: true,
          rating: true,
          comment: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ]);

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Get manual related products list
    const manualRelatedProducts = manualRelated.map(r => r.relatedTo);
    
    // If we have fewer than 4 manual related, get auto related from same category
    let relatedProducts = manualRelatedProducts;
    
    if (manualRelatedProducts.length < 4) {
      const autoRelated = await db.product.findMany({
        where: {
          categoryId: product.categoryId,
          id: { not: id }
        },
        select: {
          id: true,
          name: true,
          categoryId: true,
          varieties: { select: { price: true }, take: 1 },
          images: { select: { url: true }, take: 1 },
        },
        take: 4 - manualRelatedProducts.length,
      });
      
      // Filter out duplicates
      const existingIds = new Set(manualRelatedProducts.map(p => p.id));
      relatedProducts = [
        ...manualRelatedProducts,
        ...autoRelated.filter(p => !existingIds.has(p.id))
      ];
    }

    const responseData = {
      product,
      relatedProducts,
      reviews,
    };

    // Cache for 2 minutes
    cache.set(cacheKey, responseData, 120000);

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Product detail API error:', error);
    return NextResponse.json({ error: 'Failed to fetch product details' }, { status: 500 });
  }
}
