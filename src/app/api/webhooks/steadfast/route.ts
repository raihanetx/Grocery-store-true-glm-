import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Steadfast Webhook Handler
 * 
 * Handles two types of notifications:
 * 1. delivery_status - Delivery status updates
 * 2. tracking_update - Tracking updates
 * 
 * Webhook payload examples:
 * 
 * Delivery Status:
 * {
 *   "notification_type": "delivery_status",
 *   "consignment_id": 12345,
 *   "invoice": "INV-67890",
 *   "cod_amount": 1500.00,
 *   "status": "Delivered",
 *   "delivery_charge": 100.00,
 *   "tracking_message": "Your package has been delivered successfully.",
 *   "updated_at": "2025-03-02 12:45:30"
 * }
 * 
 * Tracking Update:
 * {
 *   "notification_type": "tracking_update",
 *   "consignment_id": 12345,
 *   "invoice": "INV-67890",
 *   "tracking_message": "Package arrived at the sorting center.",
 *   "updated_at": "2025-03-02 13:15:00"
 * }
 */

interface WebhookPayload {
  notification_type: 'delivery_status' | 'tracking_update';
  consignment_id: number;
  invoice: string;
  cod_amount?: number;
  status?: string;
  delivery_charge?: number;
  tracking_message: string;
  updated_at: string;
}

// POST - Handle Steadfast webhook
export async function POST(request: Request) {
  try {
    const body: WebhookPayload = await request.json();
    
    console.log('Steadfast Webhook received:', JSON.stringify(body, null, 2));
    
    // Find order by invoice or consignment ID
    const order = await db.order.findFirst({
      where: {
        OR: [
          { invoice: body.invoice },
          { consignmentId: body.consignment_id.toString() },
        ],
      },
    });
    
    if (!order) {
      console.log(`Order not found for invoice: ${body.invoice}`);
      return NextResponse.json(
        { status: 'error', message: 'Order not found' },
        { status: 404 }
      );
    }
    
    // Handle different notification types
    if (body.notification_type === 'delivery_status') {
      // Normalize status to lowercase
      const courierStatus = body.status?.toLowerCase() || 'unknown';
      
      // Update order with delivery status
      await db.order.update({
        where: { id: order.id },
        data: {
          courierStatus,
          trackingMessage: body.tracking_message,
          // Update order status based on courier status
          ...(courierStatus === 'delivered' && {
            status: 'delivered',
            deliveredAt: new Date(),
          }),
          ...(courierStatus === 'cancelled' && {
            status: 'cancelled',
          }),
          ...(courierStatus === 'partial_delivered' && {
            status: 'partial_delivered',
          }),
        },
      });
      
      console.log(`Order ${order.invoice} updated with status: ${courierStatus}`);
    } else if (body.notification_type === 'tracking_update') {
      // Just update tracking message
      await db.order.update({
        where: { id: order.id },
        data: {
          trackingMessage: body.tracking_message,
        },
      });
      
      console.log(`Order ${order.invoice} tracking updated: ${body.tracking_message}`);
    }
    
    return NextResponse.json({
      status: 'success',
      message: 'Webhook received successfully.',
    });
  } catch (error) {
    console.error('Error processing Steadfast webhook:', error);
    return NextResponse.json(
      { status: 'error', message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Health check for webhook endpoint
export async function GET() {
  return NextResponse.json({
    status: 'success',
    message: 'Steadfast webhook endpoint is active',
    timestamp: new Date().toISOString(),
  });
}
