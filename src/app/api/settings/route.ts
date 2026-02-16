import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cache } from '@/lib/cache';

export const dynamic = 'force-dynamic';

// Default settings
const defaultSettings = {
  id: 'site-settings',
  deliveryCharge: 60,
  facebook: null,
  messenger: null,
  whatsapp: null,
  phone: null,
  storeName: 'Lumina Grocery',
  storeLogo: null,
  storeFavicon: null,
  aboutUs: null,
  privacyPolicy: null,
  termsCondition: null,
  refundPolicy: null,
};

// GET - Fetch site settings
export async function GET() {
  try {
    // Check cache first
    const cached = cache.get('site-settings');
    if (cached) {
      return NextResponse.json(cached);
    }

    let settings = await db.siteSettings.findUnique({
      where: { id: 'site-settings' },
    });

    // Create default settings if not exists
    if (!settings) {
      settings = await db.siteSettings.create({
        data: defaultSettings,
      });
    }

    // Cache for 5 minutes
    cache.set('site-settings', settings, 300000);

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// PUT - Update site settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    // Prepare update data
    const updateData: Record<string, unknown> = {};

    // Delivery settings
    if (body.deliveryCharge !== undefined) updateData.deliveryCharge = parseFloat(body.deliveryCharge) || 0;

    // Social media & contact links
    if (body.facebook !== undefined) updateData.facebook = body.facebook || null;
    if (body.messenger !== undefined) updateData.messenger = body.messenger || null;
    if (body.whatsapp !== undefined) updateData.whatsapp = body.whatsapp || null;
    if (body.phone !== undefined) updateData.phone = body.phone || null;

    // Store info
    if (body.storeName !== undefined) updateData.storeName = body.storeName || 'Lumina Grocery';
    if (body.storeLogo !== undefined) updateData.storeLogo = body.storeLogo || null;
    if (body.storeFavicon !== undefined) updateData.storeFavicon = body.storeFavicon || null;

    // Policy content
    if (body.aboutUs !== undefined) updateData.aboutUs = body.aboutUs || null;
    if (body.privacyPolicy !== undefined) updateData.privacyPolicy = body.privacyPolicy || null;
    if (body.termsCondition !== undefined) updateData.termsCondition = body.termsCondition || null;
    if (body.refundPolicy !== undefined) updateData.refundPolicy = body.refundPolicy || null;

    // Upsert settings (create if not exists, update if exists)
    const settings = await db.siteSettings.upsert({
      where: { id: 'site-settings' },
      update: updateData,
      create: {
        id: 'site-settings',
        ...defaultSettings,
        ...updateData,
      },
    });

    // Invalidate cache
    cache.delete('site-settings');
    cache.delete('home-data');

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
