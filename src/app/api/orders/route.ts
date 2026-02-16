import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateInvoice } from '@/lib/steadfast';

export const dynamic = 'force-dynamic';

// GET all orders
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    
    let where: any = {};
    
    if (status && status !== 'all') {
      where.status = status;
    }
    
    if (search) {
      where.OR = [
        { invoice: { contains: search } },
        { customerName: { contains: search } },
        { customerPhone: { contains: search } },
        { trackingCode: { contains: search } },
      ];
    }
    
    const orders = await db.order.findMany({
      where,
      include: {
        items: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

// POST create new order
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const {
      customerName,
      customerPhone,
      customerEmail,
      customerAddress,
      items,
      subtotal,
      discount,
      deliveryCharge,
      total,
      appliedCoupons,
    } = body;
    
    // Validate required fields
    if (!customerName || !customerPhone || !customerAddress) {
      return NextResponse.json(
        { error: 'Customer name, phone, and address are required' },
        { status: 400 }
      );
    }
    
    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'Order must have at least one item' },
        { status: 400 }
      );
    }
    
    // Generate unique invoice number
    const invoice = generateInvoice();
    
    // Create order with items
    const order = await db.order.create({
      data: {
        invoice,
        customerName,
        customerPhone,
        customerEmail: customerEmail || null,
        customerAddress,
        subtotal: parseFloat(subtotal) || 0,
        discount: parseFloat(discount) || 0,
        deliveryCharge: parseFloat(deliveryCharge) || 60,
        total: parseFloat(total) || 0,
        status: 'pending',
        paymentStatus: 'cod',
        items: {
          create: items.map((item: any) => ({
            productId: item.productId || null,
            productName: item.name,
            varietyName: item.subtitle || null,
            price: parseFloat(item.price) || 0,
            quantity: parseInt(item.quantity) || 1,
            total: (parseFloat(item.price) || 0) * (parseInt(item.quantity) || 1),
          })),
        },
      },
      include: {
        items: true,
      },
    });
    
    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}
