import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

/**
 * GET /api/subscription/pilot/check
 *
 * Checks if a district can start a new pilot.
 * Query params: districtId (required)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const districtId = searchParams.get('districtId');

    if (!districtId) {
      return NextResponse.json({ error: 'District ID is required' }, { status: 400 });
    }

    // Get the district
    const district = await prisma.district.findUnique({
      where: { id: districtId },
      select: {
        id: true,
        name: true,
        subscriptionStatus: true,
        subscriptionTier: true,
      },
    });

    if (!district) {
      return NextResponse.json({ error: 'District not found' }, { status: 404 });
    }

    // Check if district already has an active pilot or subscription
    if (district.subscriptionStatus === 'PILOT_ACTIVE') {
      return NextResponse.json({
        canStartPilot: false,
        reason: 'This district already has an active pilot',
        existingSubscription: {
          status: district.subscriptionStatus,
          tier: district.subscriptionTier,
        },
      });
    }

    if (district.subscriptionStatus === 'ACTIVE') {
      return NextResponse.json({
        canStartPilot: false,
        reason: 'This district already has an active subscription',
        existingSubscription: {
          status: district.subscriptionStatus,
          tier: district.subscriptionTier,
        },
      });
    }

    // Check if district has already used a pilot
    const usedDistrict = await prisma.pilotUsedDistrict.findUnique({
      where: { districtId },
    });

    if (usedDistrict) {
      return NextResponse.json({
        canStartPilot: false,
        reason: 'This district has already used a pilot. Please contact sales to subscribe.',
        existingSubscription: {
          status: district.subscriptionStatus,
          tier: district.subscriptionTier,
        },
      });
    }

    return NextResponse.json({
      canStartPilot: true,
      districtName: district.name,
    });
  } catch (error) {
    console.error('Error checking district pilot eligibility:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
