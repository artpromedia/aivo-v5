"use client";

import { useState, useEffect } from "react";

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

const USE_CASES = [
  "homework_help", "assessment", "tutoring", "iep_analysis",
  "speech_analysis", "content_generation", "summarization", "general"
];

const QUALITY_TIERS = ["ECONOMY", "STANDARD", "PREMIUM"];

const CAPABILITIES = [
  "chat", "completion", "embedding", "vision", "audio", "function_calling", "streaming", "json_mode"
];

// Status badge component
function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    HEALTHY: "bg-green-100 text-green-800",
    DEGRADED: "bg-yellow-100 text-yellow-800",
    UNHEALTHY: "bg-red-100 text-red-800",
    UNKNOWN: "bg-gray-100 text-gray-800",
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || colors.UNKNOWN}`}>
      {status}
    </span>
  );
}

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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            provider.isActive ? "bg-indigo-100" : "bg-gray-100"
          }`}>
            <span className="text-lg font-bold text-indigo-600">
              {provider.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{provider.name}</h3>
            <p className="text-sm text-gray-500">{provider.providerType}</p>
          </div>
        </div>
        <StatusBadge status={provider.healthStatus} />
      </div>
      
      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-500">Priority</p>
          <p className="font-medium">{provider.priority}</p>
        </div>
        <div>
          <p className="text-gray-500">Models</p>
          <p className="font-medium">{provider.models?.length || 0}</p>
        </div>
        <div>
          <p className="text-gray-500">Rate Limit (RPM)</p>
          <p className="font-medium">{provider.rateLimitRpm || "Unlimited"}</p>
        </div>
        <div>
          <p className="text-gray-500">Cost/1k tokens</p>
          <p className="font-medium">
            ${((provider.costPer1kInput || 0) + (provider.costPer1kOutput || 0)).toFixed(4)}
          </p>
        </div>
      </div>
      
      <div className="mt-4 flex items-center justify-between">
        <button
          onClick={onToggle}
          className={`px-3 py-1 rounded text-sm font-medium ${
            provider.isActive
              ? "bg-red-100 text-red-700 hover:bg-red-200"
              : "bg-green-100 text-green-700 hover:bg-green-200"
          }`}
        >
          {provider.isActive ? "Disable" : "Enable"}
        </button>
        <button
          onClick={onEdit}
          className="px-3 py-1 rounded text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
        >
          Configure
        </button>
      </div>
    </div>
  );
}

