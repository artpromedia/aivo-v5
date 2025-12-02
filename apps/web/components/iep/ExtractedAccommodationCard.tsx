"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

interface ExtractedAccommodation {
  id: string;
  category: string;
  applies_to: string;
  accommodation_text: string;
  implementation_notes?: string;
  confidence_score: number;
  is_verified: boolean;
  verified_by?: string;
  verified_at?: string;
  page_number?: number;
}

interface ExtractedAccommodationCardProps {
  accommodation: ExtractedAccommodation;
  onVerify: (accommodationId: string) => Promise<void>;
  onDelete: (accommodationId: string) => Promise<void>;
  className?: string;
}

export function ExtractedAccommodationCard({
  accommodation,
  onVerify,
  onDelete,
  className,
}: ExtractedAccommodationCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleVerify = async () => {
    setIsLoading(true);
    try {
      await onVerify(accommodation.id);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this accommodation?")) return;
    setIsLoading(true);
    try {
      await onDelete(accommodation.id);
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      PRESENTATION: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      RESPONSE: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      SETTING: "bg-theme-primary/10 text-theme-primary dark:bg-theme-primary/20 dark:text-theme-primary",
      TIMING: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      SCHEDULING: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
      OTHER: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
    };
    return colors[category] || colors.OTHER;
  };

  const getAppliesToColor = (appliesTo: string) => {
    const colors: Record<string, string> = {
      INSTRUCTION: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
      ASSESSMENT: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      BOTH: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
      OTHER: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
    };
    return colors[appliesTo] || colors.OTHER;
  };

  const formatLabel = (text: string) => {
    return text
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const getConfidenceBadge = () => {
    if (accommodation.confidence_score >= 0.9) {
      return <Badge variant="success">High</Badge>;
    } else if (accommodation.confidence_score >= 0.7) {
      return <Badge variant="warning">Medium</Badge>;
    } else {
      return <Badge variant="destructive">Low</Badge>;
    }
  };

  return (
    <div
      className={cn(
        "border rounded-lg p-4 transition-all",
        accommodation.is_verified
          ? "border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20"
          : "border-border",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={getCategoryColor(accommodation.category)}>
            {formatLabel(accommodation.category)}
          </Badge>
          <Badge className={getAppliesToColor(accommodation.applies_to)}>
            {formatLabel(accommodation.applies_to)}
          </Badge>
          {getConfidenceBadge()}
          {accommodation.is_verified && (
            <Badge variant="success" className="gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Verified
            </Badge>
          )}
          {accommodation.page_number && (
            <span className="text-xs text-muted-foreground">Page {accommodation.page_number}</span>
          )}
        </div>

        {!accommodation.is_verified && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            disabled={isLoading}
            title="Delete accommodation"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Accommodation text */}
      <p className="text-sm mb-2">{accommodation.accommodation_text}</p>

      {/* Implementation notes */}
      {accommodation.implementation_notes && (
        <div className="mt-2 p-2 bg-muted/50 rounded text-sm">
          <span className="font-medium text-xs text-muted-foreground">Implementation Notes: </span>
          {accommodation.implementation_notes}
        </div>
      )}

      {/* Verification section */}
      {accommodation.is_verified ? (
        <div className="mt-3 text-xs text-muted-foreground">
          Verified by {accommodation.verified_by} on{" "}
          {accommodation.verified_at && new Date(accommodation.verified_at).toLocaleString()}
        </div>
      ) : (
        <div className="mt-3">
          <Button size="sm" onClick={handleVerify} disabled={isLoading} className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Verify
          </Button>
        </div>
      )}
    </div>
  );
}
