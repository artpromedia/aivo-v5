-- CreateEnum
CREATE TYPE "Region" AS ENUM ('north_america', 'africa', 'europe', 'australia', 'middle_east', 'asia');

-- CreateEnum
CREATE TYPE "GradeBand" AS ENUM ('k_5', 'six_8', 'nine_12');

-- CreateEnum
CREATE TYPE "SubjectCode" AS ENUM ('math', 'ela', 'reading', 'writing', 'science', 'social_studies', 'sel', 'speech', 'other');

-- CreateEnum
CREATE TYPE "DifficultyChangeDirection" AS ENUM ('easier', 'harder');

-- CreateEnum
CREATE TYPE "DifficultyProposalStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "BaselineStatus" AS ENUM ('draft', 'in_progress', 'completed');

-- CreateTable
CREATE TABLE "Learner" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "currentGrade" INTEGER NOT NULL,
    "region" "Region" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Learner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearnerBrainProfile" (
    "id" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "region" "Region" NOT NULL,
    "currentGrade" INTEGER NOT NULL,
    "gradeBand" "GradeBand" NOT NULL,
    "subjectLevels" JSONB NOT NULL,
    "neurodiversity" JSONB NOT NULL,
    "preferences" JSONB NOT NULL,
    "lastUpdatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearnerBrainProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BaselineAssessment" (
    "id" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "region" "Region" NOT NULL,
    "grade" INTEGER NOT NULL,
    "subjects" "SubjectCode"[],
    "items" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "BaselineStatus" NOT NULL DEFAULT 'draft',

    CONSTRAINT "BaselineAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DifficultyChangeProposal" (
    "id" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "subject" "SubjectCode" NOT NULL,
    "fromAssessedGradeLevel" INTEGER NOT NULL,
    "toAssessedGradeLevel" INTEGER NOT NULL,
    "direction" "DifficultyChangeDirection" NOT NULL,
    "rationale" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "DifficultyProposalStatus" NOT NULL DEFAULT 'pending',
    "decidedByUserId" TEXT,
    "decidedAt" TIMESTAMP(3),
    "decisionNotes" TEXT,
    "sourceAssessmentId" TEXT,

    CONSTRAINT "DifficultyChangeProposal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LearnerBrainProfile_learnerId_key" ON "LearnerBrainProfile"("learnerId");

-- AddForeignKey
ALTER TABLE "LearnerBrainProfile" ADD CONSTRAINT "LearnerBrainProfile_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "Learner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BaselineAssessment" ADD CONSTRAINT "BaselineAssessment_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "Learner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DifficultyChangeProposal" ADD CONSTRAINT "DifficultyChangeProposal_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "Learner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DifficultyChangeProposal" ADD CONSTRAINT "DifficultyChangeProposal_sourceAssessmentId_fkey" FOREIGN KEY ("sourceAssessmentId") REFERENCES "BaselineAssessment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
