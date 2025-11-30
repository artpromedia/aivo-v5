"use client";

import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { CheckCircle2, Circle, MapPin, AlertCircle } from "lucide-react";

// Types
interface GeneralizationRecord {
  setting: string;
  locationName?: string;
  isIntroduced: boolean;
  introducedDate?: string;
  isMastered: boolean;
  masteredDate?: string;
  trialsAttempted: number;
  trialsSuccessful: number;
  successRate?: number;
  currentPromptLevel?: string;
  supportsNeeded: string[];
  barriers: string[];
  accommodations: string[];
}

interface GeneralizationMatrixProps {
  skillId: string;
  skillName: string;
  targetSettings: string[];
  records: Record<string, GeneralizationRecord>;
  onSettingClick?: (setting: string) => void;
}

const settingLabels: Record<string, string> = {
  CLASSROOM: "Classroom",
  HOME: "Home",
  SCHOOL_CAFETERIA: "School Cafeteria",
  SCHOOL_COMMON: "School Common Areas",
  COMMUNITY_STORE: "Community Store",
  COMMUNITY_RESTAURANT: "Restaurant",
  COMMUNITY_TRANSPORT: "Public Transportation",
  COMMUNITY_MEDICAL: "Medical Facility",
  COMMUNITY_RECREATION: "Recreation Center",
  COMMUNITY_WORKPLACE: "Workplace",
  COMMUNITY_GOVERNMENT: "Government Office",
  COMMUNITY_LIBRARY: "Library",
  COMMUNITY_BANK: "Bank",
  COMMUNITY_OTHER: "Other Community",
  SIMULATION: "Simulation",
  VIRTUAL: "Virtual/Online",
};

const settingIcons: Record<string, string> = {
  CLASSROOM: "🏫",
  HOME: "🏠",
  SCHOOL_CAFETERIA: "🍽️",
  SCHOOL_COMMON: "🏛️",
  COMMUNITY_STORE: "🛒",
  COMMUNITY_RESTAURANT: "🍔",
  COMMUNITY_TRANSPORT: "🚌",
  COMMUNITY_MEDICAL: "🏥",
  COMMUNITY_RECREATION: "🎾",
  COMMUNITY_WORKPLACE: "💼",
  COMMUNITY_GOVERNMENT: "🏢",
  COMMUNITY_LIBRARY: "📚",
  COMMUNITY_BANK: "🏦",
  COMMUNITY_OTHER: "🏘️",
  SIMULATION: "🎮",
  VIRTUAL: "💻",
};

