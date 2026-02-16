import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cache } from '@/lib/cache';

export const dynamic = 'force-dynamic';

// GET - Fetch all categories (with cache)
export async function GET() {
  try {
    // Check cache first
    const cached = cache.get<any[]>('categories');
    if (cached) {
      return NextResponse.json(cached);
    }

    const categories = await db.category.findMany({
      select: {
        id: true,
        name: true,
        code: true,
        imageUrl: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Cache for 60 seconds
    cache.set('categories', categories, 60000);

    return NextResponse.json(categories);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

// POST - Create a new category
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const code = formData.get('code') as string;
    const imageUrl = formData.get('imageUrl') as string | null;

    if (!name || !code) {
      return NextResponse.json({ error: 'Name and code are required' }, { status: 400 });
    }

    const existing = await db.category.findUnique({ where: { code } });
    if (existing) {
      return NextResponse.json({ error: 'Code already exists' }, { status: 400 });
    }

    const category = await db.category.create({
      data: { name, code, imageUrl: imageUrl || null },
    });

    // Invalidate all category-related caches
    cache.delete('categories');
    cache.delete('home-data');

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}
