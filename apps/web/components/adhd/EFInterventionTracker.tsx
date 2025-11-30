"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Textarea } from "@/components/ui/Textarea";
import {
  Lightbulb,
  ThumbsUp,
  ThumbsDown,
  Plus,
  Calendar,
  User,
  Target,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type EFDomain =
  | "organization"
  | "timeManagement"
  | "planning"
  | "taskInitiation"
  | "workingMemory"
  | "metacognition"
  | "emotionalControl"
  | "flexibility";

export type EffectivenessRating = "VERY_EFFECTIVE" | "EFFECTIVE" | "SOMEWHAT_EFFECTIVE" | "NOT_EFFECTIVE";

export interface EFIntervention {
  id: string;
  learnerId: string;
  efDomain: EFDomain;
  strategy: string;
  description?: string;
  implementer: "TEACHER" | "PARENT" | "STUDENT" | "TEAM";
  startDate: string;
  endDate?: string;
  isActive: boolean;
  effectivenessRatings: {
    date: string;
    rating: EffectivenessRating;
    notes?: string;
    ratedBy?: string;
  }[];
  aiSuggested: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface EFInterventionTrackerProps {
  interventions: EFIntervention[];
  onAddIntervention: (intervention: Partial<EFIntervention>) => Promise<void>;
  onUpdateIntervention: (id: string, updates: Partial<EFIntervention>) => Promise<void>;
  onRateEffectiveness: (
    id: string,
    rating: EffectivenessRating,
    notes?: string
  ) => Promise<void>;
  onGenerateSuggestions?: (domain: EFDomain) => Promise<string[]>;
  className?: string;
}

const domainConfig: Record<EFDomain, { label: string; color: string; icon: string }> = {
  organization: { label: "Organization", color: "bg-blue-100 text-blue-700", icon: "📁" },
  timeManagement: { label: "Time Management", color: "bg-purple-100 text-purple-700", icon: "⏰" },
  planning: { label: "Planning", color: "bg-indigo-100 text-indigo-700", icon: "📝" },
  taskInitiation: { label: "Task Initiation", color: "bg-green-100 text-green-700", icon: "🚀" },
  workingMemory: { label: "Working Memory", color: "bg-yellow-100 text-yellow-700", icon: "🧠" },
  metacognition: { label: "Metacognition", color: "bg-pink-100 text-pink-700", icon: "🔍" },
  emotionalControl: { label: "Emotional Control", color: "bg-red-100 text-red-700", icon: "💚" },
  flexibility: { label: "Flexibility", color: "bg-orange-100 text-orange-700", icon: "🔄" },
};

const effectivenessConfig: Record<EffectivenessRating, { label: string; color: string }> = {
  VERY_EFFECTIVE: { label: "Very Effective", color: "bg-green-500 text-white" },
  EFFECTIVE: { label: "Effective", color: "bg-green-100 text-green-700" },
  SOMEWHAT_EFFECTIVE: { label: "Somewhat Effective", color: "bg-yellow-100 text-yellow-700" },
  NOT_EFFECTIVE: { label: "Not Effective", color: "bg-red-100 text-red-700" },
};

export function EFInterventionTracker({
  interventions,
  onAddIntervention,
  onUpdateIntervention,
  onRateEffectiveness,
  onGenerateSuggestions,
  className,
}: EFInterventionTrackerProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [ratingId, setRatingId] = useState<string | null>(null);
  const [ratingValue, setRatingValue] = useState<EffectivenessRating | null>(null);
  const [ratingNotes, setRatingNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Group interventions by domain
  const groupedInterventions = interventions.reduce((acc, intervention) => {
    const domain = intervention.efDomain;
    if (!acc[domain]) acc[domain] = [];
    acc[domain].push(intervention);
    return acc;
  }, {} as Record<EFDomain, EFIntervention[]>);

  const handleRateSubmit = async (interventionId: string) => {
    if (!ratingValue) return;
    setIsSubmitting(true);
    try {
      await onRateEffectiveness(interventionId, ratingValue, ratingNotes || undefined);
      setRatingId(null);
      setRatingValue(null);
      setRatingNotes("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getLatestRating = (intervention: EFIntervention) => {
    if (intervention.effectivenessRatings.length === 0) return null;
    return intervention.effectivenessRatings[intervention.effectivenessRatings.length - 1];
  };

  const activeCount = interventions.filter((i) => i.isActive).length;

  return (
    <Card className={cn("p-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          <h3 className="font-semibold">EF Interventions</h3>
          <Badge variant="outline">{activeCount} active</Badge>
        </div>
        <Button size="sm" onClick={() => setIsAdding(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Add Strategy
        </Button>
      </div>

      {/* Interventions by Domain */}
      <div className="space-y-4">
        {Object.entries(groupedInterventions).map(([domain, domainInterventions]) => {
          const config = domainConfig[domain as EFDomain];
          const activeInDomain = domainInterventions.filter((i) => i.isActive);

          return (
            <div key={domain} className="space-y-2">
              <div className="flex items-center gap-2">
                <span>{config.icon}</span>
                <Badge className={config.color}>{config.label}</Badge>
                <span className="text-xs text-gray-500">
                  {activeInDomain.length} active
                </span>
              </div>

              {domainInterventions.map((intervention) => {
                const isExpanded = expandedId === intervention.id;
                const latestRating = getLatestRating(intervention);
                const isRating = ratingId === intervention.id;

                return (
                  <div
                    key={intervention.id}
                    className={cn(
                      "border rounded-lg p-3 transition-all",
                      !intervention.isActive && "opacity-60 bg-gray-50"
                    )}
                  >
                    {/* Strategy Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{intervention.strategy}</h4>
                          {intervention.aiSuggested && (
                            <Badge className="bg-purple-100 text-purple-700 text-xs">
                              <Sparkles className="h-3 w-3 mr-1" />
                              AI
                            </Badge>
                          )}
                          {!intervention.isActive && (
                            <Badge variant="outline" className="text-xs">
                              Inactive
                            </Badge>
                          )}
                        </div>
                        {intervention.description && (
                          <p className="text-sm text-gray-500 mt-1">
                            {intervention.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {intervention.implementer.charAt(0) +
                              intervention.implementer.slice(1).toLowerCase()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Since{" "}
                            {new Date(intervention.startDate).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                          {latestRating && (
                            <Badge className={cn("text-xs", effectivenessConfig[latestRating.rating].color)}>
                              {effectivenessConfig[latestRating.rating].label}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedId(isExpanded ? null : intervention.id)}
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </div>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t space-y-4">
                        {/* Rate Effectiveness */}
                        {intervention.isActive && !isRating && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setRatingId(intervention.id)}
                          >
                            <Target className="h-4 w-4 mr-1" />
                            Rate Effectiveness
                          </Button>
                        )}

                        {isRating && (
                          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-3">
                            <p className="text-sm font-medium">How effective is this strategy?</p>
                            <div className="flex flex-wrap gap-2">
                              {(Object.keys(effectivenessConfig) as EffectivenessRating[]).map(
                                (rating) => (
                                  <Button
                                    key={rating}
                                    variant={ratingValue === rating ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setRatingValue(rating)}
                                    className={cn(
                                      ratingValue === rating && effectivenessConfig[rating].color
                                    )}
                                  >
                                    {rating.includes("VERY") ? (
                                      <ThumbsUp className="h-3 w-3 mr-1" />
                                    ) : rating.includes("NOT") ? (
                                      <ThumbsDown className="h-3 w-3 mr-1" />
                                    ) : null}
                                    {effectivenessConfig[rating].label}
                                  </Button>
                                )
                              )}
                            </div>
                            <Textarea
                              value={ratingNotes}
                              onChange={(e) => setRatingNotes(e.target.value)}
                              placeholder="Add notes about effectiveness..."
                              rows={2}
                            />
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleRateSubmit(intervention.id)}
                                disabled={!ratingValue || isSubmitting}
                              >
                                {isSubmitting ? "Saving..." : "Save Rating"}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setRatingId(null);
                                  setRatingValue(null);
                                  setRatingNotes("");
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Rating History */}
                        {intervention.effectivenessRatings.length > 0 && (
                          <div>
                            <h5 className="text-sm font-medium mb-2">Rating History</h5>
                            <div className="space-y-2">
                              {intervention.effectivenessRatings.map((rating, i) => (
                                <div
                                  key={i}
                                  className="flex items-center justify-between text-sm bg-gray-50 dark:bg-gray-800 rounded p-2"
                                >
                                  <div>
                                    <Badge className={cn("text-xs", effectivenessConfig[rating.rating].color)}>
                                      {effectivenessConfig[rating.rating].label}
                                    </Badge>
                                    {rating.notes && (
                                      <p className="text-gray-500 text-xs mt-1">{rating.notes}</p>
                                    )}
                                  </div>
                                  <span className="text-xs text-gray-500">
                                    {new Date(rating.date).toLocaleDateString()}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              onUpdateIntervention(intervention.id, {
                                isActive: !intervention.isActive,
                              })
                            }
                          >
                            {intervention.isActive ? "Deactivate" : "Reactivate"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}

        {Object.keys(groupedInterventions).length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Lightbulb className="h-12 w-12 mx-auto mb-2 opacity-20" />
            <p>No interventions yet</p>
            <p className="text-sm">Add strategies to support executive function skills</p>
          </div>
        )}
      </div>

      {/* Add Intervention Modal would go here */}
      {isAdding && (
        <AddInterventionForm
          onSubmit={async (data) => {
            await onAddIntervention(data);
            setIsAdding(false);
          }}
          onCancel={() => setIsAdding(false)}
          onGenerateSuggestions={onGenerateSuggestions}
        />
      )}
    </Card>
  );
}

// Add Intervention Form Component
interface AddInterventionFormProps {
  onSubmit: (data: Partial<EFIntervention>) => Promise<void>;
  onCancel: () => void;
  onGenerateSuggestions?: (domain: EFDomain) => Promise<string[]>;
}

function AddInterventionForm({
  onSubmit,
  onCancel,
  onGenerateSuggestions,
}: AddInterventionFormProps) {
  const [domain, setDomain] = useState<EFDomain>("organization");
  const [strategy, setStrategy] = useState("");
  const [description, setDescription] = useState("");
  const [implementer, setImplementer] = useState<"TEACHER" | "PARENT" | "STUDENT" | "TEAM">("TEACHER");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  const handleGenerateSuggestions = async () => {
    if (!onGenerateSuggestions) return;
    setIsLoadingSuggestions(true);
    try {
      const result = await onGenerateSuggestions(domain);
      setSuggestions(result);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleSubmit = async () => {
    if (!strategy.trim()) return;
    setIsSubmitting(true);
    try {
      await onSubmit({
        efDomain: domain,
        strategy,
        description: description || undefined,
        implementer,
        startDate: new Date().toISOString(),
        isActive: true,
        effectivenessRatings: [],
        aiSuggested: suggestions.includes(strategy),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md p-6 space-y-4">
        <h3 className="font-semibold">Add New Intervention</h3>

        {/* Domain Select */}
        <div>
          <label className="text-sm font-medium">EF Domain</label>
          <select
            value={domain}
            onChange={(e) => {
              setDomain(e.target.value as EFDomain);
              setSuggestions([]);
            }}
            className="w-full border rounded-lg p-2 mt-1"
          >
            {Object.entries(domainConfig).map(([key, { label, icon }]) => (
              <option key={key} value={key}>
                {icon} {label}
              </option>
            ))}
          </select>
        </div>

        {/* AI Suggestions */}
        {onGenerateSuggestions && (
          <div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateSuggestions}
              disabled={isLoadingSuggestions}
            >
              <Sparkles className="h-4 w-4 mr-1" />
              {isLoadingSuggestions ? "Loading..." : "Get AI Suggestions"}
            </Button>
            {suggestions.length > 0 && (
              <div className="mt-2 space-y-1">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setStrategy(s)}
                    className={cn(
                      "w-full text-left text-sm p-2 rounded border transition-all",
                      strategy === s
                        ? "border-purple-500 bg-purple-50"
                        : "border-gray-200 hover:border-purple-300"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Strategy Input */}
        <div>
          <label className="text-sm font-medium">Strategy</label>
          <input
            type="text"
            value={strategy}
            onChange={(e) => setStrategy(e.target.value)}
            placeholder="e.g., Visual checklist for morning routine"
            className="w-full border rounded-lg p-2 mt-1"
          />
        </div>

        {/* Description */}
        <div>
          <label className="text-sm font-medium">Description (optional)</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="How will this be implemented?"
            rows={2}
          />
        </div>

        {/* Implementer */}
        <div>
          <label className="text-sm font-medium">Primary Implementer</label>
          <select
            value={implementer}
            onChange={(e) => setImplementer(e.target.value as typeof implementer)}
            className="w-full border rounded-lg p-2 mt-1"
          >
            <option value="TEACHER">Teacher</option>
            <option value="PARENT">Parent</option>
            <option value="STUDENT">Student</option>
            <option value="TEAM">Team</option>
          </select>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!strategy.trim() || isSubmitting}>
            {isSubmitting ? "Adding..." : "Add Intervention"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
