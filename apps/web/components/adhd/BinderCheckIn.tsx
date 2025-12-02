"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Checkbox } from "@/components/ui/Checkbox";
import {
  FolderOpen,
  Check,
  AlertCircle,
  Calendar,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface BinderSection {
  id: string;
  name: string;
  color: string;
  subjects: string[];
  lastChecked?: string;
  isOrganized: boolean;
}

export interface BinderCheckInRecord {
  id: string;
  date: string;
  sectionsChecked: string[];
  allOrganized: boolean;
  notes?: string;
  checkedBy?: string;
}

export interface BinderOrganization {
  id: string;
  learnerId: string;
  sections: BinderSection[];
  checkInFrequency: "DAILY" | "WEEKLY" | "BI_WEEKLY";
  lastCheckIn?: string;
  checkInHistory: BinderCheckInRecord[];
  tips?: string[];
  createdAt: string;
  updatedAt: string;
}

interface BinderCheckInProps {
  binderOrg: BinderOrganization;
  onCheckIn: (record: Omit<BinderCheckInRecord, "id">) => Promise<void>;
  onUpdateSection: (sectionId: string, updates: Partial<BinderSection>) => Promise<void>;
  className?: string;
}

const sectionColors = [
  { name: "Red", value: "#ef4444", bg: "bg-red-100", border: "border-red-300" },
  { name: "Orange", value: "#f97316", bg: "bg-orange-100", border: "border-orange-300" },
  { name: "Yellow", value: "#eab308", bg: "bg-yellow-100", border: "border-yellow-300" },
  { name: "Green", value: "#22c55e", bg: "bg-green-100", border: "border-green-300" },
  { name: "Blue", value: "#3b82f6", bg: "bg-blue-100", border: "border-blue-300" },
  { name: "Purple", value: "#a855f7", bg: "bg-purple-100", border: "border-purple-300" },
  { name: "Pink", value: "#ec4899", bg: "bg-pink-100", border: "border-pink-300" },
];

export function BinderCheckIn({
  binderOrg,
  onCheckIn,
  onUpdateSection,
  className,
}: BinderCheckInProps) {
  const [checkedSections, setCheckedSections] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [notes, setNotes] = useState("");

  const allSectionsChecked = checkedSections.size === binderOrg.sections.length;

  const toggleSection = (sectionId: string) => {
    const newChecked = new Set(checkedSections);
    if (newChecked.has(sectionId)) {
      newChecked.delete(sectionId);
    } else {
      newChecked.add(sectionId);
    }
    setCheckedSections(newChecked);
  };

  const handleCheckIn = async () => {
    setIsSubmitting(true);
    try {
      await onCheckIn({
        date: new Date().toISOString(),
        sectionsChecked: Array.from(checkedSections),
        allOrganized: allSectionsChecked,
        notes: notes || undefined,
      });
      setCheckedSections(new Set());
      setNotes("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getColorConfig = (color: string) => {
    return sectionColors.find((c) => c.value === color) || sectionColors[4];
  };

  const getCheckInStatus = () => {
    if (!binderOrg.lastCheckIn) return { status: "never", message: "No check-ins yet" };
    
    const lastCheck = new Date(binderOrg.lastCheckIn);
    const now = new Date();
    const daysSince = Math.floor((now.getTime() - lastCheck.getTime()) / (1000 * 60 * 60 * 24));
    
    const requiredDays = binderOrg.checkInFrequency === "DAILY" ? 1 :
                         binderOrg.checkInFrequency === "WEEKLY" ? 7 : 14;
    
    if (daysSince < requiredDays) {
      return { status: "good", message: `Checked ${daysSince === 0 ? "today" : `${daysSince} day${daysSince > 1 ? "s" : ""} ago`}` };
    }
    return { status: "overdue", message: `${daysSince} days since last check` };
  };

  const checkInStatus = getCheckInStatus();

  return (
    <Card className={cn("p-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FolderOpen className="h-5 w-5 text-gray-500" />
          <h3 className="font-semibold">Binder Check-In</h3>
        </div>
        <Badge
          className={cn(
            checkInStatus.status === "good"
              ? "bg-green-100 text-green-700"
              : checkInStatus.status === "overdue"
              ? "bg-red-100 text-red-700"
              : "bg-gray-100 text-gray-700"
          )}
        >
          {checkInStatus.status === "good" ? (
            <Check className="h-3 w-3 mr-1" />
          ) : checkInStatus.status === "overdue" ? (
            <AlertCircle className="h-3 w-3 mr-1" />
          ) : (
            <Calendar className="h-3 w-3 mr-1" />
          )}
          {checkInStatus.message}
        </Badge>
      </div>

      {/* Frequency Badge */}
      <div className="mb-4 text-sm text-gray-500">
        Check-in frequency:{" "}
        <span className="font-medium">
          {binderOrg.checkInFrequency === "DAILY"
            ? "Every day"
            : binderOrg.checkInFrequency === "WEEKLY"
            ? "Once a week"
            : "Every two weeks"}
        </span>
      </div>

      {/* Sections Checklist */}
      <div className="space-y-2 mb-4">
        <p className="text-sm font-medium text-gray-700">Check each organized section:</p>
        {binderOrg.sections.map((section) => {
          const colorConfig = getColorConfig(section.color);
          const isChecked = checkedSections.has(section.id);

          return (
            <div
              key={section.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer",
                colorConfig.bg,
                colorConfig.border,
                isChecked && "ring-2 ring-green-400"
              )}
              onClick={() => toggleSection(section.id)}
            >
              <div
                className="w-4 h-4 rounded-full flex-shrink-0"
                style={{ backgroundColor: section.color }}
              />
              <Checkbox
                checked={isChecked}
                onCheckedChange={() => toggleSection(section.id)}
                className="flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <span className="font-medium">{section.name}</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {section.subjects.map((subject) => (
                    <Badge key={subject} variant="outline" className="text-xs">
                      {subject}
                    </Badge>
                  ))}
                </div>
              </div>
              {isChecked && <Check className="h-5 w-5 text-green-500" />}
            </div>
          );
        })}
      </div>

      {/* Notes */}
      <div className="mb-4">
        <label className="text-sm font-medium text-gray-700 mb-1 block">
          Notes (optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any papers to file? Missing items?"
          className="w-full border rounded-lg p-2 text-sm resize-none"
          rows={2}
        />
      </div>

      {/* Submit Button */}
      <Button
        onClick={handleCheckIn}
        disabled={checkedSections.size === 0 || isSubmitting}
        className="w-full"
      >
        {isSubmitting ? (
          "Saving..."
        ) : (
          <>
            <Check className="h-4 w-4 mr-2" />
            Complete Check-In ({checkedSections.size}/{binderOrg.sections.length})
          </>
        )}
      </Button>

      {/* Tips */}
      {binderOrg.tips && binderOrg.tips.length > 0 && (
        <div className="mt-4 p-3 bg-theme-primary/5 dark:bg-theme-primary/20 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-theme-primary" />
            <span className="text-sm font-medium text-theme-primary">Organization Tips</span>
          </div>
          <ul className="text-sm text-theme-primary space-y-1">
            {binderOrg.tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-theme-primary/60">•</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* History Toggle */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowHistory(!showHistory)}
        className="w-full mt-4"
      >
        <MessageSquare className="h-4 w-4 mr-2" />
        Check-In History
        {showHistory ? (
          <ChevronUp className="h-4 w-4 ml-2" />
        ) : (
          <ChevronDown className="h-4 w-4 ml-2" />
        )}
      </Button>

      {/* History */}
      {showHistory && (
        <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
          {binderOrg.checkInHistory.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              No check-in history yet
            </p>
          ) : (
            binderOrg.checkInHistory.slice(0, 10).map((record) => (
              <div
                key={record.id}
                className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">
                    {new Date(record.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                  {record.allOrganized ? (
                    <Badge className="bg-green-100 text-green-700">All organized</Badge>
                  ) : (
                    <Badge className="bg-yellow-100 text-yellow-700">
                      {record.sectionsChecked.length}/{binderOrg.sections.length} checked
                    </Badge>
                  )}
                </div>
                {record.notes && (
                  <p className="text-gray-500 mt-1">{record.notes}</p>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </Card>
  );
}
