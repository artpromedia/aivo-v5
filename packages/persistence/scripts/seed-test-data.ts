/**
 * Seed script for testing persistence layer
 * Run with: npx ts-node scripts/seed-test-data.ts
 */
import { prisma } from "../src/client";

async function main() {
  console.log("🌱 Seeding test data...");

  // Create a test tenant
  const tenant = await prisma.tenant.upsert({
    where: { id: "tenant-test-1" },
    update: {},
    create: {
      id: "tenant-test-1",
      type: "district",
      name: "Demo School District",
      region: "north_america",
      isActive: true
    }
  });
  console.log(`✅ Created tenant: ${tenant.name}`);

  // Create tenant config
  await prisma.tenantConfig.upsert({
    where: { tenantId: tenant.id },
    update: {},
    create: {
      tenantId: tenant.id,
      defaultRegion: "north_america",
      allowedProviders: ["openai", "anthropic"],
      dataResidency: "us",
      curricula: [
        {
          id: "curr-1",
          label: "US Common Core",
          region: "north_america",
          standard: "us_common_core",
          subjects: ["math", "ela", "reading"]
        }
      ]
    }
  });
  console.log("✅ Created tenant config");

  // Create a district
  const district = await prisma.district.upsert({
    where: { id: "district-test-1" },
    update: {},
    create: {
      id: "district-test-1",
      tenantId: tenant.id,
      name: "Central District",
      country: "USA"
    }
  });
  console.log(`✅ Created district: ${district.name}`);

  // Create a school
  const school = await prisma.school.upsert({
    where: { id: "school-test-1" },
    update: {},
    create: {
      id: "school-test-1",
      tenantId: tenant.id,
      districtId: district.id,
      name: "Lincoln Elementary",
      city: "Springfield"
    }
  });
  console.log(`✅ Created school: ${school.name}`);

  // Create a test user (parent/guardian)
  const guardian = await prisma.user.upsert({
    where: { email: "parent@test.local" },
    update: {},
    create: {
      id: "user-guardian-1",
      email: "parent@test.local",
      name: "Jane Parent",
      tenantId: tenant.id
    }
  });
  console.log(`✅ Created guardian user: ${guardian.name}`);

  // Create role assignment for guardian
  await prisma.roleAssignment.upsert({
    where: { userId_tenantId: { userId: guardian.id, tenantId: tenant.id } },
    update: {},
    create: {
      userId: guardian.id,
      tenantId: tenant.id,
      role: "parent"
    }
  });

  // Create a test teacher
  const teacher = await prisma.user.upsert({
    where: { email: "teacher@test.local" },
    update: {},
    create: {
      id: "user-teacher-1",
      email: "teacher@test.local",
      name: "Mr. Smith",
      tenantId: tenant.id
    }
  });
  console.log(`✅ Created teacher user: ${teacher.name}`);

  await prisma.roleAssignment.upsert({
    where: { userId_tenantId: { userId: teacher.id, tenantId: tenant.id } },
    update: {},
    create: {
      userId: teacher.id,
      tenantId: tenant.id,
      districtId: district.id,
      schoolId: school.id,
      role: "teacher"
    }
  });

  // Create a test learner
  const learner = await prisma.learner.upsert({
    where: { id: "learner-test-1" },
    update: {},
    create: {
      id: "learner-test-1",
      tenantId: tenant.id,
      ownerId: guardian.id,
      displayName: "Sam Student",
      currentGrade: 5,
      region: "north_america"
    }
  });
  console.log(`✅ Created learner: ${learner.displayName}`);

  // Create brain profile for learner
  await prisma.brainProfile.upsert({
    where: { learnerId: learner.id },
    update: {},
    create: {
      learnerId: learner.id,
      region: "north_america",
      currentGrade: 5,
      gradeBand: "k_5",
      subjectLevels: [
        { subject: "math", enrolledGrade: 5, assessedGradeLevel: 4, masteryScore: 0.72 },
        { subject: "ela", enrolledGrade: 5, assessedGradeLevel: 5, masteryScore: 0.85 }
      ],
      neurodiversity: {
        adhd: true,
        prefersLowStimulusUI: true
      },
      preferences: {
        prefersShortSessions: true,
        prefersStepByStep: true
      }
    }
  });
  console.log("✅ Created brain profile");

  console.log("\n🎉 Seed complete! Test data ready.");
  console.log("\nTest IDs:");
  console.log(`  Tenant: ${tenant.id}`);
  console.log(`  District: ${district.id}`);
  console.log(`  School: ${school.id}`);
  console.log(`  Learner: ${learner.id}`);
  console.log(`  Guardian: ${guardian.id}`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
