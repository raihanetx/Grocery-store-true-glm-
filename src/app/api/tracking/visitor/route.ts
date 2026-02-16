import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Force reload for new Prisma models
export const dynamic = 'force-dynamic';

// POST - Get or create visitor
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { visitorToken } = body;

    // If visitor token provided, find existing visitor
    if (visitorToken) {
      const existingVisitor = await db.visitor.findUnique({
        where: { visitorId: visitorToken },
      });
      
      if (existingVisitor) {
        return NextResponse.json({ visitor: existingVisitor, isNew: false });
      }
    }

    // Create new visitor with serial number
    const lastVisitor = await db.visitor.findFirst({
      orderBy: { serialNumber: 'desc' },
    });

    const serialNumber = (lastVisitor?.serialNumber || 0) + 1;
    const visitorId = `Visitor-${serialNumber}`;

    const visitor = await db.visitor.create({
      data: {
        visitorId,
        serialNumber,
      },
    });

    return NextResponse.json({ visitor, isNew: true });
  } catch (error) {
    console.error('Create visitor error:', error);
    return NextResponse.json({ error: 'Failed to create visitor' }, { status: 500 });
  }
}

// PUT - Update visitor info (when they provide name/phone)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { visitorId, name, phone, email } = body;

    if (!visitorId) {
      return NextResponse.json({ error: 'Visitor ID is required' }, { status: 400 });
    }

    const visitor = await db.visitor.update({
      where: { visitorId },
      data: {
        ...(name && { name }),
        ...(phone && { phone }),
        ...(email && { email }),
      },
    });

    return NextResponse.json({ visitor });
  } catch (error) {
    console.error('Update visitor error:', error);
    return NextResponse.json({ error: 'Failed to update visitor' }, { status: 500 });
  }
}
