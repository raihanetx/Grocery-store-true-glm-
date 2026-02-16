import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cache } from '@/lib/cache';

export const dynamic = 'force-dynamic';

// GET - Fetch single product (with cache)
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    // Check cache
    const cacheKey = `product-${id}`;
    const cached = cache.get<any>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const product = await db.product.findUnique({
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
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Cache for 60 seconds
    cache.set(cacheKey, product, 60000);

    return NextResponse.json(product);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}

// PUT - Update product
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const formData = await request.formData();

    const name = formData.get('name') as string;
    const categoryId = formData.get('categoryId') as string;
    const isOffer = formData.get('isOffer') === 'true';
    const shortDesc = formData.get('shortDesc') as string | null;
    const longDesc = formData.get('longDesc') as string | null;
    const faqEnabled = formData.get('faqEnabled') === 'true';

    const varietiesJson = formData.get('varieties') as string | null;
    const varieties = varietiesJson ? JSON.parse(varietiesJson) : [];

    const faqsJson = formData.get('faqs') as string | null;
    const faqs = faqsJson ? JSON.parse(faqsJson) : [];

    const imagesJson = formData.get('images') as string | null;
    const images = imagesJson ? JSON.parse(imagesJson) : [];

    if (!name || !categoryId) {
      return NextResponse.json({ error: 'Name and category are required' }, { status: 400 });
    }

    const existing = await db.product.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    await db.productVariety.deleteMany({ where: { productId: id } });
    await db.productFAQ.deleteMany({ where: { productId: id } });
    await db.productImage.deleteMany({ where: { productId: id } });

    const product = await db.product.update({
      where: { id },
      data: {
        name,
        categoryId,
        isOffer,
        shortDesc,
        longDesc,
        faqEnabled,
        varieties: {
          create: varieties.map((v: {
            name: string;
            price: number;
            stock: number;
            hasDiscount: boolean;
            discountType: string | null;
            discountValue: number | null;
          }) => ({
            name: v.name,
            price: parseFloat(v.price) || 0,
            stock: parseInt(v.stock) || 0,
            hasDiscount: v.hasDiscount || false,
            discountType: v.discountType || null,
            discountValue: v.discountValue ? parseFloat(v.discountValue) : null,
          })),
        },
        faqs: {
          create: faqs.map((f: { question: string; answer: string }) => ({
            question: f.question,
            answer: f.answer,
          })),
        },
        images: {
          create: images.map((url: string) => ({ url })),
        },
      },
      include: {
        category: true,
        varieties: true,
        faqs: true,
        images: true,
      },
    });

    // Invalidate all product caches
    cache.delete('products');
    cache.delete(`product-${id}`);
    cache.delete(`product-detail-${id}`);
    cache.delete('home-data');

    return NextResponse.json(product);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

// DELETE - Delete product
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const existing = await db.product.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    await db.product.delete({ where: { id } });

    // Invalidate all product caches
    cache.delete('products');
    cache.delete(`product-${id}`);
    cache.delete(`product-detail-${id}`);
    cache.delete('home-data');

    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
