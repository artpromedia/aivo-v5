/**
 * AI Provider Persistence Layer
 * Database operations for the Multi-Provider AI system
 */

import { Prisma } from "@prisma/client";
import { prisma } from "./client";

// ============================================================================
// PROVIDER CRUD OPERATIONS
// ============================================================================

export async function createAIProvider(data: {
  providerType: string;
  name: string;
  apiEndpoint?: string;
  apiKeyEncrypted?: string;
  priority?: number;
  rateLimitRpm?: number;
  rateLimitTpm?: number;
  costPer1kInput?: number;
  costPer1kOutput?: number;
  config?: Prisma.InputJsonValue;
  healthCheckUrl?: string;
}) {
  return prisma.aIProvider.create({
    data: {
      providerType: data.providerType as any,
      name: data.name,
      apiEndpoint: data.apiEndpoint,
      apiKeyEncrypted: data.apiKeyEncrypted,
      priority: data.priority ?? 100,
      rateLimitRpm: data.rateLimitRpm,
      rateLimitTpm: data.rateLimitTpm,
      costPer1kInput: data.costPer1kInput,
      costPer1kOutput: data.costPer1kOutput,
      config: data.config ?? Prisma.JsonNull,
      healthCheckUrl: data.healthCheckUrl,
      healthStatus: "UNKNOWN",
      isActive: true,
    },
    include: {
      models: true,
    },
  });
}

export async function updateAIProvider(
  id: string,
  data: {
    name?: string;
    apiEndpoint?: string;
    apiKeyEncrypted?: string;
    isActive?: boolean;
    priority?: number;
    rateLimitRpm?: number;
    rateLimitTpm?: number;
    costPer1kInput?: number;
    costPer1kOutput?: number;
    config?: Prisma.InputJsonValue;
    healthStatus?: string;
    lastHealthCheck?: Date;
    healthCheckUrl?: string;
  }
) {
  return prisma.aIProvider.update({
    where: { id },
    data: {
      ...data,
      healthStatus: data.healthStatus as any,
      updatedAt: new Date(),
    },
    include: {
      models: true,
    },
  });
}

export async function deleteAIProvider(id: string) {
  return prisma.aIProvider.delete({
    where: { id },
  });
}

export async function getAIProvider(id: string) {
  return prisma.aIProvider.findUnique({
    where: { id },
    include: {
      models: {
        where: { isActive: true },
        orderBy: { displayName: "asc" },
      },
    },
  });
}

export async function listAIProviders(options?: {
  activeOnly?: boolean;
  providerType?: string;
}) {
  return prisma.aIProvider.findMany({
    where: {
      isActive: options?.activeOnly ? true : undefined,
      providerType: options?.providerType as any,
    },
    include: {
      models: {
        where: options?.activeOnly ? { isActive: true } : undefined,
        orderBy: { displayName: "asc" },
      },
      _count: {
        select: {
          usageLogs: true,
          models: true,
        },
      },
    },
    orderBy: { priority: "asc" },
  });
}

export async function getActiveProvidersByPriority() {
  return prisma.aIProvider.findMany({
    where: {
      isActive: true,
      healthStatus: { in: ["HEALTHY", "DEGRADED"] },
    },
    include: {
      models: {
        where: { isActive: true },
      },
    },
    orderBy: { priority: "asc" },
  });
}

// ============================================================================
// MODEL CRUD OPERATIONS
// ============================================================================

