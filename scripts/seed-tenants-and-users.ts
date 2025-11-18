import { prisma } from "@aivo/persistence";

async function main() {
  // Seed a demo tenant matching the IDs used in mock auth
  const tenant1 = await prisma.tenant.upsert({
    where: { id: "tenant-1" },
    update: {},
    create: {
      id: "tenant-1",
      type: "district",
      name: "Sunrise Unified School District",
      region: "north_america",
      isActive: true
    }
  });

  const platformTenant = await prisma.tenant.upsert({
    where: { id: "platform-tenant" },
    update: {},
    create: {
      id: "platform-tenant",
      type: "platform",
      name: "AIVO Platform",
      region: "north_america",
      isActive: true
    }
  });

  // Users matching getMockUserFromHeader
  const parentUser = await prisma.user.upsert({
    where: { id: "user-parent-1" },
    update: {},
    create: {
      id: "user-parent-1",
      email: "parent+demo@aivo.local",
      name: "Demo Parent",
      tenantId: tenant1.id
    }
  });

  const teacherUser = await prisma.user.upsert({
    where: { id: "user-teacher-1" },
    update: {},
    create: {
      id: "user-teacher-1",
      email: "teacher+demo@aivo.local",
      name: "Demo Teacher",
      tenantId: tenant1.id
    }
  });

  const districtAdminUser = await prisma.user.upsert({
    where: { id: "user-district-admin" },
    update: {},
    create: {
      id: "user-district-admin",
      email: "district-admin+demo@aivo.local",
      name: "Demo District Admin",
      tenantId: tenant1.id
    }
  });

  const platformAdminUser = await prisma.user.upsert({
    where: { id: "user-platform-admin" },
    update: {},
    create: {
      id: "user-platform-admin",
      email: "platform-admin+demo@aivo.local",
      name: "Demo Platform Admin",
      tenantId: platformTenant.id
    }
  });

  console.log("Seeded tenants:", { tenant1, platformTenant });
  console.log("Seeded users:", {
    parentUser,
    teacherUser,
    districtAdminUser,
    platformAdminUser
  });
}

main()
  .catch((err) => {
    console.error("Seed failed", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
