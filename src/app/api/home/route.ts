import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cache } from '@/lib/cache';

export const dynamic = 'force-dynamic';

// Combined API for home page - single request for all data
export async function GET() {
  try {
    // Check cache first
    const cached = cache.get<{ categories: unknown[]; products: unknown[] }>('home-data');
    if (cached) {
      return NextResponse.json(cached);
    }

    // Run both queries in parallel using Promise.all
    const [categories, products] = await Promise.all([
      db.category.findMany({
        select: {
          id: true,
          name: true,
          code: true,
          imageUrl: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 20, // Limit categories
      }),
      db.product.findMany({
        select: {
          id: true,
          name: true,
          categoryId: true,
          isOffer: true,
          shortDesc: true,
          category: {
            select: { id: true, name: true }
          },
          varieties: {
            select: {
              id: true,
              name: true,
              price: true,
              hasDiscount: true,
              discountType: true,
              discountValue: true,
            },
            take: 1, // Only need first variety for cards
          },
          images: {
            select: { id: true, url: true },
            take: 1, // Only need first image for cards
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 50, // Limit products
      }),
    ]);

    const responseData = { categories, products };

    // Cache for 2 minutes (120 seconds)
    cache.set('home-data', responseData, 120000);

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Home API error:', error);
    return NextResponse.json({ error: 'Failed to fetch home data' }, { status: 500 });
  }
}