export async function createAIModel(data: {
  providerId: string;
  modelIdentifier: string;
  displayName: string;
  capabilities: string[];
  maxTokens: number;
  contextWindow: number;
  costPer1kInput: number;
  costPer1kOutput: number;
  useCases?: string[];
  qualityTier?: string;
  supportedLanguages?: string[];
  isDefault?: boolean;
  metadata?: Prisma.InputJsonValue;
}) {
  // If setting as default, unset other defaults for this provider
  if (data.isDefault) {
    await prisma.aIModel.updateMany({
      where: {
        providerId: data.providerId,
        isDefault: true,
      },
      data: { isDefault: false },
    });
  }

  return prisma.aIModel.create({
    data: {
      providerId: data.providerId,
      modelIdentifier: data.modelIdentifier,
      displayName: data.displayName,
      capabilities: data.capabilities,
      maxTokens: data.maxTokens,
      contextWindow: data.contextWindow,
      costPer1kInput: data.costPer1kInput,
      costPer1kOutput: data.costPer1kOutput,
      useCases: data.useCases ?? [],
      qualityTier: (data.qualityTier as any) ?? "STANDARD",
      supportedLanguages: data.supportedLanguages ?? ["en"],
      isDefault: data.isDefault ?? false,
      isActive: true,
      metadata: data.metadata ?? Prisma.JsonNull,
    },
    include: {
      provider: true,
    },
  });
}

export async function updateAIModel(
  id: string,
  data: {
    displayName?: string;
    capabilities?: string[];
    maxTokens?: number;
    contextWindow?: number;
    costPer1kInput?: number;
    costPer1kOutput?: number;
    isActive?: boolean;
    isDefault?: boolean;
    useCases?: string[];
    qualityTier?: string;
    supportedLanguages?: string[];
    metadata?: Prisma.InputJsonValue;
  }
) {
  // If setting as default, need to get the model first to know its provider
  if (data.isDefault) {
    const model = await prisma.aIModel.findUnique({ where: { id } });
    if (model) {
      await prisma.aIModel.updateMany({
        where: {
          providerId: model.providerId,
          isDefault: true,
          id: { not: id },
        },
        data: { isDefault: false },
      });
    }
  }

  return prisma.aIModel.update({
    where: { id },
    data: {
      ...data,
      qualityTier: data.qualityTier as any,
      updatedAt: new Date(),
    },
    include: {
      provider: true,
    },
  });
}

export async function deleteAIModel(id: string) {
  return prisma.aIModel.delete({
    where: { id },
  });
}

export async function getAIModel(id: string) {
  return prisma.aIModel.findUnique({
    where: { id },
    include: {
      provider: true,
    },
  });
}

export async function getModelByIdentifier(providerId: string, modelIdentifier: string) {
  return prisma.aIModel.findUnique({
    where: {
      providerId_modelIdentifier: {
        providerId,
        modelIdentifier,
      },
    },
    include: {
      provider: true,
    },
  });
}

export async function listAIModels(options?: {
  providerId?: string;
  activeOnly?: boolean;
  capability?: string;
  useCase?: string;
  qualityTier?: string;
}) {
  return prisma.aIModel.findMany({
    where: {
      providerId: options?.providerId,
      isActive: options?.activeOnly ? true : undefined,
      capabilities: options?.capability ? { has: options.capability } : undefined,
      useCases: options?.useCase ? { has: options.useCase } : undefined,
      qualityTier: options?.qualityTier as any,
    },
    include: {
      provider: true,
    },
    orderBy: [
      { provider: { priority: "asc" } },
      { displayName: "asc" },
    ],
  });
}

export async function getDefaultModelForProvider(providerId: string) {
  return prisma.aIModel.findFirst({
    where: {
      providerId,
      isDefault: true,
      isActive: true,
    },
    include: {
      provider: true,
    },
  });
}

export async function getModelsForUseCase(useCase: string, options?: {
  qualityTier?: string;
  activeOnly?: boolean;
}) {
  return prisma.aIModel.findMany({
    where: {
      useCases: { has: useCase },
      isActive: options?.activeOnly !== false,
      qualityTier: options?.qualityTier as any,
      provider: {
        isActive: true,
        healthStatus: { in: ["HEALTHY", "DEGRADED"] },
      },
    },
    include: {
      provider: true,
    },
    orderBy: [
      { provider: { priority: "asc" } },
      { qualityTier: "desc" },
    ],
  });
}

// ============================================================================
// FALLBACK CHAIN OPERATIONS
// ============================================================================

