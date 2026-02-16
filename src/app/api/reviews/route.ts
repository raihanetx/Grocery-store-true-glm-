import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET - Fetch reviews (optimized)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const productId = searchParams.get('productId');

    const where = productId ? { productId } : {};

    const reviews = await db.review.findMany({
      where,
      select: {
        id: true,
        userName: true,
        rating: true,
        comment: true,
        createdAt: true,
        product: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: productId ? 50 : 100,
    });

    return NextResponse.json(reviews, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

// POST - Create a new review
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, userName, rating, comment } = body;

    if (!productId || !userName || !rating || !comment) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const review = await db.review.create({
      data: {
        productId,
        userName,
        rating: parseInt(rating),
        comment,
      },
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create review' }, { status: 500 });
  }
}
