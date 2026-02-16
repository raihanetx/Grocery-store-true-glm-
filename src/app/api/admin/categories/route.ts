import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Fetch all categories for admin
export async function GET() {
  try {
    const categories = await db.category.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(categories);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}
