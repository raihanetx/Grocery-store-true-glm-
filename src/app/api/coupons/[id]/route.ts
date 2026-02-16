import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Fetch single coupon
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const coupon = await db.coupon.findUnique({ where: { id } });

    if (!coupon) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
    }

    return NextResponse.json(coupon);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch coupon' }, { status: 500 });
  }
}

// PUT - Update coupon
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
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

    const existing = await db.coupon.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
    }

    // Check if code already exists (for different coupon)
    const duplicate = await db.coupon.findUnique({ where: { code } });
    if (duplicate && duplicate.id !== id) {
      return NextResponse.json({ error: 'Coupon code already exists' }, { status: 400 });
    }

    // Validate applyTo fields
    if (applyTo === 'category' && !categoryId) {
      return NextResponse.json({ error: 'Category is required for category-specific coupons' }, { status: 400 });
    }
    if (applyTo === 'product' && !productId) {
      return NextResponse.json({ error: 'Product is required for product-specific coupons' }, { status: 400 });
    }

    const coupon = await db.coupon.update({
      where: { id },
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

    return NextResponse.json(coupon);
  } catch (error) {
    console.error('Update coupon error:', error);
    return NextResponse.json({ error: 'Failed to update coupon' }, { status: 500 });
  }
}

// DELETE - Delete coupon
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const existing = await db.coupon.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
    }

    await db.coupon.delete({ where: { id } });

    return NextResponse.json({ message: 'Coupon deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete coupon' }, { status: 500 });
  }
}
