/*
  Warnings:

  - You are about to drop the column `currentGrade` on the `Learner` table. All the data in the column will be lost.
  - You are about to drop the column `displayName` on the `Learner` table. All the data in the column will be lost.
  - You are about to drop the column `region` on the `Learner` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `Learner` table. All the data in the column will be lost.
  - You are about to drop the column `audience` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `body` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `learnerId` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `recipientUserId` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `relatedBaselineAssessmentId` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `relatedDifficultyProposalId` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `relatedSessionId` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `summary` on the `PersonalizedModel` table. All the data in the column will be lost.
  - You are about to drop the column `actualMinutes` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the column `date` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the column `learnerId` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the column `plannedMinutes` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the column `subject` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `BaselineAssessment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DifficultyChangeProposal` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `LearnerBrainProfile` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `LearningAdjustmentLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RoleAssignment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SessionActivity` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Tenant` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[userId]` on the table `Learner` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sessionToken]` on the table `Session` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[username]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `type` on the `ApprovalRequest` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `status` on the `ApprovalRequest` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Made the column `approverId` on table `ApprovalRequest` required. This step will fail if there are existing NULL values in that column.
  - Made the column `details` on table `ApprovalRequest` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `dateOfBirth` to the `Learner` table without a default value. This is not possible if the table is not empty.
  - Added the required column `firstName` to the `Learner` table without a default value. This is not possible if the table is not empty.
  - Added the required column `gradeLevel` to the `Learner` table without a default value. This is not possible if the table is not empty.
  - Added the required column `guardianId` to the `Learner` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastName` to the `Learner` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Learner` table without a default value. This is not possible if the table is not empty.
  - Added the required column `message` to the `Notification` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Notification` table without a default value. This is not possible if the table is not empty.
  - Made the column `modelId` on table `PersonalizedModel` required. This step will fail if there are existing NULL values in that column.
  - Made the column `systemPrompt` on table `PersonalizedModel` required. This step will fail if there are existing NULL values in that column.
  - Changed the type of `status` on the `PersonalizedModel` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `expires` to the `Session` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sessionToken` to the `Session` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Session` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `role` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `username` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'TEACHER', 'PARENT', 'LEARNER');

-- CreateEnum
CREATE TYPE "AssessmentType" AS ENUM ('BASELINE', 'PROGRESS', 'DIAGNOSTIC', 'SUMMATIVE');

-- CreateEnum
CREATE TYPE "AssessmentStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "DomainType" AS ENUM ('READING', 'MATH', 'SPEECH', 'SEL', 'SCIENCE');

-- CreateEnum
CREATE TYPE "ModelStatus" AS ENUM ('TRAINING', 'ACTIVE', 'UPDATING', 'FAILED');

-- CreateEnum
CREATE TYPE "GameType" AS ENUM ('PUZZLE', 'MEMORY', 'QUIZ', 'MOVEMENT', 'CREATIVE');

-- CreateEnum
CREATE TYPE "ApprovalType" AS ENUM ('DIFFICULTY_CHANGE', 'CONTENT_MODIFICATION', 'ASSESSMENT_RETRY', 'GOAL_ADJUSTMENT');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'COMPLETED');

-- CreateEnum
CREATE TYPE "GoalStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'ACHIEVED', 'MODIFIED');

-- DropForeignKey
ALTER TABLE "ApprovalRequest" DROP CONSTRAINT "ApprovalRequest_approverId_fkey";

-- DropForeignKey
ALTER TABLE "ApprovalRequest" DROP CONSTRAINT "ApprovalRequest_learnerId_fkey";

-- DropForeignKey
ALTER TABLE "BaselineAssessment" DROP CONSTRAINT "BaselineAssessment_learnerId_fkey";

-- DropForeignKey
ALTER TABLE "DifficultyChangeProposal" DROP CONSTRAINT "DifficultyChangeProposal_learnerId_fkey";

-- DropForeignKey
ALTER TABLE "DifficultyChangeProposal" DROP CONSTRAINT "DifficultyChangeProposal_sourceAssessmentId_fkey";

-- DropForeignKey
ALTER TABLE "Learner" DROP CONSTRAINT "Learner_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "Learner" DROP CONSTRAINT "Learner_userId_fkey";

-- DropForeignKey
ALTER TABLE "LearnerBrainProfile" DROP CONSTRAINT "LearnerBrainProfile_learnerId_fkey";

-- DropForeignKey
ALTER TABLE "LearningAdjustmentLog" DROP CONSTRAINT "LearningAdjustmentLog_learnerId_fkey";

-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_learnerId_fkey";

-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_recipientUserId_fkey";

-- DropForeignKey
ALTER TABLE "PersonalizedModel" DROP CONSTRAINT "PersonalizedModel_learnerId_fkey";

-- DropForeignKey
ALTER TABLE "RoleAssignment" DROP CONSTRAINT "RoleAssignment_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "RoleAssignment" DROP CONSTRAINT "RoleAssignment_userId_fkey";

-- DropForeignKey
ALTER TABLE "Session" DROP CONSTRAINT "Session_learnerId_fkey";

-- DropForeignKey
ALTER TABLE "SessionActivity" DROP CONSTRAINT "SessionActivity_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_tenantId_fkey";

-- AlterTable
ALTER TABLE "ApprovalRequest" DROP COLUMN "type",
ADD COLUMN     "type" "ApprovalType" NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "ApprovalStatus" NOT NULL,
ALTER COLUMN "approverId" SET NOT NULL,
ALTER COLUMN "details" SET NOT NULL;

-- AlterTable
ALTER TABLE "Learner" DROP COLUMN "currentGrade",
DROP COLUMN "displayName",
DROP COLUMN "region",
DROP COLUMN "tenantId",
ADD COLUMN     "accommodations" JSONB,
ADD COLUMN     "actualLevel" DOUBLE PRECISION,
ADD COLUMN     "dateOfBirth" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "firstName" TEXT NOT NULL,
ADD COLUMN     "gradeLevel" INTEGER NOT NULL,
ADD COLUMN     "guardianId" TEXT NOT NULL,
ADD COLUMN     "lastName" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Notification" DROP COLUMN "audience",
DROP COLUMN "body",
DROP COLUMN "learnerId",
DROP COLUMN "recipientUserId",
DROP COLUMN "relatedBaselineAssessmentId",
DROP COLUMN "relatedDifficultyProposalId",
DROP COLUMN "relatedSessionId",
DROP COLUMN "status",
DROP COLUMN "tenantId",
ADD COLUMN     "data" JSONB,
ADD COLUMN     "message" TEXT NOT NULL,
ADD COLUMN     "read" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "PersonalizedModel" DROP COLUMN "summary",
ADD COLUMN     "lastTrainedAt" TIMESTAMP(3),
ADD COLUMN     "performanceMetrics" JSONB,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1,
ALTER COLUMN "modelId" SET NOT NULL,
ALTER COLUMN "systemPrompt" SET NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "ModelStatus" NOT NULL;

-- AlterTable
ALTER TABLE "Session" DROP COLUMN "actualMinutes",
DROP COLUMN "date",
DROP COLUMN "learnerId",
DROP COLUMN "plannedMinutes",
DROP COLUMN "status",
DROP COLUMN "subject",
DROP COLUMN "tenantId",
ADD COLUMN     "expires" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "sessionToken" TEXT NOT NULL,
ADD COLUMN     "userId" TEXT NOT NULL,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "name",
DROP COLUMN "tenantId",
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "lastLogin" TIMESTAMP(3),
ADD COLUMN     "password" TEXT NOT NULL,
ADD COLUMN     "role" "Role" NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "username" TEXT NOT NULL,
ALTER COLUMN "email" DROP NOT NULL;

-- DropTable
DROP TABLE "BaselineAssessment";

-- DropTable
DROP TABLE "DifficultyChangeProposal";

-- DropTable
DROP TABLE "LearnerBrainProfile";

-- DropTable
DROP TABLE "LearningAdjustmentLog";

-- DropTable
DROP TABLE "RoleAssignment";

-- DropTable
DROP TABLE "SessionActivity";

-- DropTable
DROP TABLE "Tenant";

-- DropEnum
DROP TYPE "ApprovalRequestStatus";

-- DropEnum
DROP TYPE "ApprovalRequestType";

-- DropEnum
DROP TYPE "BaselineStatus";

-- DropEnum
DROP TYPE "DifficultyChangeDirection";

-- DropEnum
DROP TYPE "DifficultyProposalStatus";

-- DropEnum
DROP TYPE "GradeBand";

-- DropEnum
DROP TYPE "PersonalizedModelStatus";

-- DropEnum
DROP TYPE "Region";

-- DropEnum
DROP TYPE "SubjectCode";

-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "preferences" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Diagnosis" (
    "id" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT,
    "notes" TEXT,
    "diagnosedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Diagnosis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assessment" (
    "id" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "type" "AssessmentType" NOT NULL,
    "status" "AssessmentStatus" NOT NULL,
    "results" JSONB,
    "overallLevel" DOUBLE PRECISION,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Assessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentDomain" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "domain" "DomainType" NOT NULL,
    "questions" JSONB NOT NULL,
    "responses" JSONB NOT NULL,
    "score" DOUBLE PRECISION,
    "level" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssessmentDomain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningSession" (
    "id" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "gradeLevel" INTEGER NOT NULL,
    "presentationLevel" DOUBLE PRECISION NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "duration" INTEGER,
    "interactions" JSONB NOT NULL,
    "focusScore" DOUBLE PRECISION,
    "completion" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LearningSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FocusData" (
    "id" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "sessionId" TEXT,
    "focusScore" DOUBLE PRECISION NOT NULL,
    "distractions" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "metrics" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FocusData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameSession" (
    "id" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "gameType" "GameType" NOT NULL,
    "subject" TEXT,
    "difficulty" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL,
    "score" INTEGER,
    "completed" BOOLEAN NOT NULL,
    "triggeredBy" TEXT NOT NULL,
    "returnedToLearning" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GameSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Progress" (
    "id" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "domain" "DomainType" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "level" DOUBLE PRECISION NOT NULL,
    "score" DOUBLE PRECISION,
    "timeSpent" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Class" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "gradeLevel" INTEGER NOT NULL,
    "teacherId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Class_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Enrollment" (
    "id" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "EnrollmentStatus" NOT NULL,

    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assignment" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IEPGoal" (
    "id" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "goal" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "targetDate" TIMESTAMP(3) NOT NULL,
    "status" "GoalStatus" NOT NULL,
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IEPGoal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Enrollment_learnerId_classId_key" ON "Enrollment"("learnerId", "classId");

-- CreateIndex
CREATE UNIQUE INDEX "Learner_userId_key" ON "Learner"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Learner" ADD CONSTRAINT "Learner_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Learner" ADD CONSTRAINT "Learner_guardianId_fkey" FOREIGN KEY ("guardianId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Diagnosis" ADD CONSTRAINT "Diagnosis_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "Learner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "Learner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentDomain" ADD CONSTRAINT "AssessmentDomain_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalizedModel" ADD CONSTRAINT "PersonalizedModel_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "Learner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningSession" ADD CONSTRAINT "LearningSession_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "Learner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FocusData" ADD CONSTRAINT "FocusData_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "Learner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameSession" ADD CONSTRAINT "GameSession_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "Learner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Progress" ADD CONSTRAINT "Progress_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "Learner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Class" ADD CONSTRAINT "Class_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "Learner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IEPGoal" ADD CONSTRAINT "IEPGoal_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "Learner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