export async function createFallbackChain(data: {
  name: string;
  description?: string;
  useCase: string;
  isDefault?: boolean;
  maxRetries?: number;
  retryDelayMs?: number;
  timeoutMs?: number;
  budgetLimit?: number;
  providers: Array<{
    providerId: string;
    priority: number;
    modelOverride?: string;
    config?: Prisma.InputJsonValue;
  }>;
}) {
  // If setting as default, unset other defaults for this use case
  if (data.isDefault) {
    await prisma.aIFallbackChain.updateMany({
      where: {
        useCase: data.useCase,
        isDefault: true,
      },
      data: { isDefault: false },
    });
  }

  return prisma.aIFallbackChain.create({
    data: {
      name: data.name,
      description: data.description,
      useCase: data.useCase,
      isDefault: data.isDefault ?? false,
      isActive: true,
      maxRetries: data.maxRetries ?? 3,
      retryDelayMs: data.retryDelayMs ?? 1000,
      timeoutMs: data.timeoutMs ?? 30000,
      budgetLimit: data.budgetLimit,
      providers: {
        create: data.providers.map((p) => ({
          providerId: p.providerId,
          priority: p.priority,
          modelOverride: p.modelOverride,
          config: p.config ?? Prisma.JsonNull,
        })),
      },
    },
    include: {
      providers: {
        include: {
          provider: true,
        },
        orderBy: { priority: "asc" },
      },
    },
  });
}

export async function updateFallbackChain(
  id: string,
  data: {
    name?: string;
    description?: string;
    isActive?: boolean;
    isDefault?: boolean;
    maxRetries?: number;
    retryDelayMs?: number;
    timeoutMs?: number;
    budgetLimit?: number;
    providers?: Array<{
      providerId: string;
      priority: number;
      modelOverride?: string;
      config?: Prisma.InputJsonValue;
    }>;
  }
) {
  // If setting as default, need to get the chain first
  if (data.isDefault) {
    const chain = await prisma.aIFallbackChain.findUnique({ where: { id } });
    if (chain) {
      await prisma.aIFallbackChain.updateMany({
        where: {
          useCase: chain.useCase,
          isDefault: true,
          id: { not: id },
        },
        data: { isDefault: false },
      });
    }
  }

  // If providers are being updated, delete existing and recreate
  if (data.providers) {
    await prisma.aIFallbackChainProvider.deleteMany({
      where: { chainId: id },
    });
  }

  return prisma.aIFallbackChain.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description,
      isActive: data.isActive,
      isDefault: data.isDefault,
      maxRetries: data.maxRetries,
      retryDelayMs: data.retryDelayMs,
      timeoutMs: data.timeoutMs,
      budgetLimit: data.budgetLimit,
      updatedAt: new Date(),
      providers: data.providers
        ? {
            create: data.providers.map((p) => ({
              providerId: p.providerId,
              priority: p.priority,
              modelOverride: p.modelOverride,
              config: p.config ?? Prisma.JsonNull,
            })),
          }
        : undefined,
    },
    include: {
      providers: {
        include: {
          provider: true,
        },
        orderBy: { priority: "asc" },
      },
    },
  });
}

export async function deleteFallbackChain(id: string) {
  return prisma.aIFallbackChain.delete({
    where: { id },
  });
}

export async function getFallbackChain(id: string) {
  return prisma.aIFallbackChain.findUnique({
    where: { id },
    include: {
      providers: {
        include: {
          provider: {
            include: {
              models: {
                where: { isActive: true },
              },
            },
          },
        },
        orderBy: { priority: "asc" },
      },
    },
  });
}

