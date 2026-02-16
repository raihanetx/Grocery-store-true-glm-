import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET analytics data
export async function GET() {
  try {
    // Check what models are available
    console.log('Available db models:', Object.keys(db));

    // Get all visitors with their sessions
    const visitors = await db.visitor.findMany({
      include: {
        sessions: true,
      },
    });

    // Calculate visitor stats
    const uniqueVisitors = visitors.filter(v => v.sessions.length === 1);
    const repeatVisitors = visitors.filter(v => v.sessions.length > 1);
    const totalVisitors = uniqueVisitors.length + repeatVisitors.length;

    // Timeline stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    const todayVisitors = visitors.filter(v => new Date(v.createdAt) >= today).length;
    const weekVisitors = visitors.filter(v => new Date(v.createdAt) >= weekAgo).length;
    const monthVisitors = visitors.filter(v => new Date(v.createdAt) >= monthAgo).length;

    // Most Viewed Products - use raw query as fallback
    let mostViewed: { id: string; name: string; image: string | null; views: number }[] = [];
    try {
      const productViews = await db.$queryRaw<{ productId: string; count: bigint }[]>`
        SELECT productId, COUNT(*) as count FROM ProductView GROUP BY productId ORDER BY count DESC LIMIT 10
      `;

      const viewedProductIds = productViews.map(pv => pv.productId);
      const viewedProducts = viewedProductIds.length > 0 ? await db.product.findMany({
        where: { id: { in: viewedProductIds } },
        include: { images: { take: 1 } },
      }) : [];

      mostViewed = productViews.map(pv => {
        const product = viewedProducts.find(p => p.id === pv.productId);
        return {
          id: pv.productId,
          name: product?.name || 'Unknown',
          image: product?.images[0]?.url || null,
          views: Number(pv.count),
        };
      });
    } catch (e) {
      console.log('ProductView query failed, table might not exist:', e);
    }

    // Most Added to Cart Products - use raw query as fallback
    let mostCartAdded: { id: string; name: string; image: string | null; count: number; quantity: number }[] = [];
    try {
      const cartAdds = await db.$queryRaw<{ productId: string; count: bigint; totalQty: bigint | null }[]>`
        SELECT productId, COUNT(*) as count, SUM(quantity) as totalQty FROM CartAdd GROUP BY productId ORDER BY count DESC LIMIT 10
      `;

      const cartProductIds = cartAdds.map(ca => ca.productId);
      const cartProducts = cartProductIds.length > 0 ? await db.product.findMany({
        where: { id: { in: cartProductIds } },
        include: { images: { take: 1 } },
      }) : [];

      mostCartAdded = cartAdds.map(ca => {
        const product = cartProducts.find(p => p.id === ca.productId);
        return {
          id: ca.productId,
          name: product?.name || 'Unknown',
          image: product?.images[0]?.url || null,
          count: Number(ca.count),
          quantity: Number(ca.totalQty || 0),
        };
      });
    } catch (e) {
      console.log('CartAdd query failed, table might not exist:', e);
    }

    // Most Checkout Products (from OrderItem)
    let mostCheckout: { id: string | null; name: string; image: string | null; orders: number; quantity: number }[] = [];
    try {
      const orderItems = await db.orderItem.groupBy({
        by: ['productId'],
        _count: { id: true },
        _sum: { quantity: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      });

      const checkoutProductIds = orderItems.filter(oi => oi.productId).map(oi => oi.productId as string);
      const checkoutProducts = checkoutProductIds.length > 0 ? await db.product.findMany({
        where: { id: { in: checkoutProductIds } },
        include: { images: { take: 1 } },
      }) : [];

      mostCheckout = orderItems
        .filter(oi => oi.productId)
        .map(oi => {
          const product = checkoutProducts.find(p => p.id === oi.productId);
          return {
            id: oi.productId,
            name: product?.name || oi.productId || 'Unknown',
            image: product?.images[0]?.url || null,
            orders: oi._count.id,
            quantity: oi._sum.quantity || 0,
          };
        });
    } catch (e) {
      console.log('OrderItem query failed:', e);
    }

    return NextResponse.json({
      stats: {
        total: totalVisitors,
        unique: uniqueVisitors.length,
        repeat: repeatVisitors.length,
        today: todayVisitors,
        week: weekVisitors,
        month: monthVisitors,
      },
      mostViewed,
      mostCartAdded,
      mostCheckout,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
