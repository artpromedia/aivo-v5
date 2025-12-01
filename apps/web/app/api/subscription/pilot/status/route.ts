import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

/**
 * GET /api/subscription/pilot/status
 *
 * Gets the pilot status for a specific district.
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

    // Get user with their role assignments to verify access
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        role: true,
        roles: {
          where: { districtId },
          select: { role: true, districtId: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has permission to view this district's pilot status
    const allowedRoles = ['SUPER_ADMIN', 'GLOBAL_ADMIN', 'DISTRICT_ADMIN', 'SCHOOL_ADMIN'];
    const hasPermission =
      allowedRoles.includes(user.role) ||
      user.roles.some((r) => allowedRoles.includes(r.role) && r.districtId === districtId);

    if (!hasPermission) {
      return NextResponse.json(
        { error: "You do not have permission to view this district's pilot status" },
        { status: 403 },
      );
    }

    // Get the district with pilot info
    const district = await prisma.district.findUnique({
      where: { id: districtId },
      select: {
        id: true,
        name: true,
        subscriptionStatus: true,
        subscriptionTier: true,
        pilotStartedAt: true,
        pilotEndsAt: true,
        pilotCancelledAt: true,
        pilotInitiatedById: true,
        subscriptionStartedAt: true,
        subscriptionEndsAt: true,
        stripeCustomerId: true,
        maxLearners: true,
        maxSchools: true,
        _count: {
          select: {
            learners: true,
            schools: true,
          },
        },
      },
    });

    if (!district) {
      return NextResponse.json({ error: 'District not found' }, { status: 404 });
    }

    // Check if pilot has expired and update status
    if (
      district.subscriptionStatus === 'PILOT_ACTIVE' &&
      district.pilotEndsAt &&
      new Date(district.pilotEndsAt) < new Date()
    ) {
      // Auto-expire the pilot
      await prisma.$transaction([
        prisma.district.update({
          where: { id: districtId },
          data: {
            subscriptionStatus: 'PILOT_EXPIRED',
            subscriptionTier: 'FREE',
          },
        }),
        prisma.pilotUsedDistrict.upsert({
          where: { districtId },
          update: { reason: 'EXPIRED' },
          create: {
            districtId,
            initiatedBy: district.pilotInitiatedById,
            reason: 'EXPIRED',
          },
        }),
      ]);

      district.subscriptionStatus = 'PILOT_EXPIRED';
      district.subscriptionTier = 'FREE';
    }

    // Check if district has already used a pilot
    const usedPilot = await prisma.pilotUsedDistrict.findUnique({
      where: { districtId },
    });

    // Calculate days remaining
    let daysRemaining = 0;
    if (district.pilotEndsAt && district.subscriptionStatus === 'PILOT_ACTIVE') {
      const now = new Date();
      const endDate = new Date(district.pilotEndsAt);
      const diffTime = endDate.getTime() - now.getTime();
      daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    }

    return NextResponse.json({
      districtId: district.id,
      districtName: district.name,
      status: district.subscriptionStatus,
      tier: district.subscriptionTier,
      pilotStartedAt: district.pilotStartedAt,
      pilotEndsAt: district.pilotEndsAt,
      pilotCancelledAt: district.pilotCancelledAt,
      subscriptionStartedAt: district.subscriptionStartedAt,
      subscriptionEndsAt: district.subscriptionEndsAt,
      stripeCustomerId: district.stripeCustomerId,
      maxLearners: district.maxLearners,
      maxSchools: district.maxSchools,
      currentLearners: district._count.learners,
      currentSchools: district._count.schools,
      daysRemaining,
      hasUsedPilot: !!usedPilot,
      isInPilot: district.subscriptionStatus === 'PILOT_ACTIVE',
      canAccessPlatform:
        district.subscriptionStatus === 'PILOT_ACTIVE' || district.subscriptionStatus === 'ACTIVE',
      requiresPayment:
        district.subscriptionStatus === 'PILOT_EXPIRED' ||
        district.subscriptionStatus === 'PILOT_CANCELLED' ||
        district.subscriptionStatus === 'PAST_DUE' ||
        district.subscriptionStatus === 'CANCELLED' ||
        district.subscriptionStatus === 'EXPIRED',
    });
  } catch (error) {
    console.error('Error getting district pilot status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
