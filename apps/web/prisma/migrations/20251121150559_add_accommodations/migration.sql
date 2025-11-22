-- CreateEnum
CREATE TYPE "AccommodationType" AS ENUM ('TEXT_TO_SPEECH', 'INCREASED_FONT_SIZE', 'HIGH_CONTRAST', 'REDUCED_VISUAL_CLUTTER', 'VISUAL_SCHEDULES', 'COLOR_CODING', 'DYSLEXIA_FONT', 'CAPTIONS', 'AUDIO_INSTRUCTIONS', 'SLOWED_AUDIO', 'SPEECH_TO_TEXT', 'SIMPLIFIED_CONTROLS', 'LARGER_CLICK_TARGETS', 'EXTRA_TIME', 'FREQUENT_BREAKS', 'REDUCED_CHOICES', 'CHUNKED_CONTENT', 'WORKED_EXAMPLES', 'STEP_BY_STEP', 'ENCOURAGEMENT_PROMPTS', 'FIDGET_TOOLS', 'CALM_DOWN_STRATEGIES', 'CHOICE_IN_ACTIVITIES');

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

-- CreateIndex
CREATE UNIQUE INDEX "LearnerAccommodation_learnerId_key" ON "LearnerAccommodation"("learnerId");

-- CreateIndex
CREATE INDEX "AccommodationEffectiveness_learnerId_accommodation_idx" ON "AccommodationEffectiveness"("learnerId", "accommodation");

-- AddForeignKey
ALTER TABLE "LearnerAccommodation" ADD CONSTRAINT "LearnerAccommodation_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "Learner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccommodationEffectiveness" ADD CONSTRAINT "AccommodationEffectiveness_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "Learner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
