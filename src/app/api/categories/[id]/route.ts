import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Fetch single category
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const category = await db.category.findUnique({ where: { id } });
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }
    return NextResponse.json(category);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch category' }, { status: 500 });
  }
}

// PUT - Update category
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const code = formData.get('code') as string;
    const imageUrl = formData.get('imageUrl') as string | null;

    if (!name || !code) {
      return NextResponse.json({ error: 'Name and code are required' }, { status: 400 });
    }

    const existing = await db.category.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    // Check code uniqueness
    const duplicate = await db.category.findUnique({ where: { code } });
    if (duplicate && duplicate.id !== id) {
      return NextResponse.json({ error: 'Code already exists' }, { status: 400 });
    }

    // Keep existing imageUrl if not provided (null from formData means "not sent")
    const finalImageUrl = imageUrl !== null ? imageUrl : existing.imageUrl;

    const category = await db.category.update({
      where: { id },
      data: { name, code, imageUrl: finalImageUrl },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error('Update error:', error);
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }
}

// DELETE - Delete category
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const existing = await db.category.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    await db.category.delete({ where: { id } });
    return NextResponse.json({ message: 'Category deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
