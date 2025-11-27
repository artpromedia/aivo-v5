-- CreateEnum
CREATE TYPE "OnboardingStatus" AS ENUM ('PENDING', 'EMAIL_VERIFIED', 'PROFILE_COMPLETE', 'CHILD_ADDED', 'CLASS_SETUP', 'ASSESSMENT_PENDING', 'ASSESSMENT_COMPLETE', 'COMPLETE');

-- AlterTable (Add onboarding columns to User)
ALTER TABLE "User" ADD COLUMN "onboardingStatus" "OnboardingStatus" NOT NULL DEFAULT 'PENDING';
ALTER TABLE "User" ADD COLUMN "onboardingCompletedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "onboardingSteps" JSONB;
ALTER TABLE "User" ADD COLUMN "onboardingStartedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "OnboardingAnalytics" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "step" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "timeSpentMs" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OnboardingAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OnboardingAnalytics_userId_idx" ON "OnboardingAnalytics"("userId");

-- CreateIndex
CREATE INDEX "OnboardingAnalytics_step_idx" ON "OnboardingAnalytics"("step");

-- CreateIndex
CREATE INDEX "OnboardingAnalytics_action_idx" ON "OnboardingAnalytics"("action");

-- CreateIndex
CREATE INDEX "OnboardingAnalytics_createdAt_idx" ON "OnboardingAnalytics"("createdAt");

-- AddForeignKey
ALTER TABLE "OnboardingAnalytics" ADD CONSTRAINT "OnboardingAnalytics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Set existing users to COMPLETE status (they don't need onboarding)
UPDATE "User" SET "onboardingStatus" = 'COMPLETE', "onboardingCompletedAt" = NOW() WHERE "onboardingStatus" = 'PENDING';
