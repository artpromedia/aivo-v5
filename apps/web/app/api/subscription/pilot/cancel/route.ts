import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

/**
 * POST /api/subscription/pilot/cancel
 *
 * Cancels a district pilot.
 * Only DISTRICT_ADMIN or higher roles can cancel a pilot.
 * Records the district in PilotUsedDistrict to prevent future pilots.
 */
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { districtId, reason } = body;

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

    // Check if user has permission to cancel a pilot for this district
    const allowedRoles = ['SUPER_ADMIN', 'GLOBAL_ADMIN', 'DISTRICT_ADMIN'];
    const hasPermission =
      allowedRoles.includes(user.role) ||
      user.roles.some((r) => allowedRoles.includes(r.role) && r.districtId === districtId);

    if (!hasPermission) {
      return NextResponse.json(
        { error: "You do not have permission to cancel this district's pilot" },
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
        pilotInitiatedById: true,
      },
    });

    if (!district) {
      return NextResponse.json({ error: 'District not found' }, { status: 404 });
    }

    // Check if district has an active pilot to cancel
    if (district.subscriptionStatus !== 'PILOT_ACTIVE') {
      return NextResponse.json(
        { error: 'This district does not have an active pilot to cancel' },
        { status: 400 },
      );
    }

    // Cancel the pilot and record in PilotUsedDistrict
    await prisma.$transaction([
      prisma.district.update({
        where: { id: districtId },
        data: {
          subscriptionStatus: 'PILOT_CANCELLED',
          subscriptionTier: 'FREE',
          pilotCancelledAt: new Date(),
        },
      }),
      prisma.pilotUsedDistrict.upsert({
        where: { districtId },
        update: {
          reason: reason || 'CANCELLED',
          usedAt: new Date(),
        },
        create: {
          districtId,
          initiatedBy: district.pilotInitiatedById,
          reason: reason || 'CANCELLED',
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: 'District pilot cancelled successfully',
      districtId,
      districtName: district.name,
    });
  } catch (error) {
    console.error('Error cancelling district pilot:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
