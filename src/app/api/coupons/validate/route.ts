import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST - Validate and get coupon details
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, productIds = [], categoryIds = [] } = body;

    if (!code) {
      return NextResponse.json({ error: 'Coupon code is required' }, { status: 400 });
    }

    const coupon = await db.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon) {
      return NextResponse.json({ error: 'Invalid coupon code' }, { status: 404 });
    }

    // Check if coupon is active
    if (!coupon.isActive) {
      return NextResponse.json({ error: 'This coupon is not active' }, { status: 400 });
    }

    // Check expiry
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'This coupon has expired' }, { status: 400 });
    }

    // Determine applicability
    let appliesToText = '';
    let applicableProductIds: string[] = [];
    let isApplicable = true;

    if (coupon.applyTo === 'all') {
      appliesToText = 'All Products';
      applicableProductIds = productIds;
    } else if (coupon.applyTo === 'category') {
      const category = await db.category.findUnique({ where: { id: coupon.categoryId! } });
      appliesToText = category ? `Category: ${category.name}` : 'Specific Category';
      applicableProductIds = productIds.filter((_: string, index: number) => 
        categoryIds[index] === coupon.categoryId
      );
      
      if (!categoryIds.includes(coupon.categoryId!)) {
        isApplicable = false;
      }
    } else if (coupon.applyTo === 'product') {
      const product = await db.product.findUnique({ where: { id: coupon.productId! } });
      appliesToText = product ? `Product: ${product.name}` : 'Specific Product';
      applicableProductIds = [coupon.productId!];
      
      if (!productIds.includes(coupon.productId!)) {
        isApplicable = false;
      }
    }

    return NextResponse.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        applyTo: coupon.applyTo,
        appliesToText,
        applicableProductIds,
        isApplicable,
      },
    });
  } catch (error) {
    console.error('Validate coupon error:', error);
    return NextResponse.json({ error: 'Failed to validate coupon' }, { status: 500 });
  }
}
