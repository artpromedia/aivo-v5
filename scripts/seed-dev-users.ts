import { PrismaClient } from "@prisma/client";
import { seedCoreData } from "./seed-core-data";

const prisma = new PrismaClient();

async function main() {
  const summary = await seedCoreData(prisma);
  console.log("Seeded guardian, teacher, learner, and class records", summary);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
