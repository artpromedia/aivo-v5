"use client";

import { useMemo } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Brain, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EFDomainRatings {
  organization: number; // 1-5
  timeManagement: number;
  planning: number;
  taskInitiation: number;
  workingMemory: number;
  metacognition: number;
  emotionalControl: number;
  flexibility: number;
}

export interface ExecutiveFunctionProfile {
  id: string;
  learnerId: string;
  assessmentDate: string;
  ratings: EFDomainRatings;
  strengths: string[];
  challenges: string[];
  accommodations: string[];
  strategies: string[];
  assessedBy?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface EFRadarChartProps {
  profile: ExecutiveFunctionProfile;
  previousProfile?: ExecutiveFunctionProfile;
  size?: "sm" | "md" | "lg";
  showLegend?: boolean;
  showTrends?: boolean;
  className?: string;
}

const domainLabels: Record<keyof EFDomainRatings, { label: string; shortLabel: string; description: string }> = {
  organization: {
    label: "Organization",
    shortLabel: "ORG",
    description: "Keeping materials, spaces, and thoughts organized",
  },
  timeManagement: {
    label: "Time Management",
    shortLabel: "TIME",
    description: "Estimating and allocating time effectively",
  },
  planning: {
    label: "Planning",
    shortLabel: "PLAN",
    description: "Breaking down tasks and creating action steps",
  },
  taskInitiation: {
    label: "Task Initiation",
    shortLabel: "INIT",
    description: "Starting tasks without excessive procrastination",
  },
  workingMemory: {
    label: "Working Memory",
    shortLabel: "MEM",
    description: "Holding and manipulating information mentally",
  },
  metacognition: {
    label: "Metacognition",
    shortLabel: "META",
    description: "Self-awareness and self-monitoring",
  },
  emotionalControl: {
    label: "Emotional Control",
    shortLabel: "EMO",
    description: "Managing emotions and frustration",
  },
  flexibility: {
    label: "Flexibility",
    shortLabel: "FLEX",
    description: "Adapting to changes and transitions",
  },
};

const sizeConfig = {
  sm: { width: 200, height: 200, center: 100, radius: 70, fontSize: 10, labelOffset: 85 },
  md: { width: 300, height: 300, center: 150, radius: 110, fontSize: 12, labelOffset: 130 },
  lg: { width: 400, height: 400, center: 200, radius: 150, fontSize: 14, labelOffset: 175 },
};

export function EFRadarChart({
  profile,
  previousProfile,
  size = "md",
  showLegend = true,
  showTrends = true,
  className,
}: EFRadarChartProps) {
  const config = sizeConfig[size];
  const domains = Object.keys(domainLabels) as (keyof EFDomainRatings)[];

  // Calculate points for the radar chart
  const calculatePoints = (ratings: EFDomainRatings) => {
    return domains.map((domain, i) => {
      const angle = (Math.PI * 2 * i) / domains.length - Math.PI / 2;
      const value = ratings[domain] / 5; // Normalize to 0-1
      const r = config.radius * value;
      return {
        x: config.center + r * Math.cos(angle),
        y: config.center + r * Math.sin(angle),
        domain,
        value: ratings[domain],
      };
    });
  };

  const currentPoints = useMemo(() => calculatePoints(profile.ratings), [profile.ratings]);
  const previousPoints = useMemo(
    () => (previousProfile ? calculatePoints(previousProfile.ratings) : null),
    [previousProfile]
  );

  // Generate polygon path
  const generatePath = (points: { x: number; y: number }[]) => {
    return points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";
  };

  // Calculate average score
  const averageScore = useMemo(() => {
    const sum = Object.values(profile.ratings).reduce((a, b) => a + b, 0);
    return (sum / domains.length).toFixed(1);
  }, [profile.ratings]);

  // Calculate trends
  const getTrend = (domain: keyof EFDomainRatings): "up" | "down" | "same" => {
    if (!previousProfile) return "same";
    const diff = profile.ratings[domain] - previousProfile.ratings[domain];
    if (diff > 0) return "up";
    if (diff < 0) return "down";
    return "same";
  };

  // Generate grid circles
  const gridCircles = [1, 2, 3, 4, 5].map((level) => {
    const r = (config.radius * level) / 5;
    return (
      <circle
        key={level}
        cx={config.center}
        cy={config.center}
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth={level === 5 ? 1 : 0.5}
        className="text-gray-200 dark:text-gray-700"
      />
    );
  });

  // Generate axis lines
  const axisLines = domains.map((_, i) => {
    const angle = (Math.PI * 2 * i) / domains.length - Math.PI / 2;
    const x = config.center + config.radius * Math.cos(angle);
    const y = config.center + config.radius * Math.sin(angle);
    return (
      <line
        key={i}
        x1={config.center}
        y1={config.center}
        x2={x}
        y2={y}
        stroke="currentColor"
        strokeWidth={0.5}
        className="text-gray-300 dark:text-gray-600"
      />
    );
  });

  // Generate labels
  const labels = domains.map((domain, i) => {
    const angle = (Math.PI * 2 * i) / domains.length - Math.PI / 2;
    const x = config.center + config.labelOffset * Math.cos(angle);
    const y = config.center + config.labelOffset * Math.sin(angle);
    const trend = getTrend(domain);

    return (
      <g key={domain}>
        <text
          x={x}
          y={y}
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-gray-600 dark:fill-gray-400 font-medium"
          fontSize={config.fontSize}
        >
          {domainLabels[domain].shortLabel}
        </text>
        {showTrends && previousProfile && (
          <g transform={`translate(${x + 12}, ${y - 6})`}>
            {trend === "up" && (
              <path d="M0 4L3 0L6 4" fill="none" stroke="#22c55e" strokeWidth={1.5} />
            )}
            {trend === "down" && (
              <path d="M0 0L3 4L6 0" fill="none" stroke="#ef4444" strokeWidth={1.5} />
            )}
          </g>
        )}
      </g>
    );
  });

  return (
    <Card className={cn("p-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-500" />
          <h3 className="font-semibold">Executive Function Profile</h3>
        </div>
        <Badge className="bg-purple-100 text-purple-700">
          Avg: {averageScore}/5
        </Badge>
      </div>

      {/* Radar Chart */}
      <div className="flex justify-center">
        <svg width={config.width} height={config.height} className="overflow-visible">
          {/* Grid */}
          {gridCircles}
          {axisLines}

          {/* Previous profile (if available) */}
          {previousPoints && (
            <path
              d={generatePath(previousPoints)}
              fill="none"
              stroke="currentColor"
              strokeWidth={1}
              strokeDasharray="4 2"
              className="text-gray-400"
            />
          )}

          {/* Current profile */}
          <path
            d={generatePath(currentPoints)}
            fill="currentColor"
            fillOpacity={0.2}
            stroke="currentColor"
            strokeWidth={2}
            className="text-purple-500"
          />

          {/* Data points */}
          {currentPoints.map((point, i) => (
            <circle
              key={i}
              cx={point.x}
              cy={point.y}
              r={4}
              fill="currentColor"
              className="text-purple-500"
            />
          ))}

          {/* Labels */}
          {labels}
        </svg>
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="mt-4 grid grid-cols-2 gap-2">
          {domains.map((domain) => {
            const trend = getTrend(domain);
            return (
              <div
                key={domain}
                className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm"
              >
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500" />
                  <span className="font-medium">{domainLabels[domain].label}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-bold">{profile.ratings[domain]}</span>
                  {showTrends && previousProfile && (
                    <>
                      {trend === "up" && <TrendingUp className="h-3 w-3 text-green-500" />}
                      {trend === "down" && <TrendingDown className="h-3 w-3 text-red-500" />}
                      {trend === "same" && <Minus className="h-3 w-3 text-gray-400" />}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Assessment Info */}
      <div className="mt-4 text-xs text-gray-500 text-center">
        Assessed: {new Date(profile.assessmentDate).toLocaleDateString()}
        {profile.assessedBy && ` by ${profile.assessedBy}`}
      </div>

      {/* Strengths & Challenges */}
      {(profile.strengths.length > 0 || profile.challenges.length > 0) && (
        <div className="mt-4 grid grid-cols-2 gap-4">
          {profile.strengths.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-green-700 mb-2">Strengths</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                {profile.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-1">
                    <span className="text-green-500">✓</span> {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {profile.challenges.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-orange-700 mb-2">Areas to Support</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                {profile.challenges.map((c, i) => (
                  <li key={i} className="flex items-start gap-1">
                    <span className="text-orange-500">•</span> {c}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
