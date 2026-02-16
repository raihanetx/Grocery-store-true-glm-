import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cache } from '@/lib/cache';

export const dynamic = 'force-dynamic';

// GET - Fetch all products (with cache)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const categoryId = searchParams.get('categoryId');
    
    // Create cache key
    const cacheKey = categoryId ? `products-${categoryId}` : 'products-all';
    
    // Check cache
    const cached = cache.get<any[]>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const where = categoryId ? { categoryId } : {};

    const products = await db.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        categoryId: true,
        isOffer: true,
        shortDesc: true,
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
        images: {
          select: { id: true, url: true },
          take: 3,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Cache for 60 seconds
    cache.set(cacheKey, products, 60000);

    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

// POST - Create new product
export async function POST(request: NextRequest) {
  try {
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

    if (varieties.length === 0) {
      return NextResponse.json({ error: 'At least one variety is required' }, { status: 400 });
    }

    const product = await db.product.create({
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

    // Invalidate all product-related caches
    cache.delete('products');
    cache.delete('home-data');

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
