"use client";

import { useState } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  Edit2,
  Trash2,
  Clock,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

interface ExtractedService {
  id: string;
  service_type: string;
  service_name: string;
  provider_type?: string;
  frequency?: string;
  duration?: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  confidence_score: number;
  is_verified: boolean;
  verified_by?: string;
  verified_at?: string;
  page_number?: number;
}

interface ExtractedServiceCardProps {
  service: ExtractedService;
  onVerify: (serviceId: string) => Promise<void>;
  onDelete: (serviceId: string) => Promise<void>;
  className?: string;
}

export function ExtractedServiceCard({
  service,
  onVerify,
  onDelete,
  className,
}: ExtractedServiceCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleVerify = async () => {
    setIsLoading(true);
    try {
      await onVerify(service.id);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this service?")) return;
    setIsLoading(true);
    try {
      await onDelete(service.id);
    } finally {
      setIsLoading(false);
    }
  };

  const getServiceTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      SPECIAL_EDUCATION: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      SPEECH_THERAPY: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      OCCUPATIONAL_THERAPY: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      PHYSICAL_THERAPY: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      COUNSELING: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
      BEHAVIORAL_SUPPORT: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      VISION_SERVICES: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
      HEARING_SERVICES: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
      ASSISTIVE_TECHNOLOGY: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
      TRANSPORTATION: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      OTHER: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
    };
    return colors[type] || colors.OTHER;
  };

  const formatServiceType = (type: string) => {
    return type
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const getConfidenceBadge = () => {
    if (service.confidence_score >= 0.9) {
      return <Badge variant="success">High Confidence</Badge>;
    } else if (service.confidence_score >= 0.7) {
      return <Badge variant="warning">Medium Confidence</Badge>;
    } else {
      return <Badge variant="destructive">Low Confidence</Badge>;
    }
  };

  return (
    <div
      className={cn(
        "border rounded-lg p-4 transition-all",
        service.is_verified
          ? "border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20"
          : "border-border",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <Badge className={getServiceTypeColor(service.service_type)}>
              {formatServiceType(service.service_type)}
            </Badge>
            {getConfidenceBadge()}
            {service.is_verified && (
              <Badge variant="success" className="gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Verified
              </Badge>
            )}
            {service.page_number && (
              <span className="text-xs text-muted-foreground">Page {service.page_number}</span>
            )}
          </div>
          <h4 className="font-medium">{service.service_name}</h4>
        </div>

        {!service.is_verified && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              disabled={isLoading}
              title="Delete service"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Service details */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
        {service.provider_type && (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span>{service.provider_type}</span>
          </div>
        )}
        {service.frequency && (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{service.frequency}</span>
          </div>
        )}
        {service.duration && (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{service.duration}</span>
          </div>
        )}
        {service.location && (
          <div className="col-span-2 sm:col-span-3">
            <span className="text-muted-foreground">Location: </span>
            <span>{service.location}</span>
          </div>
        )}
        {(service.start_date || service.end_date) && (
          <div className="col-span-2 sm:col-span-3">
            <span className="text-muted-foreground">Period: </span>
            <span>
              {service.start_date && new Date(service.start_date).toLocaleDateString()}
              {service.start_date && service.end_date && " - "}
              {service.end_date && new Date(service.end_date).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>

      {/* Verification section */}
      {service.is_verified ? (
        <div className="mt-3 text-xs text-muted-foreground">
          Verified by {service.verified_by} on{" "}
          {service.verified_at && new Date(service.verified_at).toLocaleString()}
        </div>
      ) : (
        <div className="mt-4 flex items-center gap-2">
          <Button size="sm" onClick={handleVerify} disabled={isLoading} className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Verify Service
          </Button>
        </div>
      )}
    </div>
  );
}
