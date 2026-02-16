import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// POST - Track product added to cart
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { productId, visitorId, quantity } = body;

    if (!productId) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
    }

    // Create cart add record using raw query
    await db.$executeRaw`
      INSERT INTO CartAdd (id, productId, visitorId, quantity, createdAt)
      VALUES (${crypto.randomUUID()}, ${productId}, ${visitorId || null}, ${quantity || 1}, datetime('now'))
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking cart:', error);
    return NextResponse.json({ error: 'Failed to track cart' }, { status: 500 });
  }
}
