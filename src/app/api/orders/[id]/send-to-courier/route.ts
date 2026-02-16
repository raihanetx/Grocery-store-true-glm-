import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createOrder } from '@/lib/steadfast';

export const dynamic = 'force-dynamic';

// POST - Send order to Steadfast Courier
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get order details
    const order = await db.order.findUnique({
      where: { id },
      include: { items: true },
    });
    
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }
    
    // Check if already sent to courier
    if (order.consignmentId) {
      return NextResponse.json(
        { error: 'Order already sent to courier' },
        { status: 400 }
      );
    }
    
    // Check order status
    if (order.status !== 'approved') {
      return NextResponse.json(
        { error: 'Order must be approved before sending to courier' },
        { status: 400 }
      );
    }
    
    // Build item description
    const itemDescription = order.items
      .map((item) => `${item.productName}${item.varietyName ? ` (${item.varietyName})` : ''} x${item.quantity}`)
      .join(', ');
    
    // Create order in Steadfast
    const steadfastResponse = await createOrder({
      invoice: order.invoice,
      recipient_name: order.customerName,
      recipient_phone: order.customerPhone,
      recipient_address: order.customerAddress,
      cod_amount: order.total,
      note: order.adminNote || undefined,
      item_description: itemDescription,
      delivery_type: 0, // Home delivery
    });
    
    if (steadfastResponse.status !== 200 || !steadfastResponse.consignment) {
      return NextResponse.json(
        { error: steadfastResponse.message || 'Failed to create order in Steadfast' },
        { status: 400 }
      );
    }
    
    // Update order with courier details
    const updatedOrder = await db.order.update({
      where: { id },
      data: {
        consignmentId: steadfastResponse.consignment.consignment_id.toString(),
        trackingCode: steadfastResponse.consignment.tracking_code,
        courierStatus: steadfastResponse.consignment.status,
        status: 'processing',
        trackingMessage: 'Order sent to Steadfast Courier',
      },
      include: { items: true },
    });
    
    return NextResponse.json({
      success: true,
      message: 'Order sent to Steadfast Courier successfully',
      order: updatedOrder,
      consignment: steadfastResponse.consignment,
    });
  } catch (error) {
    console.error('Error sending order to courier:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send order to courier' },
      { status: 500 }
    );
  }
}
