import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getStatusByConsignmentId, getStatusByInvoice, getStatusByTrackingCode } from '@/lib/steadfast';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

// GET - Track order status from Steadfast Courier
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get order details
    const order = await prisma.order.findUnique({
      where: { id },
    });
    
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }
    
    // Check if order has been sent to courier
    if (!order.consignmentId && !order.trackingCode) {
      return NextResponse.json(
        { error: 'Order has not been sent to courier yet' },
        { status: 400 }
      );
    }
    
    let statusResponse;
    
    // Try different methods to get status
    if (order.consignmentId) {
      try {
        statusResponse = await getStatusByConsignmentId(order.consignmentId);
      } catch (e) {
        // Fallback to invoice
        statusResponse = await getStatusByInvoice(order.invoice);
      }
    } else if (order.trackingCode) {
      statusResponse = await getStatusByTrackingCode(order.trackingCode);
    } else {
      statusResponse = await getStatusByInvoice(order.invoice);
    }
    
    // Update order with latest status
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        courierStatus: statusResponse.delivery_status,
        // If delivered, update order status
        ...(statusResponse.delivery_status === 'delivered' && {
          status: 'delivered',
          deliveredAt: new Date(),
        }),
        // If cancelled, update order status
        ...(statusResponse.delivery_status === 'cancelled' && {
          status: 'cancelled',
        }),
      },
      include: { items: true },
    });
    
    return NextResponse.json({
      order: updatedOrder,
      deliveryStatus: statusResponse.delivery_status,
    });
  } catch (error) {
    console.error('Error tracking order:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to track order' },
      { status: 500 }
    );
  }
}
