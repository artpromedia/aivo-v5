"use client";

import { useState, useEffect } from "react";
import { Search, Filter, Plus, Target, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

interface GoalTemplate {
  id: string;
  name: string;
  domain: string;
  goal_template: string;
  baseline_template?: string;
  target_template?: string;
  measurement_method?: string;
  default_timeframe?: string;
  tags?: string[];
  usage_count: number;
  created_by?: string;
  is_system: boolean;
}

interface GoalTemplateSelectorProps {
  onSelectTemplate: (template: GoalTemplate) => void;
  selectedDomain?: string;
  className?: string;
}

export function GoalTemplateSelector({
  onSelectTemplate,
  selectedDomain,
  className,
}: GoalTemplateSelectorProps) {
  const [templates, setTemplates] = useState<GoalTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<GoalTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDomainFilter, setSelectedDomainFilter] = useState(selectedDomain || "");
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);

  const domains = [
    "ACADEMIC_READING",
    "ACADEMIC_MATH",
    "ACADEMIC_WRITING",
    "COMMUNICATION",
    "SOCIAL_EMOTIONAL",
    "ADAPTIVE",
    "MOTOR",
    "TRANSITION",
    "COGNITIVE",
    "SENSORY",
  ];

  useEffect(() => {
    fetchTemplates();
  }, []);

  useEffect(() => {
    filterTemplates();
  }, [templates, searchQuery, selectedDomainFilter]);

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/iep/templates");
      if (!response.ok) throw new Error("Failed to fetch templates");
      const data = await response.json();
      setTemplates(data);
    } catch (error) {
      console.error("Error fetching templates:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterTemplates = () => {
    let filtered = templates;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.goal_template.toLowerCase().includes(query) ||
          t.tags?.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    if (selectedDomainFilter) {
      filtered = filtered.filter((t) => t.domain === selectedDomainFilter);
    }

    setFilteredTemplates(filtered);
  };

  const formatDomain = (domain: string) => {
    return domain
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const getDomainColor = (domain: string) => {
    const colors: Record<string, string> = {
      ACADEMIC_READING: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      ACADEMIC_MATH: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      ACADEMIC_WRITING: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
      COMMUNICATION: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      SOCIAL_EMOTIONAL: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
      ADAPTIVE: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      MOTOR: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
      TRANSITION: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      COGNITIVE: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
      SENSORY: "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200",
    };
    return colors[domain] || "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const highlightPlaceholders = (text: string) => {
    // Highlight placeholders like [Student], [X], etc.
    return text.replace(
      /\[([^\]]+)\]/g,
      '<span class="bg-primary/20 text-primary px-1 rounded">[$1]</span>'
    );
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search and filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={selectedDomainFilter}
          onChange={(e) => setSelectedDomainFilter(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">All Domains</option>
          {domains.map((domain) => (
            <option key={domain} value={domain}>
              {formatDomain(domain)}
            </option>
          ))}
        </select>
      </div>

      {/* Template count */}
      <p className="text-sm text-muted-foreground">
        {filteredTemplates.length} template{filteredTemplates.length !== 1 ? "s" : ""} found
      </p>

      {/* Templates list */}
      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading templates...</div>
        ) : filteredTemplates.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No templates found. Try adjusting your search or filter.
          </div>
        ) : (
          filteredTemplates.map((template) => (
            <div
              key={template.id}
              className={cn(
                "border rounded-lg p-4 transition-all cursor-pointer hover:border-primary/50",
                expandedTemplate === template.id && "border-primary bg-primary/5"
              )}
              onClick={() => setExpandedTemplate(expandedTemplate === template.id ? null : template.id)}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h4 className="font-medium">{template.name}</h4>
                    <Badge className={getDomainColor(template.domain)}>
                      {formatDomain(template.domain)}
                    </Badge>
                    {template.is_system && (
                      <Badge variant="secondary">System</Badge>
                    )}
                  </div>
                  {template.tags && template.tags.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {template.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  Used {template.usage_count}x
                </div>
              </div>

              {/* Goal template preview/full */}
              <div className="text-sm">
                <p
                  className={cn(
                    "text-muted-foreground",
                    expandedTemplate !== template.id && "line-clamp-2"
                  )}
                  dangerouslySetInnerHTML={{
                    __html: highlightPlaceholders(template.goal_template),
                  }}
                />
              </div>

              {/* Expanded content */}
              {expandedTemplate === template.id && (
                <div className="mt-4 pt-4 border-t space-y-3">
                  {template.baseline_template && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        Baseline Template
                      </p>
                      <p
                        className="text-sm"
                        dangerouslySetInnerHTML={{
                          __html: highlightPlaceholders(template.baseline_template),
                        }}
                      />
                    </div>
                  )}

                  {template.target_template && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        Target Template
                      </p>
                      <p
                        className="text-sm"
                        dangerouslySetInnerHTML={{
                          __html: highlightPlaceholders(template.target_template),
                        }}
                      />
                    </div>
                  )}

                  {template.measurement_method && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        Measurement Method
                      </p>
                      <p className="text-sm">{template.measurement_method}</p>
                    </div>
                  )}

                  {template.default_timeframe && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        Default Timeframe
                      </p>
                      <p className="text-sm">{template.default_timeframe}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectTemplate(template);
                      }}
                      className="gap-2"
                    >
                      <Target className="h-4 w-4" />
                      Use Template
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(template.goal_template);
                      }}
                      className="gap-2"
                    >
                      <Copy className="h-4 w-4" />
                      Copy
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
