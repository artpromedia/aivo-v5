"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { 
  Target, 
  Users,
  DoorOpen,
  Gift,
  Zap,
  HelpCircle,
  AlertTriangle,
  CheckCircle2,
  LightbulbIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { BehaviorIncident } from "./ABCDataEntry";

interface BehaviorFunctionAnalysisProps {
  incidents: BehaviorIncident[];
  className?: string;
}

interface FunctionData {
  function: string;
  label: string;
  icon: typeof Target;
  color: string;
  bgColor: string;
  count: number;
  percentage: number;
  indicators: string[];
  strategies: string[];
}

const FUNCTION_DEFINITIONS: Record<string, Omit<FunctionData, "count" | "percentage" | "indicators">> = {
  attention: {
    function: "attention",
    label: "Attention",
    icon: Users,
    color: "text-blue-600",
    bgColor: "bg-blue-100 dark:bg-blue-900",
    strategies: [
      "Provide frequent positive attention for appropriate behavior",
      "Teach appropriate ways to request attention",
      "Use planned ignoring for minor attention-seeking behaviors",
      "Implement scheduled attention breaks",
      "Reinforce peers who model appropriate attention-seeking",
    ],
  },
  escape: {
    function: "escape",
    label: "Escape/Avoidance",
    icon: DoorOpen,
    color: "text-orange-600",
    bgColor: "bg-orange-100 dark:bg-orange-900",
    strategies: [
      "Break tasks into smaller, manageable steps",
      "Provide choices within required activities",
      "Teach appropriate break request skills",
      "Use errorless learning to reduce frustration",
      "Increase reinforcement during non-preferred activities",
      "Consider task difficulty and provide scaffolding",
    ],
  },
  tangible: {
    function: "tangible",
    label: "Access to Tangibles",
    icon: Gift,
    color: "text-green-600",
    bgColor: "bg-green-100 dark:bg-green-900",
    strategies: [
      "Teach appropriate requesting skills (PECS, sign, verbal)",
      "Use visual schedules showing when items are available",
      "Implement token economy for earning preferred items",
      "Provide regular access to preferred items contingent on appropriate behavior",
      "Teach waiting and turn-taking skills",
    ],
  },
  sensory: {
    function: "sensory",
    label: "Automatic/Sensory",
    icon: Zap,
    color: "text-theme-primary",
    bgColor: "bg-theme-primary/10 dark:bg-theme-primary/20",
    strategies: [
      "Provide alternative sensory activities that meet the same need",
      "Create a sensory diet with OT consultation",
      "Modify environment to reduce sensory triggers",
      "Teach self-regulation strategies",
      "Provide scheduled sensory breaks",
      "Use response interruption and redirection (RIRD)",
    ],
  },
  multiple: {
    function: "multiple",
    label: "Multiple Functions",
    icon: Target,
    color: "text-gray-600",
    bgColor: "bg-gray-100 dark:bg-gray-800",
    strategies: [
      "Address each function identified with specific interventions",
      "Prioritize based on frequency and impact",
      "Conduct further functional analysis to differentiate",
      "Consider environmental modifications",
    ],
  },
  unknown: {
    function: "unknown",
    label: "Unknown/Undetermined",
    icon: HelpCircle,
    color: "text-gray-500",
    bgColor: "bg-gray-100 dark:bg-gray-800",
    strategies: [
      "Collect more ABC data across settings and times",
      "Consider functional analysis assessment",
      "Consult with behavior specialist",
      "Review medical and sensory factors",
    ],
  },
};

const ANTECEDENT_TO_FUNCTION: Record<string, string[]> = {
  demand: ["escape"],
  transition: ["escape", "sensory"],
  denied: ["tangible"],
  attention: ["attention"],
  sensory: ["sensory"],
  waiting: ["escape", "tangible"],
  change: ["escape", "sensory"],
  social: ["escape", "attention"],
  alone: ["attention", "sensory"],
};

const CONSEQUENCE_TO_FUNCTION: Record<string, string[]> = {
  attention: ["attention"],
  escape: ["escape"],
  tangible: ["tangible"],
  sensory: ["sensory"],
  redirection: ["attention"],
  ignored: ["sensory"],
  timeout: ["escape"],
  verbal: ["attention"],
};

