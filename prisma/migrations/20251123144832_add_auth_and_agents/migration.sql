/*
  Warnings:

  - The `status` column on the `PersonalizedModel` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "BaselineDomain" AS ENUM ('SPEECH_LANGUAGE', 'READING', 'MATH', 'SCIENCE_SOCIAL', 'SEL');

-- CreateEnum
CREATE TYPE "BaselineAssessmentStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "PersonalizedModelStatus" AS ENUM ('PENDING', 'TRAINING', 'ACTIVE', 'UPDATING', 'FAILED', 'ERROR');

-- CreateEnum
CREATE TYPE "ModelVersionStatus" AS ENUM ('ACTIVE', 'ARCHIVED', 'DEPRECATED');

-- CreateEnum
CREATE TYPE "AccommodationType" AS ENUM ('TEXT_TO_SPEECH', 'INCREASED_FONT_SIZE', 'HIGH_CONTRAST', 'REDUCED_VISUAL_CLUTTER', 'VISUAL_SCHEDULES', 'COLOR_CODING', 'DYSLEXIA_FONT', 'CAPTIONS', 'AUDIO_INSTRUCTIONS', 'SLOWED_AUDIO', 'SPEECH_TO_TEXT', 'SIMPLIFIED_CONTROLS', 'LARGER_CLICK_TARGETS', 'EXTRA_TIME', 'FREQUENT_BREAKS', 'REDUCED_CHOICES', 'CHUNKED_CONTENT', 'WORKED_EXAMPLES', 'STEP_BY_STEP', 'ENCOURAGEMENT_PROMPTS', 'FIDGET_TOOLS', 'CALM_DOWN_STRATEGIES', 'CHOICE_IN_ACTIVITIES');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('TEXT', 'CONCERN', 'QUESTION', 'ALERT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "InsightPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "MeetingParticipantStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED');

-- CreateEnum
CREATE TYPE "AnnouncementPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "DigestFrequency" AS ENUM ('INSTANT', 'DAILY', 'WEEKLY');

-- CreateEnum
CREATE TYPE "CommunicationLogType" AS ENUM ('MESSAGE', 'INSIGHT', 'MEETING', 'ANNOUNCEMENT', 'NOTIFICATION');

-- CreateEnum
CREATE TYPE "CurriculumUnitStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CurriculumModuleStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CurriculumContentType" AS ENUM ('LESSON', 'ACTIVITY', 'ASSESSMENT', 'SUPPORT', 'RESOURCE');

-- CreateEnum
CREATE TYPE "CurriculumContentStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ContentVersionSource" AS ENUM ('AUTHOR', 'AI', 'FALLBACK');

-- CreateEnum
CREATE TYPE "ContentVersionStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ContentAssetType" AS ENUM ('TEXT', 'AUDIO', 'VIDEO', 'IMAGE', 'INTERACTIVE', 'HAPTIC');

-- CreateEnum
CREATE TYPE "ContentInteractionType" AS ENUM ('VIEW', 'DELIVERY', 'ASSIGNMENT', 'FEEDBACK', 'AI_RECOMMENDATION');

-- CreateEnum
CREATE TYPE "AgentType" AS ENUM ('PERSONALIZED_LEARNING', 'AI_TUTOR', 'CONTENT_ADAPTATION', 'SPEECH_ANALYSIS', 'PROGRESS_MONITORING');

-- AlterTable
ALTER TABLE "Diagnosis" ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "IEPGoal" ALTER COLUMN "status" SET DEFAULT 'NOT_STARTED';

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "learnerId" TEXT;

-- AlterTable
ALTER TABLE "PersonalizedModel" ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "summary" TEXT,
ALTER COLUMN "modelId" DROP NOT NULL,
ALTER COLUMN "systemPrompt" DROP NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "PersonalizedModelStatus" NOT NULL DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE "BaselineAssessmentSession" (
    "id" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "status" "BaselineAssessmentStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "currentDomain" "BaselineDomain",
    "currentComponent" TEXT,
    "plan" JSONB,
    "multiModalPlan" JSONB,
    "aiSummary" JSONB,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BaselineAssessmentSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BaselineDomainResult" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "domain" "BaselineDomain" NOT NULL,
    "component" TEXT NOT NULL,
    "modality" TEXT NOT NULL,
    "responses" JSONB,
    "score" DOUBLE PRECISION,
    "confidence" DOUBLE PRECISION,
    "aiNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BaselineDomainResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpeechAssessmentSample" (
    "id" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "sessionId" TEXT,
    "taskType" TEXT NOT NULL,
    "component" TEXT,
    "audioFormat" TEXT,
    "audioBase64" TEXT,
    "durationMs" INTEGER,
    "articulation" DOUBLE PRECISION,
    "fluency" DOUBLE PRECISION,
    "intelligibility" DOUBLE PRECISION,
    "metadata" JSONB,
    "analysis" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SpeechAssessmentSample_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MainModelVersion" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "modelPath" TEXT NOT NULL,
    "architecture" JSONB NOT NULL,
    "trainingMetrics" JSONB NOT NULL,
    "status" "ModelVersionStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MainModelVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FederatedUpdate" (
    "id" TEXT NOT NULL,
    "mainModelVersionId" TEXT NOT NULL,
    "aggregationStrategy" TEXT NOT NULL,
    "contributingLearners" TEXT[],
    "performanceImprovement" DOUBLE PRECISION NOT NULL,
    "privacyBudget" DOUBLE PRECISION,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FederatedUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModelTrainingSession" (
    "id" TEXT NOT NULL,
    "personalizedModelId" TEXT NOT NULL,
    "epochs" INTEGER NOT NULL,
    "batchSize" INTEGER NOT NULL,
    "samples" INTEGER NOT NULL,
    "finalLoss" DOUBLE PRECISION NOT NULL,
    "finalAccuracy" DOUBLE PRECISION NOT NULL,
    "contributedToFederation" BOOLEAN NOT NULL DEFAULT false,
    "federatedUpdateId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModelTrainingSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningAdjustmentLog" (
    "id" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "previousLevel" DOUBLE PRECISION NOT NULL,
    "newLevel" DOUBLE PRECISION NOT NULL,
    "approvedBy" TEXT NOT NULL,
    "approvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reasoning" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LearningAdjustmentLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearnerAccommodation" (
    "id" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "accommodations" "AccommodationType"[],
    "autoEnabled" BOOLEAN NOT NULL DEFAULT false,
    "autoEnabledAt" TIMESTAMP(3),
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearnerAccommodation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccommodationEffectiveness" (
    "id" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "accommodation" "AccommodationType" NOT NULL,
    "sessionId" TEXT,
    "engagementWith" DOUBLE PRECISION,
    "completionRateWith" DOUBLE PRECISION,
    "accuracyWith" DOUBLE PRECISION,
    "timeOnTaskWith" DOUBLE PRECISION,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccommodationEffectiveness_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningStandard" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "jurisdiction" TEXT NOT NULL,
    "gradeBand" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "skillFocus" TEXT,
    "description" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "metadata" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningStandard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CurriculumUnit" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "subject" TEXT NOT NULL,
    "gradeBand" TEXT NOT NULL,
    "gradeLevel" INTEGER,
    "focusSkills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "CurriculumUnitStatus" NOT NULL DEFAULT 'DRAFT',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CurriculumUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CurriculumModule" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "subject" TEXT,
    "targetGrade" INTEGER,
    "skillFocus" TEXT,
    "durationMinutes" INTEGER,
    "sequence" INTEGER,
    "status" "CurriculumModuleStatus" NOT NULL DEFAULT 'DRAFT',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CurriculumModule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModulePrerequisite" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "prerequisiteId" TEXT NOT NULL,

    CONSTRAINT "ModulePrerequisite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CurriculumContent" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "contentType" "CurriculumContentType" NOT NULL,
    "difficultyLevel" DOUBLE PRECISION,
    "primaryStandardId" TEXT,
    "aiTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "CurriculumContentStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CurriculumContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentVersion" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "source" "ContentVersionSource" NOT NULL DEFAULT 'AUTHOR',
    "status" "ContentVersionStatus" NOT NULL DEFAULT 'DRAFT',
    "prompt" TEXT,
    "aiModel" TEXT,
    "diffSummary" TEXT,
    "adaptationContext" JSONB,
    "aiConfidence" DOUBLE PRECISION,
    "payload" JSONB,
    "createdById" TEXT,
    "reviewedById" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentAsset" (
    "id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "assetType" "ContentAssetType" NOT NULL,
    "title" TEXT,
    "uri" TEXT,
    "mimeType" TEXT,
    "textContent" TEXT,
    "durationSeconds" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentInteraction" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "versionId" TEXT,
    "learnerId" TEXT,
    "userId" TEXT,
    "interactionType" "ContentInteractionType" NOT NULL,
    "modality" TEXT,
    "durationSeconds" INTEGER,
    "feedbackRating" INTEGER,
    "feedbackComment" TEXT,
    "masteryEvidence" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentEffectiveness" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "versionId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "engagementScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "masteryDelta" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "aiQualityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "educatorSentiment" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sampleSize" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentEffectiveness_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "fromId" TEXT NOT NULL,
    "toId" TEXT NOT NULL,
    "learnerId" TEXT,
    "type" "MessageType" NOT NULL DEFAULT 'TEXT',
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIInsight" (
    "id" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "requesterId" TEXT,
    "generatedForId" TEXT,
    "type" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "recommendations" JSONB,
    "priority" "InsightPriority" NOT NULL DEFAULT 'MEDIUM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIInsight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Meeting" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "roomLink" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "scheduledTime" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Meeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetingParticipant" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "MeetingParticipantStatus" NOT NULL DEFAULT 'PENDING',
    "inviteSent" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "joinedAt" TIMESTAMP(3),

    CONSTRAINT "MeetingParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "priority" "AnnouncementPriority" NOT NULL DEFAULT 'MEDIUM',
    "recipients" TEXT[],
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "channels" JSONB NOT NULL,
    "digestFrequency" "DigestFrequency" NOT NULL DEFAULT 'INSTANT',
    "muteUntil" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunicationLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "learnerId" TEXT,
    "type" "CommunicationLogType" NOT NULL,
    "channel" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunicationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MLTrainingData" (
    "id" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "features" JSONB NOT NULL,
    "labels" JSONB NOT NULL,
    "outcome" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MLTrainingData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "AgentState" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "agentType" "AgentType" NOT NULL,
    "state" JSONB NOT NULL,
    "memory" JSONB NOT NULL,
    "lastActivity" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentInteraction" (
    "id" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "interactionType" TEXT NOT NULL,
    "input" JSONB NOT NULL,
    "output" JSONB NOT NULL,
    "durationMs" INTEGER,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_UnitStandards" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_UnitStandards_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_CurriculumContentStandards" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CurriculumContentStandards_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "BaselineAssessmentSession_learnerId_status_idx" ON "BaselineAssessmentSession"("learnerId", "status");

-- CreateIndex
CREATE INDEX "BaselineDomainResult_sessionId_domain_idx" ON "BaselineDomainResult"("sessionId", "domain");

-- CreateIndex
CREATE INDEX "SpeechAssessmentSample_learnerId_idx" ON "SpeechAssessmentSample"("learnerId");

-- CreateIndex
CREATE INDEX "SpeechAssessmentSample_sessionId_idx" ON "SpeechAssessmentSample"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "MainModelVersion_version_key" ON "MainModelVersion"("version");

-- CreateIndex
CREATE UNIQUE INDEX "LearnerAccommodation_learnerId_key" ON "LearnerAccommodation"("learnerId");

-- CreateIndex
CREATE INDEX "AccommodationEffectiveness_learnerId_accommodation_idx" ON "AccommodationEffectiveness"("learnerId", "accommodation");

-- CreateIndex
CREATE UNIQUE INDEX "LearningStandard_code_jurisdiction_key" ON "LearningStandard"("code", "jurisdiction");

-- CreateIndex
CREATE INDEX "CurriculumModule_unitId_idx" ON "CurriculumModule"("unitId");

-- CreateIndex
CREATE UNIQUE INDEX "ModulePrerequisite_moduleId_prerequisiteId_key" ON "ModulePrerequisite"("moduleId", "prerequisiteId");

-- CreateIndex
CREATE INDEX "CurriculumContent_moduleId_idx" ON "CurriculumContent"("moduleId");

-- CreateIndex
CREATE INDEX "CurriculumContent_primaryStandardId_idx" ON "CurriculumContent"("primaryStandardId");

-- CreateIndex
CREATE INDEX "ContentVersion_status_idx" ON "ContentVersion"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ContentVersion_contentId_versionNumber_key" ON "ContentVersion"("contentId", "versionNumber");

-- CreateIndex
CREATE INDEX "ContentAsset_versionId_idx" ON "ContentAsset"("versionId");

-- CreateIndex
CREATE INDEX "ContentInteraction_contentId_idx" ON "ContentInteraction"("contentId");

-- CreateIndex
CREATE INDEX "ContentInteraction_learnerId_idx" ON "ContentInteraction"("learnerId");

-- CreateIndex
CREATE INDEX "ContentInteraction_userId_idx" ON "ContentInteraction"("userId");

-- CreateIndex
CREATE INDEX "ContentEffectiveness_versionId_idx" ON "ContentEffectiveness"("versionId");

-- CreateIndex
CREATE UNIQUE INDEX "ContentEffectiveness_contentId_date_key" ON "ContentEffectiveness"("contentId", "date");

-- CreateIndex
CREATE INDEX "Message_toId_createdAt_idx" ON "Message"("toId", "createdAt");

-- CreateIndex
CREATE INDEX "Message_learnerId_idx" ON "Message"("learnerId");

-- CreateIndex
CREATE UNIQUE INDEX "Meeting_roomId_key" ON "Meeting"("roomId");

-- CreateIndex
CREATE UNIQUE INDEX "MeetingParticipant_meetingId_userId_key" ON "MeetingParticipant"("meetingId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreference_userId_key" ON "NotificationPreference"("userId");

-- CreateIndex
CREATE INDEX "CommunicationLog_userId_idx" ON "CommunicationLog"("userId");

-- CreateIndex
CREATE INDEX "CommunicationLog_learnerId_idx" ON "CommunicationLog"("learnerId");

-- CreateIndex
CREATE INDEX "MLTrainingData_learnerId_idx" ON "MLTrainingData"("learnerId");

-- CreateIndex
CREATE INDEX "MLTrainingData_timestamp_idx" ON "MLTrainingData"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "AgentState_agentId_key" ON "AgentState"("agentId");

-- CreateIndex
CREATE INDEX "AgentState_learnerId_idx" ON "AgentState"("learnerId");

-- CreateIndex
CREATE INDEX "AgentState_lastActivity_idx" ON "AgentState"("lastActivity");

-- CreateIndex
CREATE INDEX "AgentState_agentType_idx" ON "AgentState"("agentType");

-- CreateIndex
CREATE INDEX "AgentInteraction_learnerId_idx" ON "AgentInteraction"("learnerId");

-- CreateIndex
CREATE INDEX "AgentInteraction_agentId_idx" ON "AgentInteraction"("agentId");

-- CreateIndex
CREATE INDEX "AgentInteraction_createdAt_idx" ON "AgentInteraction"("createdAt");

-- CreateIndex
CREATE INDEX "_UnitStandards_B_index" ON "_UnitStandards"("B");

-- CreateIndex
CREATE INDEX "_CurriculumContentStandards_B_index" ON "_CurriculumContentStandards"("B");

-- AddForeignKey
ALTER TABLE "BaselineAssessmentSession" ADD CONSTRAINT "BaselineAssessmentSession_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "Learner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BaselineDomainResult" ADD CONSTRAINT "BaselineDomainResult_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "BaselineAssessmentSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpeechAssessmentSample" ADD CONSTRAINT "SpeechAssessmentSample_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "Learner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpeechAssessmentSample" ADD CONSTRAINT "SpeechAssessmentSample_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "BaselineAssessmentSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FederatedUpdate" ADD CONSTRAINT "FederatedUpdate_mainModelVersionId_fkey" FOREIGN KEY ("mainModelVersionId") REFERENCES "MainModelVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModelTrainingSession" ADD CONSTRAINT "ModelTrainingSession_personalizedModelId_fkey" FOREIGN KEY ("personalizedModelId") REFERENCES "PersonalizedModel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningAdjustmentLog" ADD CONSTRAINT "LearningAdjustmentLog_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "Learner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "Learner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "Learner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearnerAccommodation" ADD CONSTRAINT "LearnerAccommodation_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "Learner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccommodationEffectiveness" ADD CONSTRAINT "AccommodationEffectiveness_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "Learner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurriculumUnit" ADD CONSTRAINT "CurriculumUnit_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurriculumModule" ADD CONSTRAINT "CurriculumModule_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "CurriculumUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurriculumModule" ADD CONSTRAINT "CurriculumModule_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModulePrerequisite" ADD CONSTRAINT "ModulePrerequisite_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "CurriculumModule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModulePrerequisite" ADD CONSTRAINT "ModulePrerequisite_prerequisiteId_fkey" FOREIGN KEY ("prerequisiteId") REFERENCES "CurriculumModule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurriculumContent" ADD CONSTRAINT "CurriculumContent_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "CurriculumModule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurriculumContent" ADD CONSTRAINT "CurriculumContent_primaryStandardId_fkey" FOREIGN KEY ("primaryStandardId") REFERENCES "LearningStandard"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurriculumContent" ADD CONSTRAINT "CurriculumContent_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurriculumContent" ADD CONSTRAINT "CurriculumContent_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentVersion" ADD CONSTRAINT "ContentVersion_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "CurriculumContent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentVersion" ADD CONSTRAINT "ContentVersion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentVersion" ADD CONSTRAINT "ContentVersion_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentAsset" ADD CONSTRAINT "ContentAsset_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "ContentVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentInteraction" ADD CONSTRAINT "ContentInteraction_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "CurriculumContent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentInteraction" ADD CONSTRAINT "ContentInteraction_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "ContentVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentInteraction" ADD CONSTRAINT "ContentInteraction_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "Learner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentInteraction" ADD CONSTRAINT "ContentInteraction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentEffectiveness" ADD CONSTRAINT "ContentEffectiveness_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "CurriculumContent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentEffectiveness" ADD CONSTRAINT "ContentEffectiveness_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "ContentVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_fromId_fkey" FOREIGN KEY ("fromId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_toId_fkey" FOREIGN KEY ("toId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "Learner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIInsight" ADD CONSTRAINT "AIInsight_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "Learner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIInsight" ADD CONSTRAINT "AIInsight_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIInsight" ADD CONSTRAINT "AIInsight_generatedForId_fkey" FOREIGN KEY ("generatedForId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingParticipant" ADD CONSTRAINT "MeetingParticipant_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingParticipant" ADD CONSTRAINT "MeetingParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunicationLog" ADD CONSTRAINT "CommunicationLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunicationLog" ADD CONSTRAINT "CommunicationLog_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "Learner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentState" ADD CONSTRAINT "AgentState_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "Learner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentInteraction" ADD CONSTRAINT "AgentInteraction_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "Learner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UnitStandards" ADD CONSTRAINT "_UnitStandards_A_fkey" FOREIGN KEY ("A") REFERENCES "CurriculumUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UnitStandards" ADD CONSTRAINT "_UnitStandards_B_fkey" FOREIGN KEY ("B") REFERENCES "LearningStandard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CurriculumContentStandards" ADD CONSTRAINT "_CurriculumContentStandards_A_fkey" FOREIGN KEY ("A") REFERENCES "CurriculumContent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CurriculumContentStandards" ADD CONSTRAINT "_CurriculumContentStandards_B_fkey" FOREIGN KEY ("B") REFERENCES "LearningStandard"("id") ON DELETE CASCADE ON UPDATE CASCADE;
