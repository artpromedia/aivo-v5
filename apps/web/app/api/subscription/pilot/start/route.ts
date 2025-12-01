import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

const PILOT_DURATION_DAYS = 90;
const DEFAULT_PILOT_MAX_LEARNERS = 500;
const DEFAULT_PILOT_MAX_SCHOOLS = 10;

/**
 * POST /api/subscription/pilot/start
 *
 * Starts a 90-day pilot for a district.
 * Only DISTRICT_ADMIN or higher roles can start a pilot.
 * Prevents pilot reuse if the district has been used before.
 */
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { districtId, maxLearners, maxSchools } = body;

    if (!districtId) {
      return NextResponse.json({ error: 'District ID is required' }, { status: 400 });
    }

    // Get user with their role assignments
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

    // Check if user has permission to start a pilot for this district
    const allowedRoles = ['SUPER_ADMIN', 'GLOBAL_ADMIN', 'DISTRICT_ADMIN'];
    const hasPermission =
      allowedRoles.includes(user.role) ||
      user.roles.some((r) => allowedRoles.includes(r.role) && r.districtId === districtId);

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'You do not have permission to start a pilot for this district' },
        { status: 403 },
      );
    }

    // Get the district
    const district = await prisma.district.findUnique({
      where: { id: districtId },
      select: {
        id: true,
        name: true,
        subscriptionStatus: true,
        pilotStartedAt: true,
        pilotEndsAt: true,
      },
    });

    if (!district) {
      return NextResponse.json({ error: 'District not found' }, { status: 404 });
    }

    // Check if district already has an active pilot or subscription
    if (district.subscriptionStatus === 'PILOT_ACTIVE') {
      return NextResponse.json(
        { error: 'This district already has an active pilot' },
        { status: 400 },
      );
    }

    if (district.subscriptionStatus === 'ACTIVE') {
      return NextResponse.json(
        { error: 'This district already has an active subscription' },
        { status: 400 },
      );
    }

    // Check if district has been used for a pilot before
    const usedDistrict = await prisma.pilotUsedDistrict.findUnique({
      where: { districtId },
    });

    if (usedDistrict) {
      return NextResponse.json(
        {
          error: 'This district has already used a pilot. Please contact sales to subscribe.',
          code: 'PILOT_ALREADY_USED',
        },
        { status: 403 },
      );
    }

    // Calculate pilot end date
    const pilotStartedAt = new Date();
    const pilotEndsAt = new Date();
    pilotEndsAt.setDate(pilotEndsAt.getDate() + PILOT_DURATION_DAYS);

    // Start the pilot
    await prisma.district.update({
      where: { id: districtId },
      data: {
        subscriptionStatus: 'PILOT_ACTIVE',
        subscriptionTier: 'ENTERPRISE', // Give full enterprise access during pilot
        pilotStartedAt,
        pilotEndsAt,
        pilotInitiatedById: user.id,
        maxLearners: maxLearners ?? DEFAULT_PILOT_MAX_LEARNERS,
        maxSchools: maxSchools ?? DEFAULT_PILOT_MAX_SCHOOLS,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'District pilot started successfully',
      districtId,
      districtName: district.name,
      pilotStartedAt,
      pilotEndsAt,
      daysRemaining: PILOT_DURATION_DAYS,
      maxLearners: maxLearners ?? DEFAULT_PILOT_MAX_LEARNERS,
      maxSchools: maxSchools ?? DEFAULT_PILOT_MAX_SCHOOLS,
    });
  } catch (error) {
    console.error('Error starting district pilot:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
