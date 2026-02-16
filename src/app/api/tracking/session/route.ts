import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Force reload for new Prisma models
export const dynamic = 'force-dynamic';

// POST - Create new checkout session (called when checkout page loads)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { visitorId, cartItems, subtotal, appliedCoupons, discountAmount } = body;

    if (!visitorId) {
      return NextResponse.json({ error: 'Visitor ID is required' }, { status: 400 });
    }

    // Verify visitor exists
    const visitor = await db.visitor.findUnique({
      where: { visitorId },
    });

    if (!visitor) {
      return NextResponse.json({ error: 'Visitor not found' }, { status: 404 });
    }

    // Create new session - entry time is set automatically to now()
    const session = await db.checkoutSession.create({
      data: {
        visitorId: visitor.id,
        cartItems: JSON.stringify(cartItems || []),
        subtotal: subtotal || 0,
        appliedCoupons: appliedCoupons ? JSON.stringify(appliedCoupons) : null,
        discountAmount: discountAmount || 0,
        entryTime: new Date(), // Instant - no delay
      },
    });

    return NextResponse.json({ session }, { status: 201 });
  } catch (error) {
    console.error('Create session error:', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}

// PUT - Update session (instant form data saving)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, customerName, customerPhone, customerAddress, appliedCoupons, discountAmount, subtotal } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    
    // Only update fields that are provided
    if (customerName !== undefined) updateData.customerName = customerName;
    if (customerPhone !== undefined) updateData.customerPhone = customerPhone;
    if (customerAddress !== undefined) updateData.customerAddress = customerAddress;
    if (appliedCoupons !== undefined) updateData.appliedCoupons = JSON.stringify(appliedCoupons);
    if (discountAmount !== undefined) updateData.discountAmount = discountAmount;
    if (subtotal !== undefined) updateData.subtotal = subtotal;

    const session = await db.checkoutSession.update({
      where: { id: sessionId },
      data: updateData,
    });

    return NextResponse.json({ session });
  } catch (error) {
    console.error('Update session error:', error);
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
  }
}
