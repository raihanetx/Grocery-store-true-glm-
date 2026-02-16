import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Fetch all coupons
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const activeOnly = searchParams.get('active') === 'true';

    const where = activeOnly ? { isActive: true } : {};

    const coupons = await db.coupon.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(coupons);
  } catch (error) {
    console.error('Fetch coupons error:', error);
    return NextResponse.json({ error: 'Failed to fetch coupons' }, { status: 500 });
  }
}

// POST - Create new coupon
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const code = (formData.get('code') as string)?.toUpperCase().trim();
    const type = formData.get('type') as string;
    const value = parseFloat(formData.get('value') as string);
    const applyTo = formData.get('applyTo') as string;
    const categoryId = formData.get('categoryId') as string | null;
    const productId = formData.get('productId') as string | null;
    const expiresAt = formData.get('expiresAt') as string | null;
    const isActive = formData.get('isActive') === 'true';

    if (!code || !type || !value || !applyTo) {
      return NextResponse.json({ error: 'Code, type, value, and apply to are required' }, { status: 400 });
    }

    // Check if code already exists
    const existing = await db.coupon.findUnique({ where: { code } });
    if (existing) {
      return NextResponse.json({ error: 'Coupon code already exists' }, { status: 400 });
    }

    // Validate applyTo fields
    if (applyTo === 'category' && !categoryId) {
      return NextResponse.json({ error: 'Category is required for category-specific coupons' }, { status: 400 });
    }
    if (applyTo === 'product' && !productId) {
      return NextResponse.json({ error: 'Product is required for product-specific coupons' }, { status: 400 });
    }

    const coupon = await db.coupon.create({
      data: {
        code,
        type,
        value,
        applyTo,
        categoryId: applyTo === 'category' ? categoryId : null,
        productId: applyTo === 'product' ? productId : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        isActive,
      },
    });

    return NextResponse.json(coupon, { status: 201 });
  } catch (error) {
    console.error('Create coupon error:', error);
    return NextResponse.json({ error: 'Failed to create coupon' }, { status: 500 });
  }
}
