import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Fetch all tracking data for admin
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const visitorId = searchParams.get('visitorId');

    if (visitorId) {
      // Get sessions for specific visitor
      const sessions = await db.checkoutSession.findMany({
        where: { visitor: { visitorId } },
        include: { visitor: true },
        orderBy: { entryTime: 'desc' },
      });
      return NextResponse.json({ sessions });
    }

    // Get all sessions with visitor info
    const sessions = await db.checkoutSession.findMany({
      include: { visitor: true },
      orderBy: { entryTime: 'desc' },
      take: 100,
    });

    // Get all visitors
    const visitors = await db.visitor.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ sessions, visitors });
  } catch (error) {
    console.error('Fetch tracking data error:', error);
    return NextResponse.json({ error: 'Failed to fetch tracking data' }, { status: 500 });
  }
}

// Force reload for new Prisma models
export const dynamic = 'force-dynamic';
