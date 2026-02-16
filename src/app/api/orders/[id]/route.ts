import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

// GET single order by ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });
    
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}

// PUT update order
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const {
      status,
      adminNote,
      courierStatus,
      trackingCode,
      consignmentId,
      trackingMessage,
    } = body;
    
    // Build update data
    const updateData: any = {};
    
    if (status) {
      updateData.status = status;
      if (status === 'approved') {
        updateData.approvedAt = new Date();
      }
      if (status === 'delivered') {
        updateData.deliveredAt = new Date();
      }
    }
    
    if (adminNote !== undefined) {
      updateData.adminNote = adminNote;
    }
    
    if (courierStatus !== undefined) {
      updateData.courierStatus = courierStatus;
    }
    
    if (trackingCode !== undefined) {
      updateData.trackingCode = trackingCode;
    }
    
    if (consignmentId !== undefined) {
      updateData.consignmentId = consignmentId;
    }
    
    if (trackingMessage !== undefined) {
      updateData.trackingMessage = trackingMessage;
    }
    
    const order = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        items: true,
      },
    });
    
    return NextResponse.json(order);
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}

// DELETE order
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // First delete order items
    await prisma.orderItem.deleteMany({
      where: { orderId: id },
    });
    
    // Then delete order
    await prisma.order.delete({
      where: { id },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting order:', error);
    return NextResponse.json(
      { error: 'Failed to delete order' },
      { status: 500 }
    );
  }
}
