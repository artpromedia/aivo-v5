"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { AivoApiClient } from "@aivo/api-client";
import type { CurriculumTopic, Region, CurriculumStandard } from "@aivo/types";

export default function CurriculumTopicsPage() {
  const [topics, setTopics] = useState<CurriculumTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    subject: "math",
    grade: 5,
    region: "north_america" as Region,
    standard: "us_common_core" as CurriculumStandard,
    code: "",
    title: "",
    description: ""
  });

  // Initialize API client (in production, get token from auth context)
  const apiClient = useMemo(
    () => new AivoApiClient("http://localhost:4000", async () => "demo-token"),
    []
  );

  const getErrorMessage = (err: unknown, fallback: string) => {
    if (err instanceof Error && err.message) {
      return err.message;
    }

    if (typeof err === "string" && err.length > 0) {
      return err;
    }

    return fallback;
  };

  const loadTopics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.listCurriculumTopics();
      setTopics(response.topics);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to load topics"));
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  useEffect(() => {
    void loadTopics();
  }, [loadTopics]);

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreating(true);
      setError(null);
      await apiClient.createCurriculumTopic({
        subject: formData.subject,
        grade: formData.grade,
        region: formData.region,
        standard: formData.standard,
        code: formData.code || undefined,
        title: formData.title,
        description: formData.description || undefined
      });
      
      // Reset form and reload topics
      setFormData({
        subject: "math",
        grade: 5,
        region: "north_america",
        standard: "us_common_core",
        code: "",
        title: "",
        description: ""
      });
      setShowCreateForm(false);
      await loadTopics();
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to create topic"));
    } finally {
      setCreating(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "grade" ? parseInt(value) : value
    }));
  };

  const regionOptions: { label: string; value: Region }[] = [
    { label: "North America", value: "north_america" },
    { label: "Africa", value: "africa" },
    { label: "Europe", value: "europe" },
    { label: "Australia", value: "australia" },
    { label: "Middle East", value: "middle_east" },
    { label: "Asia", value: "asia" }
  ];

  const standardOptions: { label: string; value: CurriculumStandard }[] = [
    { label: "US Common Core", value: "us_common_core" },
    { label: "US State Specific", value: "us_state_specific" },
    { label: "Cambridge", value: "cambridge" },
    { label: "IB", value: "ib" },
    { label: "Local / National", value: "local_national" },
    { label: "Custom", value: "custom" }
  ];

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-coral">Curriculum Topics</h1>
            <p className="text-slate-400 mt-2">Manage curriculum topics and learning standards</p>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-4 py-2 bg-coral hover:bg-coral-dark text-white rounded-lg font-semibold transition"
          >
            {showCreateForm ? "Cancel" : "+ New Topic"}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-500 rounded-lg text-red-300">
            {error}
          </div>
        )}

        {/* Create Form */}
        {showCreateForm && (
          <form onSubmit={handleCreateTopic} className="mb-8 p-6 bg-slate-900 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Create New Topic</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-2">Subject *</label>
                <select
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-coral"
                >
                  <option value="math">Math</option>
                  <option value="ela">ELA / Literacy</option>
                  <option value="science">Science</option>
                  <option value="social_studies">Social Studies</option>
                  <option value="sel">SEL</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Grade *</label>
                <input
                  type="number"
                  name="grade"
                  value={formData.grade}
                  onChange={handleInputChange}
                  required
                  min="1"
                  max="12"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-coral"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Region *</label>
                <select
                  name="region"
                  value={formData.region}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-coral"
                >
                  {regionOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Curriculum Standard *</label>
                <select
                  name="standard"
                  value={formData.standard}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-coral"
                >
                  {standardOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Code *</label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., MATH-5-FRAC-01"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-coral"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., Understanding Fractions"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-coral"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                placeholder="Describe the learning objectives and key concepts..."
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-coral"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating}
                className="px-4 py-2 bg-coral hover:bg-coral-dark text-white rounded-lg font-semibold transition disabled:opacity-50"
              >
                {creating ? "Creating..." : "Create Topic"}
              </button>
            </div>
          </form>
        )}

        {/* Topics List */}
        {loading ? (
          <div className="text-center py-12 text-slate-400">Loading topics...</div>
        ) : topics.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            No topics yet. Create your first curriculum topic to get started.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {topics.map((topic) => (
              <div
                key={topic.id}
                className="p-5 bg-slate-900 rounded-lg hover:bg-slate-800 transition border border-slate-800 hover:border-coral"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="px-2 py-1 bg-coral/20 text-coral text-xs font-semibold rounded">
                    {topic.subject}
                  </span>
                  <span className="text-sm text-slate-400">Grade {topic.grade}</span>
                </div>
                
                <h3 className="font-semibold text-lg mb-2">{topic.title}</h3>
                
                <p className="text-sm text-slate-400 mb-3 line-clamp-2">
                  {topic.description || "No description"}
                </p>
                
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="px-2 py-1 bg-slate-800 rounded text-slate-300">
                    {topic.code}
                  </span>
                  {topic.region && (
                    <span className="px-2 py-1 bg-slate-800 rounded text-slate-300">
                      {topic.region}
                    </span>
                  )}
                  <span className="px-2 py-1 bg-slate-800 rounded text-slate-300">
                    {topic.standard}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