export function BehaviorFunctionAnalysis({
  incidents,
  className,
}: BehaviorFunctionAnalysisProps) {
  const functionAnalysis = useMemo(() => {
    const functionCounts: Record<string, { count: number; indicators: string[] }> = {};
    
    // Initialize all functions
    Object.keys(FUNCTION_DEFINITIONS).forEach((f) => {
      functionCounts[f] = { count: 0, indicators: [] };
    });

    incidents.forEach((incident) => {
      // Use reported hypothesis if available
      if (incident.functionHypothesis && incident.functionHypothesis !== "unknown") {
        functionCounts[incident.functionHypothesis].count += 1;
      } else {
        // Analyze based on ABC data
        const antecedentFunctions = ANTECEDENT_TO_FUNCTION[incident.antecedentCategory] || [];
        const consequenceFunctions = CONSEQUENCE_TO_FUNCTION[incident.consequenceCategory] || [];
        
        // Weighted scoring based on matching patterns
        const scores: Record<string, number> = {};
        
        antecedentFunctions.forEach((f) => {
          scores[f] = (scores[f] || 0) + 1;
        });
        
        consequenceFunctions.forEach((f) => {
          scores[f] = (scores[f] || 0) + 2; // Weight consequence higher
        });

        // Find highest scoring function
        const topFunction = Object.entries(scores)
          .sort(([, a], [, b]) => b - a)[0];
        
        if (topFunction && topFunction[1] >= 2) {
          functionCounts[topFunction[0]].count += 1;
          
          // Add indicator
          const indicator = `${incident.antecedentCategory} → ${incident.behavior} → ${incident.consequenceCategory}`;
          if (!functionCounts[topFunction[0]].indicators.includes(indicator)) {
            functionCounts[topFunction[0]].indicators.push(indicator);
          }
        } else if (Object.keys(scores).length > 1) {
          functionCounts["multiple"].count += 1;
        } else {
          functionCounts["unknown"].count += 1;
        }
      }
    });

    const total = incidents.length || 1;
    
    return Object.entries(FUNCTION_DEFINITIONS)
      .map(([key, def]) => ({
        ...def,
        count: functionCounts[key].count,
        percentage: (functionCounts[key].count / total) * 100,
        indicators: functionCounts[key].indicators.slice(0, 3),
      }))
      .sort((a, b) => b.count - a.count);
  }, [incidents]);

  const primaryFunction = functionAnalysis.find((f) => f.count > 0);

  if (incidents.length === 0) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Function Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Record behavior incidents to see function analysis
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Behavior Function Analysis
        </CardTitle>
        <CardDescription>
          Analysis based on {incidents.length} recorded incidents
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Function Distribution */}
        <div className="space-y-3">
          {functionAnalysis
            .filter((f) => f.count > 0)
            .map((func) => {
              const Icon = func.icon;
              return (
                <div
                  key={func.function}
                  className={cn("p-4 rounded-lg", func.bgColor)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon className={cn("h-5 w-5", func.color)} />
                      <span className="font-semibold">{func.label}</span>
                    </div>
                    <Badge variant="secondary">
                      {func.count} ({func.percentage.toFixed(0)}%)
                    </Badge>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="h-2 bg-white/50 dark:bg-black/20 rounded-full overflow-hidden mb-3">
                    <div
                      className="h-full bg-current rounded-full transition-all"
                      style={{ width: `${func.percentage}%` }}
                    />
                  </div>

                  {/* Indicators */}
                  {func.indicators.length > 0 && (
                    <div className="mb-3">
                      <div className="text-xs font-medium mb-1 opacity-75">Common Patterns:</div>
                      <div className="flex flex-wrap gap-1">
                        {func.indicators.map((ind, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {ind}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
        </div>

        {/* Primary Function Recommendations */}
        {primaryFunction && primaryFunction.function !== "unknown" && (
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <LightbulbIcon className="h-5 w-5 text-yellow-500" />
              Recommended Strategies for {primaryFunction.label}
            </h4>
            <div className="space-y-2">
              {primaryFunction.strategies.map((strategy, i) => (
                <div key={i} className="flex items-start gap-2 p-2 bg-muted rounded-lg">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <span className="text-sm">{strategy}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg flex gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0" />
          <div className="text-sm text-yellow-700 dark:text-yellow-300">
            <strong>Note:</strong> This analysis is based on ABC data patterns and should be 
            confirmed through formal functional behavior assessment (FBA) by a qualified 
            behavior analyst before implementing intervention strategies.
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
