/**
 * Seed Staging Database with Test Data
 * 
 * Creates realistic test data for staging environment:
 * - Test users for each role
 * - Sample learner profiles
 * - Homework sessions
 * - Assessment results
 * 
 * Run: npx ts-node scripts/seed-staging.ts
 */

import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

// Simple password hashing for test users
async function hashPassword(password: string): Promise<string> {
  // Note: In production, use bcrypt or argon2
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

// Test user configuration
const TEST_PASSWORD = 'TestPassword123!';

const TEST_USERS = [
  { email: 'test-superadmin@aivo.test', username: 'test-superadmin', role: 'SUPER_ADMIN', firstName: 'Super', lastName: 'Admin' },
  { email: 'test-admin@aivo.test', username: 'test-admin', role: 'PLATFORM_ADMIN', firstName: 'Platform', lastName: 'Admin' },
  { email: 'test-districtadmin@aivo.test', username: 'test-districtadmin', role: 'DISTRICT_ADMIN', firstName: 'District', lastName: 'Admin' },
  { email: 'test-schooladmin@aivo.test', username: 'test-schooladmin', role: 'SCHOOL_ADMIN', firstName: 'School', lastName: 'Admin' },
  { email: 'test-teacher@aivo.test', username: 'test-teacher', role: 'TEACHER', firstName: 'Test', lastName: 'Teacher' },
  { email: 'test-parent@aivo.test', username: 'test-parent', role: 'PARENT', firstName: 'Test', lastName: 'Parent' },
  { email: 'test-learner@aivo.test', username: 'test-learner', role: 'LEARNER', firstName: 'Test', lastName: 'Learner' },
];

const TEST_LEARNERS = [
  { firstName: 'Alex', lastName: 'Smith', gradeLevel: 5, learningStyle: 'VISUAL' },
  { firstName: 'Jordan', lastName: 'Taylor', gradeLevel: 3, learningStyle: 'AUDITORY' },
  { firstName: 'Casey', lastName: 'Brown', gradeLevel: 7, learningStyle: 'KINESTHETIC' },
  { firstName: 'Riley', lastName: 'Davis', gradeLevel: 4, learningStyle: 'READING_WRITING' },
  { firstName: 'Morgan', lastName: 'Wilson', gradeLevel: 6, learningStyle: 'VISUAL' },
];

async function clearStagingData() {
  console.log('🧹 Clearing existing staging data...');
  
  // Delete in order to respect foreign key constraints
  await prisma.$transaction([
    prisma.$executeRaw`DELETE FROM "HomeworkSession" WHERE true`,
    prisma.$executeRaw`DELETE FROM "Assessment" WHERE true`,
    prisma.$executeRaw`DELETE FROM "MoodCheckin" WHERE true`,
    prisma.$executeRaw`DELETE FROM "LearnerProfile" WHERE true`,
    prisma.$executeRaw`DELETE FROM "User" WHERE email LIKE '%@aivo.test'`,
    prisma.$executeRaw`DELETE FROM "Tenant" WHERE slug = 'test-district'`,
  ]);
  
  console.log('✅ Existing data cleared');
}

async function seedTenant() {
  console.log('🏢 Creating test tenant...');
  
  const tenant = await prisma.tenant.create({
    data: {
      name: 'Test School District',
      slug: 'test-district',
    },
  });
  
  console.log(`✅ Created tenant: ${tenant.name} (${tenant.id})`);
  return tenant;
}

async function seedUsers(tenantId: string) {
  console.log('👥 Creating test users...');
  
  const hashedPassword = await hashPassword(TEST_PASSWORD);
  const users: any[] = [];
  
  for (const userData of TEST_USERS) {
    const user = await prisma.user.create({
      data: {
        email: userData.email,
        username: userData.username,
        password: hashedPassword,
        role: userData.role as any,
        firstName: userData.firstName,
        lastName: userData.lastName,
        tenantId,
        emailVerified: new Date(),
      },
    });
    
    users.push(user);
    console.log(`  ✅ Created ${userData.role}: ${userData.email}`);
  }
  
  return users;
}

async function seedLearnerProfiles(parentId: string, tenantId: string) {
  console.log('🎒 Creating learner profiles...');
  
  const learners: any[] = [];
  
  for (const learnerData of TEST_LEARNERS) {
    // Create user for learner
    const hashedPassword = await hashPassword(TEST_PASSWORD);
    const email = `${learnerData.firstName.toLowerCase()}.${learnerData.lastName.toLowerCase()}@aivo.test`;
    
    const user = await prisma.user.create({
      data: {
        email,
        username: `learner-${learnerData.firstName.toLowerCase()}`,
        password: hashedPassword,
        role: 'LEARNER',
        firstName: learnerData.firstName,
        lastName: learnerData.lastName,
        tenantId,
        emailVerified: new Date(),
      },
    });
    
    // Create learner profile
    const profile = await prisma.learnerProfile.create({
      data: {
        userId: user.id,
        gradeLevel: learnerData.gradeLevel,
        learningStyle: learnerData.learningStyle as any,
        parentId,
      },
    });
    
    learners.push({ user, profile });
    console.log(`  ✅ Created learner: ${learnerData.firstName} (Grade ${learnerData.gradeLevel})`);
  }
  
  return learners;
}

async function seedHomeworkSessions(learners: any[]) {
  console.log('📚 Creating homework sessions...');
  
  const subjects = ['MATH', 'READING', 'WRITING', 'SCIENCE'];
  const statuses = ['IN_PROGRESS', 'COMPLETED', 'COMPLETED', 'COMPLETED'];
  
  for (const { profile, user } of learners) {
    // Create 2-3 sessions per learner
    const numSessions = Math.floor(Math.random() * 2) + 2;
    
    for (let i = 0; i < numSessions; i++) {
      const subject = subjects[Math.floor(Math.random() * subjects.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      
      await prisma.homeworkSession.create({
        data: {
          learnerId: profile.id,
          title: `${subject} Practice ${i + 1}`,
          subject: subject as any,
          status: status as any,
          difficultyMode: 'SCAFFOLDED',
          createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random time in last week
        },
      });
    }
    
    console.log(`  ✅ Created ${numSessions} sessions for ${user.firstName}`);
  }
}

async function seedMoodCheckins(learners: any[]) {
  console.log('😊 Creating mood check-ins...');
  
  const moods = ['HAPPY', 'CALM', 'FOCUSED', 'TIRED', 'EXCITED'];
  const energyLevels = ['LOW', 'MEDIUM', 'HIGH'];
  
  for (const { profile, user } of learners) {
    // Create 5-10 mood check-ins per learner
    const numCheckins = Math.floor(Math.random() * 6) + 5;
    
    for (let i = 0; i < numCheckins; i++) {
      const mood = moods[Math.floor(Math.random() * moods.length)];
      const energy = energyLevels[Math.floor(Math.random() * energyLevels.length)];
      
      await prisma.moodCheckin.create({
        data: {
          learnerId: profile.id,
          mood: mood as any,
          energyLevel: energy as any,
          context: 'START_SESSION',
          createdAt: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000), // Random time in last 2 weeks
        },
      });
    }
    
    console.log(`  ✅ Created ${numCheckins} mood check-ins for ${user.firstName}`);
  }
}

async function main() {
  console.log('');
  console.log('🌱 AIVO v5 Staging Data Seeder');
  console.log('==============================');
  console.log('');
  
  // Check if we're in staging
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ Cannot run seeder in production environment!');
    process.exit(1);
  }
  
  try {
    // Clear existing data
    await clearStagingData();
    
    // Create tenant
    const tenant = await seedTenant();
    
    // Create users
    const users = await seedUsers(tenant.id);
    const parentUser = users.find(u => u.role === 'PARENT');
    
    // Create learner profiles
    const learners = await seedLearnerProfiles(parentUser?.id || users[0].id, tenant.id);
    
    // Create homework sessions
    await seedHomeworkSessions(learners);
    
    // Create mood check-ins
    await seedMoodCheckins(learners);
    
    console.log('');
    console.log('==============================');
    console.log('✅ Staging data seeded successfully!');
    console.log('');
    console.log('Test Credentials:');
    console.log(`  Email: test-learner@aivo.test`);
    console.log(`  Password: ${TEST_PASSWORD}`);
    console.log('');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
