import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// POST - Track product view
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { productId, visitorId } = body;

    if (!productId) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
    }

    // Create product view record using raw query
    await db.$executeRaw`
      INSERT INTO ProductView (id, productId, visitorId, createdAt)
      VALUES (${crypto.randomUUID()}, ${productId}, ${visitorId || null}, datetime('now'))
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking view:', error);
    return NextResponse.json({ error: 'Failed to track view' }, { status: 500 });
  }
}