// Main Admin Page Component
export default function AIProvidersPage() {
  const [activeTab, setActiveTab] = useState<"providers" | "models" | "chains" | "analytics">("providers");
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [chains, setChains] = useState<AIFallbackChain[]>([]);
  const [health, setHealth] = useState<HealthDashboard | null>(null);
  const [analytics, setAnalytics] = useState<UsageAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddProvider, setShowAddProvider] = useState(false);
  const [showAddModel, setShowAddModel] = useState(false);
  const [showAddChain, setShowAddChain] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<AIProvider | null>(null);

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

  // Form state for new model
  const [newModel, setNewModel] = useState({
    providerId: "",
    modelIdentifier: "",
    displayName: "",
    capabilities: ["chat"],
    maxTokens: 4096,
    contextWindow: 128000,
    costPer1kInput: 0.01,
    costPer1kOutput: 0.03,
    useCases: ["general"],
    qualityTier: "STANDARD",
    isDefault: false,
  });

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      // In a real implementation, these would be actual API calls
      // For now, we'll use mock data
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
    // In a real implementation, this would be an API call
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
    
    // In a real implementation, this would be an API call
    console.log("Toggling provider:", providerId, !provider.isActive);
    setProviders(providers.map((p) => 
      p.id === providerId ? { ...p, isActive: !p.isActive } : p
    ));
  }

  async function runHealthCheck() {
    // In a real implementation, this would trigger a health check API call
    console.log("Running health check...");
    fetchData();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">AI Provider Management</h1>
              <p className="text-gray-500">Configure and monitor AI providers, models, and fallback chains</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={runHealthCheck}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
              >
                Run Health Check
              </button>
              <button
                onClick={() => setShowAddProvider(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
              >
                Add Provider
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Health Overview */}
      {health && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <p className="text-gray-500 text-sm">Overall Status</p>
                <StatusBadge status={health.overallStatus} />
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {health.providers.filter((p) => p.isActive).length} Active
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <p className="text-gray-500 text-sm">24h Uptime</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{health.uptime24h}%</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <p className="text-gray-500 text-sm">Avg Response Time</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{health.avgResponseTime24h}ms</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <p className="text-gray-500 text-sm">Recent Incidents</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{health.recentIncidents.length}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-gray-200">
          <nav className="flex gap-8">
            {[
              { key: "providers", label: "Providers" },
              { key: "models", label: "Models" },
              { key: "chains", label: "Fallback Chains" },
              { key: "analytics", label: "Analytics" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.key
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Providers Tab */}
        {activeTab === "providers" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">AI Models</h2>
              <button
                onClick={() => setShowAddModel(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm"
              >
                Add Model
              </button>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Model</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Provider</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Capabilities</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tier</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost/1k</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {providers.flatMap((provider) =>
                    provider.models.map((model) => (
                      <tr key={model.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <p className="font-medium text-gray-900">{model.displayName}</p>
                            <p className="text-sm text-gray-500">{model.modelIdentifier}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {provider.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex gap-1 flex-wrap">
                            {model.capabilities.slice(0, 3).map((cap) => (
                              <span
                                key={cap}
                                className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded"
                              >
                                {cap}
                              </span>
                            ))}
                            {model.capabilities.length > 3 && (
                              <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                                +{model.capabilities.length - 3}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded font-medium ${
                            model.qualityTier === "PREMIUM"
                              ? "bg-purple-100 text-purple-700"
                              : model.qualityTier === "STANDARD"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-gray-100 text-gray-700"
                          }`}>
                            {model.qualityTier}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ${(model.costPer1kInput + model.costPer1kOutput).toFixed(4)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded font-medium ${
                            model.isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          }`}>
                            {model.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Fallback Chains Tab */}
        {activeTab === "chains" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Fallback Chains</h2>
              <button
                onClick={() => setShowAddChain(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm"
              >
                Add Chain
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {chains.map((chain) => (
                <div
                  key={chain.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{chain.name}</h3>
                      <p className="text-sm text-gray-500">{chain.description}</p>
                    </div>
                    <div className="flex gap-2">
                      {chain.isDefault && (
                        <span className="px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded font-medium">
                          Default
                        </span>
                      )}
                      <span className={`px-2 py-1 text-xs rounded font-medium ${
                        chain.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }`}>
                        {chain.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <p className="text-sm text-gray-500 mb-2">Use Case</p>
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                      {chain.useCase}
                    </span>
                  </div>
                  
                  <div className="mt-4">
                    <p className="text-sm text-gray-500 mb-2">Provider Chain</p>
                    <div className="flex items-center gap-2">
                      {chain.providers
                        .sort((a, b) => a.priority - b.priority)
                        .map((cp, idx) => {
                          const provider = providers.find((p) => p.id === cp.providerId);
                          return (
                            <div key={cp.providerId} className="flex items-center">
                              {idx > 0 && <span className="text-gray-400 mx-1">→</span>}
                              <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-sm">
                                {provider?.name || cp.providerId}
                              </span>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                  
                  <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
                    <span>Max Retries: {chain.maxRetries}</span>
                    <span>Timeout: {chain.timeoutMs}ms</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === "analytics" && analytics && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <p className="text-gray-500 text-sm">Total Requests</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {analytics.totalRequests.toLocaleString()}
                </p>
                <p className="text-sm text-green-600 mt-1">
                  {((analytics.successfulRequests / analytics.totalRequests) * 100).toFixed(1)}% success rate
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <p className="text-gray-500 text-sm">Total Tokens</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {(analytics.totalTokens / 1000000).toFixed(1)}M
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <p className="text-gray-500 text-sm">Total Cost (30d)</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  ${analytics.totalCost.toFixed(2)}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <p className="text-gray-500 text-sm">Avg Latency</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {analytics.averageLatencyMs}ms
                </p>
              </div>
            </div>

            {/* Cost by Provider */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Cost by Provider</h3>
              <div className="space-y-4">
                {analytics.byProvider.map((item) => (
                  <div key={item.providerId}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700">{item.providerName}</span>
                      <span className="text-gray-500">
                        ${item.cost.toFixed(2)} ({((item.cost / analytics.totalCost) * 100).toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-indigo-600 h-2 rounded-full"
                        style={{ width: `${(item.cost / analytics.totalCost) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cost by Use Case */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Requests by Use Case</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {analytics.byUseCase.map((item) => (
                  <div key={item.useCase} className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">
                      {(item.requests / 1000).toFixed(1)}k
                    </p>
                    <p className="text-sm text-gray-500 capitalize">
                      {item.useCase.replace(/_/g, " ")}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">${item.cost.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Provider Modal */}
      {showAddProvider && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Add AI Provider</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Provider Type
                  </label>
                  <select
                    value={newProvider.providerType}
                    onChange={(e) => setNewProvider({ ...newProvider, providerType: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    {PROVIDER_TYPES.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={newProvider.name}
                    onChange={(e) => setNewProvider({ ...newProvider, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="e.g., OpenAI Production"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    API Key
                  </label>
                  <input
                    type="password"
                    value={newProvider.apiKey}
                    onChange={(e) => setNewProvider({ ...newProvider, apiKey: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="sk-..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    API Endpoint (optional)
                  </label>
                  <input
                    type="text"
                    value={newProvider.apiEndpoint}
                    onChange={(e) => setNewProvider({ ...newProvider, apiEndpoint: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="https://api.openai.com/v1"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priority
                    </label>
                    <input
                      type="number"
                      value={newProvider.priority}
                      onChange={(e) => setNewProvider({ ...newProvider, priority: parseInt(e.target.value) })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rate Limit (RPM)
                    </label>
                    <input
                      type="number"
                      value={newProvider.rateLimitRpm}
                      onChange={(e) => setNewProvider({ ...newProvider, rateLimitRpm: parseInt(e.target.value) })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cost/1k Input Tokens
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      value={newProvider.costPer1kInput}
                      onChange={(e) => setNewProvider({ ...newProvider, costPer1kInput: parseFloat(e.target.value) })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cost/1k Output Tokens
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      value={newProvider.costPer1kOutput}
                      onChange={(e) => setNewProvider({ ...newProvider, costPer1kOutput: parseFloat(e.target.value) })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setShowAddProvider(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddProvider}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                >
                  Add Provider
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
