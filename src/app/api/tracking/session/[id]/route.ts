import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Force reload for new Prisma models
export const dynamic = 'force-dynamic';

// GET - Get session details
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    const session = await db.checkoutSession.findUnique({
      where: { id },
      include: { visitor: true },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json({ session });
  } catch (error) {
    console.error('Get session error:', error);
    return NextResponse.json({ error: 'Failed to get session' }, { status: 500 });
  }
}

// PUT - Complete order or end session
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, customerName, customerPhone, customerAddress } = body;

    const session = await db.checkoutSession.findUnique({
      where: { id },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const now = new Date();
    const timeSpent = Math.floor((now.getTime() - new Date(session.entryTime).getTime()) / 1000);

    if (action === 'complete') {
      // Order was placed
      const updatedSession = await db.checkoutSession.update({
        where: { id },
        data: {
          orderCompleted: true,
          orderPlacedAt: now,
          exitTime: now,
          timeSpent,
          customerName,
          customerPhone,
          customerAddress,
        },
      });

      // Update visitor info if provided
      if (customerName || customerPhone) {
        const visitor = await db.visitor.findUnique({
          where: { id: session.visitorId },
        });

        if (visitor && (!visitor.name || !visitor.phone)) {
          await db.visitor.update({
            where: { id: session.visitorId },
            data: {
              ...(customerName && !visitor.name && { name: customerName }),
              ...(customerPhone && !visitor.phone && { phone: customerPhone }),
            },
          });
        }
      }

      return NextResponse.json({ session: updatedSession });
    } else if (action === 'end') {
      // User left checkout without completing
      const updatedSession = await db.checkoutSession.update({
        where: { id },
        data: {
          exitTime: now,
          timeSpent,
          customerName,
          customerPhone,
          customerAddress,
        },
      });

      // Update visitor info if provided
      if (customerName || customerPhone) {
        const visitor = await db.visitor.findUnique({
          where: { id: session.visitorId },
        });

        if (visitor && (!visitor.name || !visitor.phone)) {
          await db.visitor.update({
            where: { id: session.visitorId },
            data: {
              ...(customerName && !visitor.name && { name: customerName }),
              ...(customerPhone && !visitor.phone && { phone: customerPhone }),
            },
          });
        }
      }

      return NextResponse.json({ session: updatedSession });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Update session error:', error);
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
  }
}
