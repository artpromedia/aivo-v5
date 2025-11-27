import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🗑️  Clearing AI data...");
  
  await prisma.aIFallbackChainProvider.deleteMany();
  console.log("  ✓ Cleared fallback chain providers");
  
  await prisma.aIFallbackChain.deleteMany();
  console.log("  ✓ Cleared fallback chains");
  
  await prisma.aIUsageLog.deleteMany();
  console.log("  ✓ Cleared usage logs");
  
  await prisma.aIModel.deleteMany();
  console.log("  ✓ Cleared models");
  
  await prisma.aIProvider.deleteMany();
  console.log("  ✓ Cleared providers");
  
  console.log("\n✅ All AI data cleared!");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
