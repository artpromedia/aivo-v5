/**
 * Independent Living Skills (ILS) - Main Seed File
 * Combines all skill domains into one exportable collection
 * 
 * Total: 60 skills across 6 domains
 * - Money Management: 10 skills
 * - Cooking & Nutrition: 10 skills
 * - Transportation: 10 skills
 * - Housing & Home Care: 10 skills
 * - Health & Safety: 10 skills
 * - Community Resources: 10 skills
 */

import { PrismaClient } from '@prisma/client';
import { ILSDomain, moneyManagementSkills, cookingNutritionSkills } from './seed-ils-skills-part1';
import { transportationSkills, housingHomeCareSkills } from './seed-ils-skills-part2';
import { healthSafetySkills, communityResourcesSkills } from './seed-ils-skills-part3';

// Re-export domain constants
export { ILSDomain };

// Combine all skills
export const allILSSkills = [
  ...moneyManagementSkills,
  ...cookingNutritionSkills,
  ...transportationSkills,
  ...housingHomeCareSkills,
  ...healthSafetySkills,
  ...communityResourcesSkills,
];

// Export by domain for selective seeding
export const skillsByDomain = {
  [ILSDomain.MONEY_MANAGEMENT]: moneyManagementSkills,
  [ILSDomain.COOKING_NUTRITION]: cookingNutritionSkills,
  [ILSDomain.TRANSPORTATION]: transportationSkills,
  [ILSDomain.HOUSING_HOME_CARE]: housingHomeCareSkills,
  [ILSDomain.HEALTH_SAFETY]: healthSafetySkills,
  [ILSDomain.COMMUNITY_RESOURCES]: communityResourcesSkills,
};

// Skill type definition
export interface ILSSkillSeed {
  name: string;
  description: string;
  domain: string;
  taskAnalysisSteps: Array<{
    stepNumber: number;
    description: string;
    promptHierarchy: string[];
    criticalStep?: boolean;
  }>;
  ageAppropriateStart: number;
  ageAppropriateEnd: number;
  difficultyLevel: number;
  targetSettings: string[];
  materialsNeeded: string[];
  isCriticalSafety: boolean;
  communityRelevance: number;
  employmentRelevance: number;
}

/**
 * Seed ILS skills to database
 * Run after: pnpm prisma generate
 */
export async function seedILSSkills(prisma?: PrismaClient) {
  const client = prisma || new PrismaClient();
  
  console.log('🌱 Seeding Independent Living Skills...\n');
  
  const domainCounts: Record<string, number> = {};
  
  try {
    for (const skill of allILSSkills) {
      // Note: Uncomment after FunctionalSkill model is in schema
      // await client.functionalSkill.create({
      //   data: {
      //     name: skill.name,
      //     description: skill.description,
      //     domain: skill.domain,
      //     taskAnalysisSteps: skill.taskAnalysisSteps,
      //     ageAppropriateStart: skill.ageAppropriateStart,
      //     ageAppropriateEnd: skill.ageAppropriateEnd,
      //     difficultyLevel: skill.difficultyLevel,
      //     targetSettings: skill.targetSettings,
      //     materialsNeeded: skill.materialsNeeded,
      //     isCriticalSafety: skill.isCriticalSafety,
      //     communityRelevance: skill.communityRelevance,
      //     employmentRelevance: skill.employmentRelevance,
      //     isActive: true,
      //   },
      // });
      
      domainCounts[skill.domain] = (domainCounts[skill.domain] || 0) + 1;
    }
    
    console.log('📊 Skills by Domain:');
    Object.entries(domainCounts).forEach(([domain, count]) => {
      console.log(`   ${domain}: ${count} skills`);
    });
    console.log(`\n✅ Total: ${allILSSkills.length} ILS skills ready to seed`);
    
  } catch (error) {
    console.error('❌ Error seeding ILS skills:', error);
    throw error;
  } finally {
    if (!prisma) {
      await client.$disconnect();
    }
  }
}

// Run if executed directly
if (require.main === module) {
  seedILSSkills()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
