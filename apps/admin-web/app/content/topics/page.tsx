"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { AivoApiClient } from "@aivo/api-client";
import type { CurriculumTopic, Region, CurriculumStandard } from "@aivo/types";
import {
  BookOpen,
  Plus,
  Search,
  GraduationCap,
  Globe,
  FileText,
  Tag,
  X,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { AdminCard, AdminCardHeader, AdminCardTitle } from "../../../components/AdminCard";
import { AdminButton } from "../../../components/AdminButton";

export default function CurriculumTopicsPage() {
  const [topics, setTopics] = useState<CurriculumTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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

  const filteredTopics = useMemo(() => {
    if (!searchQuery.trim()) return topics;
    const query = searchQuery.toLowerCase();
    return topics.filter(
      topic =>
        topic.title.toLowerCase().includes(query) ||
        topic.code?.toLowerCase().includes(query) ||
        topic.subject.toLowerCase().includes(query)
    );
  }, [topics, searchQuery]);

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

  const subjectColors: Record<string, { bg: string; text: string; border: string }> = {
    math: { bg: "bg-violet-100", text: "text-violet-700", border: "border-violet-200" },
    ela: { bg: "bg-sky-100", text: "text-sky-700", border: "border-sky-200" },
    science: { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-200" },
    social_studies: { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200" },
    sel: { bg: "bg-pink-100", text: "text-pink-700", border: "border-pink-200" },
  };

  const getSubjectColor = (subject: string) => {
    return subjectColors[subject] || { bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-200" };
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-lavender-50 to-lavender-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <header className="bg-white rounded-3xl shadow-xl p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-violet-100 flex items-center justify-center">
                <BookOpen className="w-7 h-7 text-violet-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Curriculum Topics</h1>
                <p className="text-slate-500">Manage curriculum topics and learning standards</p>
              </div>
            </div>
            <AdminButton
              variant="primary"
              onClick={() => setShowCreateForm(!showCreateForm)}
              icon={showCreateForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            >
              {showCreateForm ? "Cancel" : "New Topic"}
            </AdminButton>
          </div>
        </header>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search topics by title, code, or subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border border-lavender-200 shadow-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-slate-900 placeholder:text-slate-400"
          />
        </div>

        {/* Error Display */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Create Form */}
        {showCreateForm && (
          <AdminCard padding="lg">
            <AdminCardHeader>
              <AdminCardTitle icon={<Plus className="w-5 h-5" />}>
                Create New Topic
              </AdminCardTitle>
            </AdminCardHeader>
            
            <form onSubmit={handleCreateTopic} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-slate-700 mb-2">
                    Subject *
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-lavender-50 border border-lavender-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-slate-900"
                  >
                    <option value="math">Math</option>
                    <option value="ela">ELA / Literacy</option>
                    <option value="science">Science</option>
                    <option value="social_studies">Social Studies</option>
                    <option value="sel">SEL</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="grade" className="block text-sm font-medium text-slate-700 mb-2">
                    Grade *
                  </label>
                  <input
                    id="grade"
                    type="number"
                    name="grade"
                    value={formData.grade}
                    onChange={handleInputChange}
                    required
                    min="1"
                    max="12"
                    className="w-full px-4 py-3 bg-white border border-lavender-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-slate-900"
                  />
                </div>

                <div>
                  <label htmlFor="region" className="block text-sm font-medium text-slate-700 mb-2">
                    Region *
                  </label>
                  <select
                    id="region"
                    name="region"
                    value={formData.region}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-lavender-50 border border-lavender-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-slate-900"
                  >
                    {regionOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="standard" className="block text-sm font-medium text-slate-700 mb-2">
                    Curriculum Standard *
                  </label>
                  <select
                    id="standard"
                    name="standard"
                    value={formData.standard}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-lavender-50 border border-lavender-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-slate-900"
                  >
                    {standardOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="code" className="block text-sm font-medium text-slate-700 mb-2">
                    Code *
                  </label>
                  <input
                    id="code"
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., MATH-5-FRAC-01"
                    className="w-full px-4 py-3 bg-white border border-lavender-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-slate-900 placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-2">
                    Title *
                  </label>
                  <input
                    id="title"
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., Understanding Fractions"
                    className="w-full px-4 py-3 bg-white border border-lavender-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-slate-900 placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Describe the learning objectives and key concepts..."
                  className="w-full px-4 py-3 bg-white border border-lavender-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-slate-900 placeholder:text-slate-400 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-lavender-100">
                <AdminButton
                  type="button"
                  variant="secondary"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </AdminButton>
                <AdminButton
                  type="submit"
                  variant="primary"
                  loading={creating}
                  icon={<Plus className="w-4 h-4" />}
                >
                  {creating ? "Creating..." : "Create Topic"}
                </AdminButton>
              </div>
            </form>
          </AdminCard>
        )}

        {/* Topics List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-10 h-10 text-violet-600 animate-spin mb-4" />
            <p className="text-slate-500">Loading topics...</p>
          </div>
        ) : filteredTopics.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl shadow-lg">
            <BookOpen className="w-16 h-16 text-lavender-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              {searchQuery ? "No topics found" : "No topics yet"}
            </h3>
            <p className="text-slate-500 max-w-md mx-auto">
              {searchQuery
                ? "Try adjusting your search query."
                : "Create your first curriculum topic to get started."}
            </p>
            {!searchQuery && (
              <AdminButton
                variant="primary"
                className="mt-6"
                onClick={() => setShowCreateForm(true)}
                icon={<Plus className="w-4 h-4" />}
              >
                Create First Topic
              </AdminButton>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTopics.map((topic) => {
              const subjectColor = getSubjectColor(topic.subject);
              return (
                <AdminCard
                  key={topic.id}
                  className="hover:shadow-xl transition-all hover:border-violet-200 cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <span className={`px-3 py-1.5 ${subjectColor.bg} ${subjectColor.text} text-xs font-semibold rounded-full uppercase tracking-wide`}>
                      {topic.subject.replace(/_/g, " ")}
                    </span>
                    <span className="flex items-center gap-1 text-sm text-slate-500">
                      <GraduationCap className="w-4 h-4" />
                      Grade {topic.grade}
                    </span>
                  </div>
                  
                  <h3 className="font-semibold text-lg text-slate-900 mb-2 group-hover:text-violet-600 transition-colors">
                    {topic.title}
                  </h3>
                  
                  <p className="text-sm text-slate-500 mb-4 line-clamp-2">
                    {topic.description || "No description provided"}
                  </p>
                  
                  <div className="flex flex-wrap gap-2">
                    {topic.code && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-lavender-50 text-slate-600 text-xs rounded-lg border border-lavender-100">
                        <Tag className="w-3 h-3" />
                        {topic.code}
                      </span>
                    )}
                    {topic.region && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-lavender-50 text-slate-600 text-xs rounded-lg border border-lavender-100">
                        <Globe className="w-3 h-3" />
                        {topic.region.replace(/_/g, " ")}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-lavender-50 text-slate-600 text-xs rounded-lg border border-lavender-100">
                      <FileText className="w-3 h-3" />
                      {topic.standard.replace(/_/g, " ")}
                    </span>
                  </div>
                </AdminCard>
              );
            })}
          </div>
        )}

        {/* Stats Footer */}
        {!loading && topics.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-lavender-100 p-4">
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500">
              <span className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-violet-500" />
                <strong className="text-slate-900">{topics.length}</strong> Total Topics
              </span>
              <span className="hidden sm:block text-lavender-300">•</span>
              <span>
                Showing <strong className="text-slate-900">{filteredTopics.length}</strong> results
              </span>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
