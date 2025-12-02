"use client";

import { useState, useEffect } from "react";
import {
  Cpu,
  Plus,
  RefreshCw,
  Zap,
  Clock,
  AlertCircle,
  CheckCircle2,
  PauseCircle,
  Settings,
  BarChart3,
  Link as LinkIcon,
  Layers,
  Activity,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { AdminCard, AdminCardHeader, AdminCardTitle } from "../../components/AdminCard";
import { AdminTabs, TabItem } from "../../components/AdminTabs";
import { AdminButton } from "../../components/AdminButton";
import { AdminBadge, StatusBadge } from "../../components/AdminBadge";

// Types for the AI Provider system
interface AIProvider {
  id: string;
  providerType: string;
  name: string;
  isActive: boolean;
  priority: number;
  healthStatus: string;
  lastHealthCheck?: string;
  rateLimitRpm?: number;
  rateLimitTpm?: number;
  costPer1kInput?: number;
  costPer1kOutput?: number;
  models: AIModel[];
  _count?: {
    usageLogs: number;
    models: number;
  };
}

interface AIModel {
  id: string;
  providerId: string;
  modelIdentifier: string;
  displayName: string;
  capabilities: string[];
  maxTokens: number;
  contextWindow: number;
  costPer1kInput: number;
  costPer1kOutput: number;
  isActive: boolean;
  isDefault: boolean;
  useCases: string[];
  qualityTier: string;
}

interface AIFallbackChain {
  id: string;
  name: string;
  description?: string;
  useCase: string;
  isActive: boolean;
  isDefault: boolean;
  maxRetries: number;
  timeoutMs: number;
  providers: Array<{
    providerId: string;
    priority: number;
    provider: AIProvider;
  }>;
}

interface HealthDashboard {
  overallStatus: string;
  providers: Array<{
    id: string;
    name: string;
    providerType: string;
    healthStatus: string;
    isActive: boolean;
    errorRateLast24h: number;
    requestsLast24h: number;
    recentLatencyMs?: number;
  }>;
  uptime24h: number;
  avgResponseTime24h: number;
  recentIncidents: Array<{
    providerId: string;
    providerName: string;
    timestamp: string;
    status: string;
    errorMessage?: string;
  }>;
}

interface UsageAnalytics {
  period: { start: string; end: string };
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalTokens: number;
  totalCost: number;
  averageLatencyMs: number;
  byProvider: Array<{
    providerId: string;
    providerName: string;
    requests: number;
    tokens: number;
    cost: number;
  }>;
  byUseCase: Array<{
    useCase: string;
    requests: number;
    cost: number;
  }>;
}

const PROVIDER_TYPES = [
  "OPENAI", "ANTHROPIC", "GOOGLE", "META", "COHERE", "MISTRAL",
  "HUGGINGFACE", "GROQ", "TOGETHER", "REPLICATE", "AZURE_OPENAI",
  "AWS_BEDROCK", "CUSTOM", "AIVO_BRAIN"
];

// Provider Card component
function ProviderCard({
  provider,
  onEdit,
  onToggle,
}: {
  provider: AIProvider;
  onEdit: () => void;
  onToggle: () => void;
}) {
  return (
    <AdminCard className="hover:shadow-xl transition-shadow hover:border-violet-200">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
            provider.isActive ? "bg-violet-100" : "bg-slate-100"
          }`}>
            <Cpu className={`w-6 h-6 ${provider.isActive ? "text-violet-600" : "text-slate-400"}`} />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">{provider.name}</h3>
            <p className="text-sm text-slate-500">{provider.providerType}</p>
          </div>
        </div>
        <StatusBadge status={provider.healthStatus} />
      </div>
      
      <div className="mt-5 grid grid-cols-2 gap-4">
        <div className="bg-lavender-50 rounded-xl p-3">
          <p className="text-xs text-slate-500 mb-1">Priority</p>
          <p className="font-semibold text-slate-900">{provider.priority}</p>
        </div>
        <div className="bg-lavender-50 rounded-xl p-3">
          <p className="text-xs text-slate-500 mb-1">Models</p>
          <p className="font-semibold text-slate-900">{provider.models?.length || 0}</p>
        </div>
        <div className="bg-lavender-50 rounded-xl p-3">
          <p className="text-xs text-slate-500 mb-1">Rate Limit</p>
          <p className="font-semibold text-slate-900">{provider.rateLimitRpm || "∞"} RPM</p>
        </div>
        <div className="bg-lavender-50 rounded-xl p-3">
          <p className="text-xs text-slate-500 mb-1">Cost/1k</p>
          <p className="font-semibold text-slate-900">
            ${((provider.costPer1kInput || 0) + (provider.costPer1kOutput || 0)).toFixed(4)}
          </p>
        </div>
      </div>
      
      <div className="mt-5 flex items-center justify-between gap-3">
        <AdminButton
          variant={provider.isActive ? "danger" : "success"}
          size="sm"
          onClick={onToggle}
          icon={provider.isActive ? <PauseCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
        >
          {provider.isActive ? "Disable" : "Enable"}
        </AdminButton>
        <AdminButton
          variant="secondary"
          size="sm"
          onClick={onEdit}
          icon={<Settings className="w-4 h-4" />}
        >
          Configure
        </AdminButton>
      </div>
    </AdminCard>
  );
}

// Main Admin Page Component
export default function AIProvidersPage() {
  const [activeTab, setActiveTab] = useState<string>("providers");
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [chains, setChains] = useState<AIFallbackChain[]>([]);
  const [health, setHealth] = useState<HealthDashboard | null>(null);
  const [analytics, setAnalytics] = useState<UsageAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddProvider, setShowAddProvider] = useState(false);
  const [_selectedProvider, setSelectedProvider] = useState<AIProvider | null>(null);

  // Form state for new provider
  const [newProvider, setNewProvider] = useState({
    providerType: "OPENAI",
    name: "",
    apiKey: "",
    apiEndpoint: "",
    priority: 100,
    rateLimitRpm: 60,
    rateLimitTpm: 90000,
    costPer1kInput: 0.01,
    costPer1kOutput: 0.03,
  });

  const tabs: TabItem[] = [
    { id: "providers", label: "Providers", icon: <Cpu className="w-4 h-4" /> },
    { id: "models", label: "Models", icon: <Layers className="w-4 h-4" /> },
    { id: "chains", label: "Fallback Chains", icon: <LinkIcon className="w-4 h-4" /> },
    { id: "analytics", label: "Analytics", icon: <BarChart3 className="w-4 h-4" /> },
  ];

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      // Mock data for demonstration
      setProviders([
        {
          id: "1",
          providerType: "OPENAI",
          name: "OpenAI",
          isActive: true,
          priority: 10,
          healthStatus: "HEALTHY",
          lastHealthCheck: new Date().toISOString(),
          rateLimitRpm: 60,
          rateLimitTpm: 90000,
          costPer1kInput: 0.01,
          costPer1kOutput: 0.03,
          models: [
            {
              id: "m1",
              providerId: "1",
              modelIdentifier: "gpt-4-turbo",
              displayName: "GPT-4 Turbo",
              capabilities: ["chat", "function_calling", "vision"],
              maxTokens: 4096,
              contextWindow: 128000,
              costPer1kInput: 0.01,
              costPer1kOutput: 0.03,
              isActive: true,
              isDefault: true,
              useCases: ["homework_help", "tutoring", "general"],
              qualityTier: "PREMIUM",
            },
          ],
        },
        {
          id: "2",
          providerType: "ANTHROPIC",
          name: "Anthropic",
          isActive: true,
          priority: 20,
          healthStatus: "HEALTHY",
          lastHealthCheck: new Date().toISOString(),
          rateLimitRpm: 50,
          costPer1kInput: 0.008,
          costPer1kOutput: 0.024,
          models: [
            {
              id: "m2",
              providerId: "2",
              modelIdentifier: "claude-3-sonnet-20240229",
              displayName: "Claude 3 Sonnet",
              capabilities: ["chat", "vision"],
              maxTokens: 4096,
              contextWindow: 200000,
              costPer1kInput: 0.003,
              costPer1kOutput: 0.015,
              isActive: true,
              isDefault: true,
              useCases: ["assessment", "iep_analysis", "general"],
              qualityTier: "STANDARD",
            },
          ],
        },
        {
          id: "3",
          providerType: "GOOGLE",
          name: "Google Gemini",
          isActive: true,
          priority: 30,
          healthStatus: "DEGRADED",
          lastHealthCheck: new Date().toISOString(),
          costPer1kInput: 0.0005,
          costPer1kOutput: 0.0015,
          models: [],
        },
        {
          id: "4",
          providerType: "GROQ",
          name: "Groq (Llama)",
          isActive: false,
          priority: 40,
          healthStatus: "UNKNOWN",
          costPer1kInput: 0.0001,
          costPer1kOutput: 0.0002,
          models: [],
        },
      ]);

      setChains([
        {
          id: "c1",
          name: "Homework Help Chain",
          description: "Primary chain for homework assistance",
          useCase: "homework_help",
          isActive: true,
          isDefault: true,
          maxRetries: 3,
          timeoutMs: 30000,
          providers: [
            { providerId: "1", priority: 1, provider: {} as AIProvider },
            { providerId: "2", priority: 2, provider: {} as AIProvider },
          ],
        },
        {
          id: "c2",
          name: "Assessment Chain",
          description: "Chain for assessments with high reliability",
          useCase: "assessment",
          isActive: true,
          isDefault: true,
          maxRetries: 5,
          timeoutMs: 60000,
          providers: [
            { providerId: "2", priority: 1, provider: {} as AIProvider },
            { providerId: "1", priority: 2, provider: {} as AIProvider },
          ],
        },
      ]);

      setHealth({
        overallStatus: "HEALTHY",
        providers: [
          {
            id: "1",
            name: "OpenAI",
            providerType: "OPENAI",
            healthStatus: "HEALTHY",
            isActive: true,
            errorRateLast24h: 0.5,
            requestsLast24h: 15432,
            recentLatencyMs: 450,
          },
          {
            id: "2",
            name: "Anthropic",
            providerType: "ANTHROPIC",
            healthStatus: "HEALTHY",
            isActive: true,
            errorRateLast24h: 0.2,
            requestsLast24h: 8921,
            recentLatencyMs: 520,
          },
          {
            id: "3",
            name: "Google Gemini",
            providerType: "GOOGLE",
            healthStatus: "DEGRADED",
            isActive: true,
            errorRateLast24h: 5.2,
            requestsLast24h: 3201,
            recentLatencyMs: 1200,
          },
        ],
        uptime24h: 99.8,
        avgResponseTime24h: 485,
        recentIncidents: [
          {
            providerId: "3",
            providerName: "Google Gemini",
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            status: "DEGRADED",
            errorMessage: "Rate limit exceeded",
          },
        ],
      });

      setAnalytics({
        period: {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          end: new Date().toISOString(),
        },
        totalRequests: 245678,
        successfulRequests: 243210,
        failedRequests: 2468,
        totalTokens: 125000000,
        totalCost: 1523.45,
        averageLatencyMs: 485,
        byProvider: [
          { providerId: "1", providerName: "OpenAI", requests: 150000, tokens: 75000000, cost: 950.00 },
          { providerId: "2", providerName: "Anthropic", requests: 80000, tokens: 40000000, cost: 450.00 },
          { providerId: "3", providerName: "Google Gemini", requests: 15678, tokens: 10000000, cost: 123.45 },
        ],
        byUseCase: [
          { useCase: "homework_help", requests: 120000, cost: 750.00 },
          { useCase: "tutoring", requests: 80000, cost: 500.00 },
          { useCase: "assessment", requests: 30000, cost: 200.00 },
          { useCase: "general", requests: 15678, cost: 73.45 },
        ],
      });
    } catch (error) {
      console.error("Failed to fetch data:", error);
    }
    setLoading(false);
  }

  async function handleAddProvider() {
    console.log("Adding provider:", newProvider);
    setShowAddProvider(false);
    setNewProvider({
      providerType: "OPENAI",
      name: "",
      apiKey: "",
      apiEndpoint: "",
      priority: 100,
      rateLimitRpm: 60,
      rateLimitTpm: 90000,
      costPer1kInput: 0.01,
      costPer1kOutput: 0.03,
    });
    fetchData();
  }

  async function handleToggleProvider(providerId: string) {
    const provider = providers.find((p) => p.id === providerId);
    if (!provider) return;
    
    setProviders(providers.map((p) => 
      p.id === providerId ? { ...p, isActive: !p.isActive } : p
    ));
  }

  async function runHealthCheck() {
    console.log("Running health check...");
    fetchData();
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-lavender-50 to-lavender-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full mx-auto mb-4" />
          <p className="text-slate-600">Loading AI providers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-lavender-50 to-lavender-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-lavender-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-violet-100 flex items-center justify-center">
                <Cpu className="w-7 h-7 text-violet-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">AI Provider Management</h1>
                <p className="text-slate-500">Configure and monitor AI providers, models, and fallback chains</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <AdminButton
                variant="secondary"
                onClick={runHealthCheck}
                icon={<RefreshCw className="w-4 h-4" />}
              >
                Health Check
              </AdminButton>
              <AdminButton
                variant="primary"
                onClick={() => setShowAddProvider(true)}
                icon={<Plus className="w-4 h-4" />}
              >
                Add Provider
              </AdminButton>
            </div>
          </div>
        </div>
      </div>

      {/* Health Overview */}
      {health && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <AdminCard padding="md" className="bg-gradient-to-br from-white to-lavender-50">
              <div className="flex items-center justify-between mb-2">
                <p className="text-slate-500 text-sm">Overall Status</p>
                <StatusBadge status={health.overallStatus} />
              </div>
              <p className="text-2xl font-bold text-slate-900">
                {health.providers.filter((p) => p.isActive).length} Active
              </p>
            </AdminCard>
            <AdminCard padding="md">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-violet-500" />
                <p className="text-slate-500 text-sm">24h Uptime</p>
              </div>
              <p className="text-2xl font-bold text-slate-900">{health.uptime24h}%</p>
            </AdminCard>
            <AdminCard padding="md">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-violet-500" />
                <p className="text-slate-500 text-sm">Avg Response</p>
              </div>
              <p className="text-2xl font-bold text-slate-900">{health.avgResponseTime24h}ms</p>
            </AdminCard>
            <AdminCard padding="md">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <p className="text-slate-500 text-sm">Incidents</p>
              </div>
              <p className="text-2xl font-bold text-slate-900">{health.recentIncidents.length}</p>
            </AdminCard>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AdminTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Providers Tab */}
        {activeTab === "providers" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {providers.map((provider) => (
              <ProviderCard
                key={provider.id}
                provider={provider}
                onEdit={() => setSelectedProvider(provider)}
                onToggle={() => handleToggleProvider(provider.id)}
              />
            ))}
          </div>
        )}

        {/* Models Tab */}
        {activeTab === "models" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-slate-900">AI Models</h2>
              <AdminButton variant="primary" size="sm" icon={<Plus className="w-4 h-4" />}>
                Add Model
              </AdminButton>
            </div>
            <AdminCard padding="sm">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-lavender-200">
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Model</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Provider</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Capabilities</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Tier</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Cost/1k</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-lavender-100">
                    {providers.flatMap((provider) =>
                      provider.models.map((model) => (
                        <tr key={model.id} className="hover:bg-lavender-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <p className="font-semibold text-slate-900">{model.displayName}</p>
                              <p className="text-sm text-slate-500">{model.modelIdentifier}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                            {provider.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex gap-1 flex-wrap">
                              {model.capabilities.slice(0, 3).map((cap) => (
                                <AdminBadge key={cap} variant="default" size="sm">
                                  {cap}
                                </AdminBadge>
                              ))}
                              {model.capabilities.length > 3 && (
                                <AdminBadge variant="default" size="sm">
                                  +{model.capabilities.length - 3}
                                </AdminBadge>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <AdminBadge
                              variant={
                                model.qualityTier === "PREMIUM"
                                  ? "violet"
                                  : model.qualityTier === "STANDARD"
                                    ? "info"
                                    : "default"
                              }
                            >
                              {model.qualityTier}
                            </AdminBadge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                            ${(model.costPer1kInput + model.costPer1kOutput).toFixed(4)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <AdminBadge variant={model.isActive ? "success" : "default"}>
                              {model.isActive ? "Active" : "Inactive"}
                            </AdminBadge>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </AdminCard>
          </div>
        )}

        {/* Fallback Chains Tab */}
        {activeTab === "chains" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-slate-900">Fallback Chains</h2>
              <AdminButton variant="primary" size="sm" icon={<Plus className="w-4 h-4" />}>
                Add Chain
              </AdminButton>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {chains.map((chain) => (
                <AdminCard key={chain.id}>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-slate-900">{chain.name}</h3>
                      <p className="text-sm text-slate-500">{chain.description}</p>
                    </div>
                    <div className="flex gap-2">
                      {chain.isDefault && (
                        <AdminBadge variant="violet">Default</AdminBadge>
                      )}
                      <AdminBadge variant={chain.isActive ? "success" : "default"}>
                        {chain.isActive ? "Active" : "Inactive"}
                      </AdminBadge>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-sm text-slate-500 mb-2">Use Case</p>
                    <AdminBadge variant="info">{chain.useCase}</AdminBadge>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-sm text-slate-500 mb-2">Provider Chain</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {chain.providers
                        .sort((a, b) => a.priority - b.priority)
                        .map((cp, idx) => {
                          const provider = providers.find((p) => p.id === cp.providerId);
                          return (
                            <div key={cp.providerId} className="flex items-center">
                              {idx > 0 && <span className="text-violet-400 mx-2">→</span>}
                              <span className="px-3 py-1.5 bg-violet-100 text-violet-700 rounded-xl text-sm font-medium">
                                {provider?.name || cp.providerId}
                              </span>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6 text-sm text-slate-500 pt-4 border-t border-lavender-100">
                    <span className="flex items-center gap-1">
                      <RefreshCw className="w-4 h-4" /> {chain.maxRetries} retries
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" /> {chain.timeoutMs}ms timeout
                    </span>
                  </div>
                </AdminCard>
              ))}
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === "analytics" && analytics && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <AdminCard>
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-5 h-5 text-violet-500" />
                  <p className="text-slate-500 text-sm">Total Requests</p>
                </div>
                <p className="text-2xl font-bold text-slate-900">
                  {analytics.totalRequests.toLocaleString()}
                </p>
                <p className="text-sm text-emerald-600 mt-1 flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  {((analytics.successfulRequests / analytics.totalRequests) * 100).toFixed(1)}% success
                </p>
              </AdminCard>
              <AdminCard>
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-5 h-5 text-violet-500" />
                  <p className="text-slate-500 text-sm">Total Tokens</p>
                </div>
                <p className="text-2xl font-bold text-slate-900">
                  {(analytics.totalTokens / 1000000).toFixed(1)}M
                </p>
              </AdminCard>
              <AdminCard>
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-5 h-5 text-violet-500" />
                  <p className="text-slate-500 text-sm">Total Cost (30d)</p>
                </div>
                <p className="text-2xl font-bold text-slate-900">
                  ${analytics.totalCost.toFixed(2)}
                </p>
              </AdminCard>
              <AdminCard>
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-violet-500" />
                  <p className="text-slate-500 text-sm">Avg Latency</p>
                </div>
                <p className="text-2xl font-bold text-slate-900">
                  {analytics.averageLatencyMs}ms
                </p>
              </AdminCard>
            </div>

            {/* Cost by Provider */}
            <AdminCard padding="lg">
              <AdminCardHeader>
                <AdminCardTitle icon={<BarChart3 className="w-5 h-5" />}>
                  Cost by Provider
                </AdminCardTitle>
              </AdminCardHeader>
              <div className="space-y-4">
                {analytics.byProvider.map((item) => (
                  <div key={item.providerId}>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="font-medium text-slate-700">{item.providerName}</span>
                      <span className="text-slate-500">
                        ${item.cost.toFixed(2)} ({((item.cost / analytics.totalCost) * 100).toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-lavender-100 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-violet-500 to-violet-600 h-3 rounded-full transition-all"
                        style={{ width: `${(item.cost / analytics.totalCost) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </AdminCard>

            {/* Cost by Use Case */}
            <AdminCard padding="lg">
              <AdminCardHeader>
                <AdminCardTitle icon={<Layers className="w-5 h-5" />}>
                  Requests by Use Case
                </AdminCardTitle>
              </AdminCardHeader>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {analytics.byUseCase.map((item) => (
                  <div key={item.useCase} className="text-center p-5 bg-lavender-50 rounded-2xl border border-lavender-100">
                    <p className="text-2xl font-bold text-slate-900">
                      {(item.requests / 1000).toFixed(1)}k
                    </p>
                    <p className="text-sm text-slate-600 capitalize mt-1">
                      {item.useCase.replace(/_/g, " ")}
                    </p>
                    <p className="text-xs text-violet-600 mt-2 font-semibold">${item.cost.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </AdminCard>
          </div>
        )}
      </div>

      {/* Add Provider Modal */}
      {showAddProvider && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-violet-100 flex items-center justify-center">
                  <Plus className="w-6 h-6 text-violet-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Add AI Provider</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="providerType" className="block text-sm font-medium text-slate-700 mb-2">
                    Provider Type
                  </label>
                  <select
                    id="providerType"
                    value={newProvider.providerType}
                    onChange={(e) => setNewProvider({ ...newProvider, providerType: e.target.value })}
                    className="w-full border border-lavender-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 bg-lavender-50"
                  >
                    {PROVIDER_TYPES.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="displayName" className="block text-sm font-medium text-slate-700 mb-2">
                    Display Name
                  </label>
                  <input
                    id="displayName"
                    type="text"
                    value={newProvider.name}
                    onChange={(e) => setNewProvider({ ...newProvider, name: e.target.value })}
                    className="w-full border border-lavender-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                    placeholder="e.g., OpenAI Production"
                  />
                </div>
                
                <div>
                  <label htmlFor="apiKey" className="block text-sm font-medium text-slate-700 mb-2">
                    API Key
                  </label>
                  <input
                    id="apiKey"
                    type="password"
                    value={newProvider.apiKey}
                    onChange={(e) => setNewProvider({ ...newProvider, apiKey: e.target.value })}
                    className="w-full border border-lavender-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                    placeholder="sk-..."
                  />
                </div>
                
                <div>
                  <label htmlFor="apiEndpoint" className="block text-sm font-medium text-slate-700 mb-2">
                    API Endpoint (optional)
                  </label>
                  <input
                    id="apiEndpoint"
                    type="text"
                    value={newProvider.apiEndpoint}
                    onChange={(e) => setNewProvider({ ...newProvider, apiEndpoint: e.target.value })}
                    className="w-full border border-lavender-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                    placeholder="https://api.openai.com/v1"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="priority" className="block text-sm font-medium text-slate-700 mb-2">
                      Priority
                    </label>
                    <input
                      id="priority"
                      type="number"
                      value={newProvider.priority}
                      onChange={(e) => setNewProvider({ ...newProvider, priority: parseInt(e.target.value) })}
                      className="w-full border border-lavender-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="rateLimitRpm" className="block text-sm font-medium text-slate-700 mb-2">
                      Rate Limit (RPM)
                    </label>
                    <input
                      id="rateLimitRpm"
                      type="number"
                      value={newProvider.rateLimitRpm}
                      onChange={(e) => setNewProvider({ ...newProvider, rateLimitRpm: parseInt(e.target.value) })}
                      className="w-full border border-lavender-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="costPer1kInput" className="block text-sm font-medium text-slate-700 mb-2">
                      Cost/1k Input
                    </label>
                    <input
                      id="costPer1kInput"
                      type="number"
                      step="0.001"
                      value={newProvider.costPer1kInput}
                      onChange={(e) => setNewProvider({ ...newProvider, costPer1kInput: parseFloat(e.target.value) })}
                      className="w-full border border-lavender-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="costPer1kOutput" className="block text-sm font-medium text-slate-700 mb-2">
                      Cost/1k Output
                    </label>
                    <input
                      id="costPer1kOutput"
                      type="number"
                      step="0.001"
                      value={newProvider.costPer1kOutput}
                      onChange={(e) => setNewProvider({ ...newProvider, costPer1kOutput: parseFloat(e.target.value) })}
                      className="w-full border border-lavender-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                    />
                  </div>
                </div>
              </div>
              
              <div className="mt-8 flex justify-end gap-3">
                <AdminButton
                  variant="secondary"
                  onClick={() => setShowAddProvider(false)}
                >
                  Cancel
                </AdminButton>
                <AdminButton
                  variant="primary"
                  onClick={handleAddProvider}
                  icon={<Plus className="w-4 h-4" />}
                >
                  Add Provider
                </AdminButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