export async function listFallbackChains(options?: {
  useCase?: string;
  activeOnly?: boolean;
}) {
  return prisma.aIFallbackChain.findMany({
    where: {
      useCase: options?.useCase,
      isActive: options?.activeOnly ? true : undefined,
    },
    include: {
      providers: {
        include: {
          provider: true,
        },
        orderBy: { priority: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });
}

export async function getDefaultFallbackChainForUseCase(useCase: string) {
  return prisma.aIFallbackChain.findFirst({
    where: {
      useCase,
      isDefault: true,
      isActive: true,
    },
    include: {
      providers: {
        include: {
          provider: {
            include: {
              models: {
                where: { isActive: true },
              },
            },
          },
        },
        orderBy: { priority: "asc" },
      },
    },
  });
}

// ============================================================================
// USAGE LOGGING
// ============================================================================

export async function logAIUsage(data: {
  providerId: string;
  modelId?: string;
  tenantId?: string;
  learnerId?: string;
  userId?: string;
  useCase: string;
  requestId?: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  latencyMs: number;
  success: boolean;
  errorCode?: string;
  errorMessage?: string;
  fallbackUsed?: boolean;
  fallbackFrom?: string;
  metadata?: Prisma.InputJsonValue;
}) {
  return prisma.aIUsageLog.create({
    data: {
      providerId: data.providerId,
      modelId: data.modelId,
      tenantId: data.tenantId,
      learnerId: data.learnerId,
      userId: data.userId,
      useCase: data.useCase,
      requestId: data.requestId,
      inputTokens: data.inputTokens,
      outputTokens: data.outputTokens,
      totalTokens: data.inputTokens + data.outputTokens,
      cost: data.cost,
      latencyMs: data.latencyMs,
      success: data.success,
      errorCode: data.errorCode,
      errorMessage: data.errorMessage,
      fallbackUsed: data.fallbackUsed ?? false,
      fallbackFrom: data.fallbackFrom,
      metadata: data.metadata ?? Prisma.JsonNull,
    },
  });
}

export async function getUsageAnalytics(options: {
  startDate: Date;
  endDate: Date;
  tenantId?: string;
  providerId?: string;
  useCase?: string;
}) {
  const whereClause: Prisma.AIUsageLogWhereInput = {
    timestamp: {
      gte: options.startDate,
      lte: options.endDate,
    },
    tenantId: options.tenantId,
    providerId: options.providerId,
    useCase: options.useCase,
  };

  const [totals, byProvider, byUseCase, byDay] = await Promise.all([
    // Total aggregates
    prisma.aIUsageLog.aggregate({
      where: whereClause,
      _count: { id: true },
      _sum: {
        inputTokens: true,
        outputTokens: true,
        totalTokens: true,
        cost: true,
        latencyMs: true,
      },
      _avg: {
        latencyMs: true,
      },
    }),

    // By provider
    prisma.aIUsageLog.groupBy({
      by: ["providerId"],
      where: whereClause,
      _count: { id: true },
      _sum: {
        totalTokens: true,
        cost: true,
      },
      _avg: {
        latencyMs: true,
      },
    }),

    // By use case
    prisma.aIUsageLog.groupBy({
      by: ["useCase"],
      where: whereClause,
      _count: { id: true },
      _sum: {
        totalTokens: true,
        cost: true,
      },
    }),

    // By day (raw query for date grouping)
    prisma.$queryRaw<Array<{ date: string; requests: bigint; tokens: bigint; cost: number }>>`
      SELECT 
        DATE(timestamp) as date,
        COUNT(*) as requests,
        SUM("totalTokens") as tokens,
        SUM(cost) as cost
      FROM "AIUsageLog"
      WHERE timestamp >= ${options.startDate} AND timestamp <= ${options.endDate}
        ${options.tenantId ? Prisma.sql`AND "tenantId" = ${options.tenantId}` : Prisma.empty}
        ${options.providerId ? Prisma.sql`AND "providerId" = ${options.providerId}` : Prisma.empty}
      GROUP BY DATE(timestamp)
      ORDER BY date ASC
    `,
  ]);

  // Get provider names
  const providerIds = byProvider.map((p) => p.providerId);
  const providers = await prisma.aIProvider.findMany({
    where: { id: { in: providerIds } },
    select: { id: true, name: true },
  });
  const providerMap = new Map(providers.map((p) => [p.id, p.name]));

  // Calculate success rate
  const successCount = await prisma.aIUsageLog.count({
    where: { ...whereClause, success: true },
  });

  return {
    period: {
      start: options.startDate.toISOString(),
      end: options.endDate.toISOString(),
    },
    totalRequests: totals._count.id,
    successfulRequests: successCount,
    failedRequests: totals._count.id - successCount,
    totalTokens: totals._sum.totalTokens ?? 0,
    totalCost: totals._sum.cost ?? 0,
    averageLatencyMs: Math.round(totals._avg.latencyMs ?? 0),
    byProvider: byProvider.map((p) => ({
      providerId: p.providerId,
      providerName: providerMap.get(p.providerId) ?? "Unknown",
      requests: p._count.id,
      tokens: p._sum.totalTokens ?? 0,
      cost: p._sum.cost ?? 0,
      avgLatencyMs: Math.round(p._avg.latencyMs ?? 0),
      errorRate: 0, // Would need additional query
    })),
    byUseCase: byUseCase.map((u) => ({
      useCase: u.useCase,
      requests: u._count.id,
      tokens: u._sum.totalTokens ?? 0,
      cost: u._sum.cost ?? 0,
    })),
    byDay: byDay.map((d) => ({
      date: d.date,
      requests: Number(d.requests),
      tokens: Number(d.tokens),
      cost: d.cost,
    })),
  };
}

export async function getCostBreakdown(options: {
  startDate: Date;
  endDate: Date;
  tenantId?: string;
}) {
  const whereClause: Prisma.AIUsageLogWhereInput = {
    timestamp: {
      gte: options.startDate,
      lte: options.endDate,
    },
    tenantId: options.tenantId,
    success: true,
  };

  const [totalCost, byProvider, byUseCase, byModel] = await Promise.all([
    prisma.aIUsageLog.aggregate({
      where: whereClause,
      _sum: { cost: true },
    }),

    prisma.aIUsageLog.groupBy({
      by: ["providerId"],
      where: whereClause,
      _sum: { cost: true },
    }),

    prisma.aIUsageLog.groupBy({
      by: ["useCase"],
      where: whereClause,
      _sum: { cost: true },
    }),

    prisma.aIUsageLog.groupBy({
      by: ["modelId"],
      where: { ...whereClause, modelId: { not: null } },
      _sum: { cost: true },
    }),
  ]);

  // Get provider and model names
  const providerIds = byProvider.map((p) => p.providerId);
  const modelIds = byModel.map((m) => m.modelId).filter(Boolean) as string[];

  const [providers, models] = await Promise.all([
    prisma.aIProvider.findMany({
      where: { id: { in: providerIds } },
      select: { id: true, name: true },
    }),
    prisma.aIModel.findMany({
      where: { id: { in: modelIds } },
      select: { id: true, displayName: true, provider: { select: { name: true } } },
    }),
  ]);

  const providerMap = new Map(providers.map((p) => [p.id, p.name]));
  const modelMap = new Map(models.map((m) => [m.id, { name: m.displayName, provider: m.provider.name }]));

  const total = totalCost._sum.cost ?? 0;

  // Get budget if tenant specified
  let budget = null;
  if (options.tenantId) {
    budget = await prisma.aIBudget.findFirst({
      where: {
        tenantId: options.tenantId,
        isActive: true,
        periodStart: { lte: options.endDate },
        OR: [
          { periodEnd: null },
          { periodEnd: { gte: options.startDate } },
        ],
      },
    });
  }

  // Calculate projected monthly total
  const daysDiff = Math.max(1, Math.ceil((options.endDate.getTime() - options.startDate.getTime()) / (1000 * 60 * 60 * 24)));
  const dailyAverage = total / daysDiff;
  const projectedMonthly = dailyAverage * 30;

  return {
    period: {
      start: options.startDate.toISOString(),
      end: options.endDate.toISOString(),
    },
    totalCost: total,
    budgetAmount: budget?.budgetAmount,
    budgetRemaining: budget ? budget.budgetAmount - budget.spentAmount : undefined,
    byProvider: byProvider.map((p) => ({
      providerId: p.providerId,
      providerName: providerMap.get(p.providerId) ?? "Unknown",
      cost: p._sum.cost ?? 0,
      percentage: total > 0 ? ((p._sum.cost ?? 0) / total) * 100 : 0,
    })),
    byUseCase: byUseCase.map((u) => ({
      useCase: u.useCase,
      cost: u._sum.cost ?? 0,
      percentage: total > 0 ? ((u._sum.cost ?? 0) / total) * 100 : 0,
    })),
    byModel: byModel
      .filter((m) => m.modelId)
      .map((m) => {
        const modelInfo = modelMap.get(m.modelId!);
        return {
          modelId: m.modelId!,
          modelName: modelInfo?.name ?? "Unknown",
          provider: modelInfo?.provider ?? "Unknown",
          cost: m._sum.cost ?? 0,
          percentage: total > 0 ? ((m._sum.cost ?? 0) / total) * 100 : 0,
        };
      }),
    projectedMonthlyTotal: projectedMonthly,
  };
}

// ============================================================================
// HEALTH MONITORING
// ============================================================================

export async function logProviderHealth(data: {
  providerId: string;
  status: string;
  latencyMs?: number;
  errorMessage?: string;
}) {
  // Update provider health status
  await prisma.aIProvider.update({
    where: { id: data.providerId },
    data: {
      healthStatus: data.status as any,
      lastHealthCheck: new Date(),
    },
  });

  // Log health check
  return prisma.aIProviderHealthLog.create({
    data: {
      providerId: data.providerId,
      status: data.status as any,
      latencyMs: data.latencyMs,
      errorMessage: data.errorMessage,
    },
  });
}

export async function getProviderHealthHistory(
  providerId: string,
  options?: { limit?: number; since?: Date }
) {
  return prisma.aIProviderHealthLog.findMany({
    where: {
      providerId,
      checkedAt: options?.since ? { gte: options.since } : undefined,
    },
    orderBy: { checkedAt: "desc" },
    take: options?.limit ?? 100,
  });
}

export async function getHealthDashboard() {
  const providers = await prisma.aIProvider.findMany({
    include: {
      _count: {
        select: { models: true },
      },
      models: {
        where: { isActive: true },
        select: { id: true },
      },
    },
  });

  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Get usage stats for last 24h
  const usageStats = await prisma.aIUsageLog.groupBy({
    by: ["providerId"],
    where: {
      timestamp: { gte: yesterday },
    },
    _count: { id: true },
    _avg: { latencyMs: true },
  });

  const errorStats = await prisma.aIUsageLog.groupBy({
    by: ["providerId"],
    where: {
      timestamp: { gte: yesterday },
      success: false,
    },
    _count: { id: true },
  });

  const usageMap = new Map(usageStats.map((u) => [u.providerId, u]));
  const errorMap = new Map(errorStats.map((e) => [e.providerId, e._count.id]));

  // Get recent incidents
  const recentIncidents = await prisma.aIProviderHealthLog.findMany({
    where: {
      checkedAt: { gte: yesterday },
      status: { not: "HEALTHY" },
    },
    orderBy: { checkedAt: "desc" },
    take: 20,
  });

  // Calculate overall status
  const healthyCount = providers.filter((p) => p.healthStatus === "HEALTHY" && p.isActive).length;
  const activeCount = providers.filter((p) => p.isActive).length;
  const overallStatus: "HEALTHY" | "DEGRADED" | "UNHEALTHY" =
    healthyCount === activeCount
      ? "HEALTHY"
      : healthyCount > activeCount / 2
        ? "DEGRADED"
        : "UNHEALTHY";

  // Calculate uptime
  const healthChecks = await prisma.aIProviderHealthLog.count({
    where: { checkedAt: { gte: yesterday } },
  });
  const healthyChecks = await prisma.aIProviderHealthLog.count({
    where: {
      checkedAt: { gte: yesterday },
      status: "HEALTHY",
    },
  });
  const uptime24h = healthChecks > 0 ? (healthyChecks / healthChecks) * 100 : 100;

  // Calculate average response time
  const avgLatency = await prisma.aIUsageLog.aggregate({
    where: {
      timestamp: { gte: yesterday },
      success: true,
    },
    _avg: { latencyMs: true },
  });

  return {
    overallStatus,
    providers: providers.map((p) => {
      const usage = usageMap.get(p.id);
      const errors = errorMap.get(p.id) ?? 0;
      const requests = usage?._count.id ?? 0;
      return {
        id: p.id,
        name: p.name,
        providerType: p.providerType,
        healthStatus: p.healthStatus,
        isActive: p.isActive,
        lastHealthCheck: p.lastHealthCheck?.toISOString(),
        recentLatencyMs: usage?._avg.latencyMs ? Math.round(usage._avg.latencyMs) : undefined,
        errorRateLast24h: requests > 0 ? (errors / requests) * 100 : 0,
        requestsLast24h: requests,
        modelsCount: p._count.models,
        activeModelsCount: p.models.length,
      };
    }),
    recentIncidents: recentIncidents.map((i) => ({
      providerId: i.providerId,
      providerName: providers.find((p) => p.id === i.providerId)?.name ?? "Unknown",
      timestamp: i.checkedAt.toISOString(),
      status: i.status,
      errorMessage: i.errorMessage,
    })),
    uptime24h,
    avgResponseTime24h: Math.round(avgLatency._avg.latencyMs ?? 0),
  };
}

// ============================================================================
// BUDGET MANAGEMENT
// ============================================================================

export async function createBudget(data: {
  tenantId?: string;
  learnerId?: string;
  period: string;
  budgetAmount: number;
  alertThreshold?: number;
  hardLimit?: boolean;
}) {
  const now = new Date();
  let periodEnd: Date | null = null;

  switch (data.period) {
    case "DAILY":
      periodEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      break;
    case "WEEKLY":
      periodEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      break;
    case "MONTHLY":
      periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
      break;
    case "QUARTERLY":
      periodEnd = new Date(now.getFullYear(), now.getMonth() + 3, now.getDate());
      break;
    case "YEARLY":
      periodEnd = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
      break;
  }

  return prisma.aIBudget.create({
    data: {
      tenantId: data.tenantId,
      learnerId: data.learnerId,
      period: data.period as any,
      budgetAmount: data.budgetAmount,
      spentAmount: 0,
      alertThreshold: data.alertThreshold ?? 0.8,
      hardLimit: data.hardLimit ?? false,
      periodStart: now,
      periodEnd,
      isActive: true,
    },
  });
}

export async function updateBudget(
  id: string,
  data: {
    budgetAmount?: number;
    alertThreshold?: number;
    hardLimit?: boolean;
    isActive?: boolean;
  }
) {
  return prisma.aIBudget.update({
    where: { id },
    data: {
      ...data,
      updatedAt: new Date(),
    },
  });
}

export async function incrementBudgetSpent(budgetId: string, amount: number) {
  return prisma.aIBudget.update({
    where: { id: budgetId },
    data: {
      spentAmount: { increment: amount },
      updatedAt: new Date(),
    },
  });
}

export async function getActiveBudget(options: {
  tenantId?: string;
  learnerId?: string;
}) {
  const now = new Date();
  return prisma.aIBudget.findFirst({
    where: {
      tenantId: options.tenantId ?? null,
      learnerId: options.learnerId ?? null,
      isActive: true,
      periodStart: { lte: now },
      OR: [
        { periodEnd: null },
        { periodEnd: { gte: now } },
      ],
    },
  });
}

export async function checkBudgetStatus(options: {
  tenantId?: string;
  learnerId?: string;
}): Promise<{
  withinBudget: boolean;
  budgetAmount?: number;
  spentAmount?: number;
  remaining?: number;
  percentUsed?: number;
  hardLimit?: boolean;
  alertTriggered?: boolean;
}> {
  const budget = await getActiveBudget(options);
  
  if (!budget) {
    return { withinBudget: true };
  }

  const percentUsed = budget.spentAmount / budget.budgetAmount;
  const remaining = budget.budgetAmount - budget.spentAmount;
  const alertTriggered = percentUsed >= budget.alertThreshold;
  const withinBudget = !budget.hardLimit || budget.spentAmount < budget.budgetAmount;

  return {
    withinBudget,
    budgetAmount: budget.budgetAmount,
    spentAmount: budget.spentAmount,
    remaining,
    percentUsed: percentUsed * 100,
    hardLimit: budget.hardLimit,
    alertTriggered,
  };
}

// ============================================================================
// EXPERIMENT OPERATIONS
// ============================================================================

export async function createAIExperiment(data: {
  name: string;
  description?: string;
  useCase: string;
  trafficPercent?: number;
  variants: Array<{
    name: string;
    providerId?: string;
    modelId?: string;
    config?: Prisma.InputJsonValue;
    trafficWeight?: number;
  }>;
}) {
  return prisma.aIExperiment.create({
    data: {
      name: data.name,
      description: data.description,
      useCase: data.useCase,
      status: "DRAFT",
      trafficPercent: data.trafficPercent ?? 0.1,
      variants: {
        create: data.variants.map((v) => ({
          name: v.name,
          providerId: v.providerId,
          modelId: v.modelId,
          config: v.config ?? Prisma.JsonNull,
          trafficWeight: v.trafficWeight ?? 0.5,
        })),
      },
    },
    include: {
      variants: true,
    },
  });
}

export async function updateAIExperiment(
  id: string,
  data: {
    name?: string;
    description?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
    trafficPercent?: number;
  }
) {
  return prisma.aIExperiment.update({
    where: { id },
    data: {
      ...data,
      status: data.status as any,
      updatedAt: new Date(),
    },
    include: {
      variants: true,
    },
  });
}

export async function getRunningExperiment(useCase: string) {
  return prisma.aIExperiment.findFirst({
    where: {
      useCase,
      status: "RUNNING",
    },
    include: {
      variants: true,
    },
  });
}

export async function logExperimentResult(data: {
  experimentId: string;
  variantId: string;
  learnerId?: string;
  success: boolean;
  latencyMs: number;
  cost: number;
  qualityScore?: number;
  userFeedback?: number;
  metadata?: Prisma.InputJsonValue;
}) {
  return prisma.aIExperimentResult.create({
    data: {
      experimentId: data.experimentId,
      variantId: data.variantId,
      learnerId: data.learnerId,
      success: data.success,
      latencyMs: data.latencyMs,
      cost: data.cost,
      qualityScore: data.qualityScore,
      userFeedback: data.userFeedback,
      metadata: data.metadata ?? Prisma.JsonNull,
    },
  });
}

export async function getExperimentResults(experimentId: string) {
  const results = await prisma.aIExperimentResult.groupBy({
    by: ["variantId"],
    where: { experimentId },
    _count: { id: true },
    _avg: {
      latencyMs: true,
      cost: true,
      qualityScore: true,
      userFeedback: true,
    },
  });

  const successCounts = await prisma.aIExperimentResult.groupBy({
    by: ["variantId"],
    where: { experimentId, success: true },
    _count: { id: true },
  });

  const successMap = new Map(successCounts.map((s) => [s.variantId, s._count.id]));

  const variants = await prisma.aIExperimentVariant.findMany({
    where: { experimentId },
  });
  const variantMap = new Map(variants.map((v) => [v.id, v.name]));

  return results.map((r) => ({
    variantId: r.variantId,
    variantName: variantMap.get(r.variantId) ?? "Unknown",
    totalRequests: r._count.id,
    successfulRequests: successMap.get(r.variantId) ?? 0,
    successRate: r._count.id > 0 ? ((successMap.get(r.variantId) ?? 0) / r._count.id) * 100 : 0,
    avgLatencyMs: Math.round(r._avg.latencyMs ?? 0),
    avgCost: r._avg.cost ?? 0,
    avgQualityScore: r._avg.qualityScore,
    avgUserFeedback: r._avg.userFeedback,
  }));
}