export function GeneralizationMatrix({
  skillId,
  skillName,
  targetSettings,
  records,
  onSettingClick,
}: GeneralizationMatrixProps) {
  // Calculate overall stats
  const totalSettings = targetSettings.length;
  const introducedCount = targetSettings.filter(s => records[s]?.isIntroduced).length;
  const masteredCount = targetSettings.filter(s => records[s]?.isMastered).length;
  const generalizationPercent = totalSettings > 0 ? (masteredCount / totalSettings) * 100 : 0;

  // Group settings by category
  const schoolSettings = targetSettings.filter(s => s.startsWith("SCHOOL") || s === "CLASSROOM");
  const communitySettings = targetSettings.filter(s => s.startsWith("COMMUNITY"));
  const otherSettings = targetSettings.filter(s => !s.startsWith("SCHOOL") && !s.startsWith("COMMUNITY") && s !== "CLASSROOM");

  const renderSettingCard = (setting: string) => {
    const record = records[setting];
    const status = record?.isMastered ? "mastered" : record?.isIntroduced ? "introduced" : "not-started";
    
    const statusColors = {
      mastered: "bg-green-100 border-green-300",
      introduced: "bg-yellow-100 border-yellow-300",
      "not-started": "bg-gray-50 border-gray-200",
    };

    return (
      <div
        key={setting}
        onClick={() => onSettingClick?.(setting)}
        className={`
          p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md
          ${statusColors[status]}
        `}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{settingIcons[setting] || "📍"}</span>
            <div>
              <h4 className="font-medium text-sm">{settingLabels[setting] || setting}</h4>
              {record?.locationName && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {record.locationName}
                </p>
              )}
            </div>
          </div>
          <div>
            {status === "mastered" && <CheckCircle2 className="h-5 w-5 text-green-600" />}
            {status === "introduced" && <Circle className="h-5 w-5 text-yellow-600" />}
            {status === "not-started" && <Circle className="h-5 w-5 text-gray-300" />}
          </div>
        </div>

        {record && (
          <div className="mt-3 space-y-2">
            {/* Success Rate */}
            {record.trialsAttempted > 0 && (
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Success Rate</span>
                  <span className="font-medium">
                    {record.trialsSuccessful}/{record.trialsAttempted}
                    ({(record.successRate || 0).toFixed(0)}%)
                  </span>
                </div>
                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500"
                    style={{ width: `${record.successRate || 0}%` }}
                  />
                </div>
              </div>
            )}

            {/* Prompt Level */}
            {record.currentPromptLevel && (
              <p className="text-xs text-muted-foreground">
                Current: {record.currentPromptLevel.replace(/_/g, " ")}
              </p>
            )}

            {/* Barriers */}
            {record.barriers && record.barriers.length > 0 && (
              <div className="flex items-start gap-1">
                <AlertCircle className="h-3 w-3 text-orange-500 mt-0.5" />
                <p className="text-xs text-orange-600">
                  {record.barriers.slice(0, 2).join(", ")}
                  {record.barriers.length > 2 && ` +${record.barriers.length - 2} more`}
                </p>
              </div>
            )}
          </div>
        )}

        {!record && (
          <p className="mt-2 text-xs text-muted-foreground">
            Not yet introduced in this setting
          </p>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-lg">{skillName}</h3>
            <p className="text-sm text-muted-foreground">Generalization across settings</p>
          </div>
          <Badge 
            className={`
              ${generalizationPercent >= 80 ? "bg-green-100 text-green-800" : 
                generalizationPercent >= 50 ? "bg-yellow-100 text-yellow-800" : 
                "bg-gray-100 text-gray-800"}
            `}
          >
            {generalizationPercent.toFixed(0)}% Generalized
          </Badge>
        </div>

        {/* Overall Progress */}
        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold">{masteredCount}</p>
            <p className="text-xs text-muted-foreground">Mastered</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold">{introducedCount - masteredCount}</p>
            <p className="text-xs text-muted-foreground">In Progress</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold">{totalSettings - introducedCount}</p>
            <p className="text-xs text-muted-foreground">Not Started</p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* School Settings */}
        {schoolSettings.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
              🏫 School Settings
              <Badge variant="outline" className="text-xs">
                {schoolSettings.filter(s => records[s]?.isMastered).length}/{schoolSettings.length}
              </Badge>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {schoolSettings.map(renderSettingCard)}
            </div>
          </div>
        )}

        {/* Community Settings */}
        {communitySettings.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
              🏘️ Community Settings
              <Badge variant="outline" className="text-xs">
                {communitySettings.filter(s => records[s]?.isMastered).length}/{communitySettings.length}
              </Badge>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {communitySettings.map(renderSettingCard)}
            </div>
          </div>
        )}

        {/* Other Settings */}
        {otherSettings.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
              📍 Other Settings
              <Badge variant="outline" className="text-xs">
                {otherSettings.filter(s => records[s]?.isMastered).length}/{otherSettings.length}
              </Badge>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {otherSettings.map(renderSettingCard)}
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="mt-6 pt-4 border-t flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4 text-green-600" /> Mastered
          </span>
          <span className="flex items-center gap-1">
            <Circle className="h-4 w-4 text-yellow-600" /> In Progress
          </span>
          <span className="flex items-center gap-1">
            <Circle className="h-4 w-4 text-gray-300" /> Not Started
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export default GeneralizationMatrix;
