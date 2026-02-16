import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET - Fetch related products for a product
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
    }

    const relatedProducts = await db.relatedProduct.findMany({
      where: { productId },
      include: {
        relatedTo: {
          include: {
            category: { select: { name: true } },
            varieties: { take: 1 },
            images: { take: 1 },
          }
        }
      },
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json(relatedProducts);
  } catch (error) {
    console.error('Fetch related products error:', error);
    return NextResponse.json({ error: 'Failed to fetch related products' }, { status: 500 });
  }
}

// POST - Add a related product
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, relatedId, sortOrder } = body;

    if (!productId || !relatedId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if already exists
    const existing = await db.relatedProduct.findUnique({
      where: {
        productId_relatedId: { productId, relatedId }
      }
    });

    if (existing) {
      return NextResponse.json({ error: 'Already added as related product' }, { status: 400 });
    }

    // Check max 4
    const count = await db.relatedProduct.count({
      where: { productId }
    });

    if (count >= 4) {
      return NextResponse.json({ error: 'Maximum 4 related products allowed' }, { status: 400 });
    }

    const relatedProduct = await db.relatedProduct.create({
      data: {
        productId,
        relatedId,
        sortOrder: sortOrder ?? count,
      },
    });

    return NextResponse.json(relatedProduct, { status: 201 });
  } catch (error) {
    console.error('Create related product error:', error);
    return NextResponse.json({ error: 'Failed to add related product' }, { status: 500 });
  }
}

// PUT - Update related products order
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, relatedIds } = body;

    if (!productId || !Array.isArray(relatedIds)) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    // Delete existing and create new with order
    await db.relatedProduct.deleteMany({ where: { productId } });

    for (let i = 0; i < relatedIds.length; i++) {
      await db.relatedProduct.create({
        data: {
          productId,
          relatedId: relatedIds[i],
          sortOrder: i,
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update related products error:', error);
    return NextResponse.json({ error: 'Failed to update related products' }, { status: 500 });
  }
}
