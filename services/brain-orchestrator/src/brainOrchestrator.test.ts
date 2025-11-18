import { generateLessonPlanMock } from "./brainOrchestrator";

// Tiny smoke test harness to exercise generateLessonPlanMock.
// In a full test setup, this would be a proper Jest/Vitest test file.

async function main() {
  const { plan } = generateLessonPlanMock({
    learnerId: "demo-learner",
    tenantId: "tenant-1",
    subject: "math" as any,
    region: "north_america" as any
  });

  console.log("Generated lesson plan id:", plan.id);
  console.log("Title:", plan.title);
  console.log("Blocks:", plan.blocks.length);
}

void main();
