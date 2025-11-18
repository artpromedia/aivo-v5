import { prisma } from "@aivo/persistence";

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { id: "tenant-1" },
    update: {},
    create: {
      id: "tenant-1",
      type: "district" as any,
      name: "Sunrise Unified",
      region: "north_america" as any
    }
  });

  const parent = await prisma.user.upsert({
    where: { email: "parent@example.com" },
    update: {},
    create: {
      email: "parent@example.com",
      name: "Demo Parent",
      tenantId: tenant.id
    }
  });

  await prisma.roleAssignment.createMany({
    data: [
      {
        userId: parent.id,
        tenantId: tenant.id,
        role: "parent" as any
      }
    ],
    skipDuplicates: true
  });

  console.log("Seeded demo users");
}

main()
  .catch((err) => {
    console.error(err);
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
