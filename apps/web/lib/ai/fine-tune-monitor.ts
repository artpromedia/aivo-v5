import { OpenAI } from "openai";
import type { PersonalizedModelStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const TRAINING: PersonalizedModelStatus = "TRAINING";
const ACTIVE: PersonalizedModelStatus = "ACTIVE";
const ERROR: PersonalizedModelStatus = "ERROR";

export interface FineTuneSyncStats {
  processed: number;
  activated: number;
  errored: number;
  skipped: number;
  missingApiKey: boolean;
}

export async function syncFineTuneStatuses(): Promise<FineTuneSyncStats> {
  const pendingModels = await prisma.personalizedModel.findMany({
    where: {
      status: TRAINING,
      modelId: { not: null }
    },
    select: {
      id: true,
      learnerId: true,
      modelId: true,
      summary: true
    }
  });

  if (pendingModels.length === 0) {
    return {
      processed: 0,
      activated: 0,
      errored: 0,
      skipped: 0,
      missingApiKey: false
    };
  }

  if (!process.env.OPENAI_API_KEY) {
    return {
      processed: pendingModels.length,
      activated: 0,
      errored: 0,
      skipped: pendingModels.length,
      missingApiKey: true
    };
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  let activated = 0;
  let errored = 0;
  let skipped = 0;

  for (const model of pendingModels) {
    const jobId = model.modelId as string;

    try {
      const job = await client.fineTuning.jobs.retrieve(jobId);
      if (!job) {
        skipped += 1;
        continue;
      }

      if (job.status === "succeeded") {
        await prisma.personalizedModel.update({
          where: { id: model.id },
          data: {
            status: ACTIVE,
            modelId: job.fine_tuned_model ?? jobId,
            summary: `Fine-tuned model ready from job ${job.id}`
          }
        });
        activated += 1;
        continue;
      }

      if (job.status === "failed" || job.status === "cancelled") {
        await prisma.personalizedModel.update({
          where: { id: model.id },
          data: {
            status: ERROR,
            summary: job.error?.message ?? model.summary ?? "Fine-tune job failed"
          }
        });
        errored += 1;
        continue;
      }

      skipped += 1;
    } catch (error) {
      console.error("Fine-tune sync failed", { jobId, error });
      await prisma.personalizedModel.update({
        where: { id: model.id },
        data: {
          status: ERROR,
          summary: error instanceof Error ? error.message : "Fine-tune sync error"
        }
      });
      errored += 1;
    }
  }

  return {
    processed: pendingModels.length,
    activated,
    errored,
    skipped,
    missingApiKey: false
  };
}
