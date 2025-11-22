import { PrismaClient } from "@prisma/client";
import { seedCoreData } from "./seed-core-data";

const prisma = new PrismaClient();

async function main() {
  const summary = await seedCoreData(prisma);
  console.log("Seed completed", summary);
}

main()
  .catch((err) => {
    console.error("Seed failed", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
