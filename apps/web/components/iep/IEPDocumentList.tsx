"use client";

import { useState, useEffect } from "react";
import { FileText, CheckCircle2, AlertTriangle, Clock, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

interface IEPDocument {
  id: string;
  filename: string;
  status: string;
  uploaded_at: string;
  processing_completed_at?: string;
  extracted_counts?: {
    goals: number;
    services: number;
    accommodations: number;
    present_levels: number;
  };
  verification_progress?: {
    goals_verified: number;
    goals_total: number;
    services_verified: number;
    services_total: number;
    accommodations_verified: number;
    accommodations_total: number;
  };
}

interface IEPDocumentListProps {
  learnerId: string;
  onSelectDocument?: (documentId: string) => void;
  className?: string;
}

export function IEPDocumentList({
  learnerId,
  onSelectDocument,
  className,
}: IEPDocumentListProps) {
  const [documents, setDocuments] = useState<IEPDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDocuments();
  }, [learnerId]);

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/iep/documents/${learnerId}`);
      if (!response.ok) throw new Error("Failed to fetch documents");
      const data = await response.json();
      setDocuments(data);
    } catch (error) {
      console.error("Error fetching documents:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
      case "SCANNING":
      case "OCR_PROCESSING":
      case "EXTRACTING":
      case "VALIDATING":
        return (
          <Badge variant="warning" className="gap-1">
            <Clock className="h-3 w-3" />
            Processing
          </Badge>
        );
      case "EXTRACTED":
        return (
          <Badge variant="secondary" className="gap-1">
            <AlertTriangle className="h-3 w-3" />
            Needs Review
          </Badge>
        );
      case "REVIEWED":
        return (
          <Badge variant="success" className="gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Reviewed
          </Badge>
        );
      case "FAILED":
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="h-3 w-3" />
            Failed
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getVerificationProgress = (doc: IEPDocument) => {
    if (!doc.verification_progress) return null;

    const { goals_verified, goals_total, services_verified, services_total, accommodations_verified, accommodations_total } =
      doc.verification_progress;

    const totalVerified = goals_verified + services_verified + accommodations_verified;
    const totalItems = goals_total + services_total + accommodations_total;

    if (totalItems === 0) return null;

    const percentage = Math.round((totalVerified / totalItems) * 100);

    return (
      <div className="flex items-center gap-2">
        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              percentage === 100 ? "bg-green-600" : "bg-primary"
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-xs text-muted-foreground">{percentage}%</span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className={cn("text-center py-8 text-muted-foreground", className)}>
        Loading documents...
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className={cn("text-center py-8", className)}>
        <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground">No IEP documents uploaded yet</p>
        <p className="text-sm text-muted-foreground mt-1">
          Upload a document to get started with AI-powered extraction
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {documents.map((doc) => (
        <div
          key={doc.id}
          className={cn(
            "border rounded-lg p-4 hover:border-primary/50 transition-colors cursor-pointer",
            doc.status === "REVIEWED" && "border-green-200 dark:border-green-800"
          )}
          onClick={() => onSelectDocument?.(doc.id)}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <FileText className="h-8 w-8 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h4 className="font-medium truncate">{doc.filename}</h4>
                  {getStatusBadge(doc.status)}
                </div>

                <p className="text-xs text-muted-foreground mb-2">
                  Uploaded {new Date(doc.uploaded_at).toLocaleDateString()}
                  {doc.processing_completed_at && (
                    <> • Processed {new Date(doc.processing_completed_at).toLocaleDateString()}</>
                  )}
                </p>

                {/* Extracted counts */}
                {doc.extracted_counts && (
                  <div className="flex gap-3 text-xs text-muted-foreground mb-2">
                    <span>{doc.extracted_counts.goals} goals</span>
                    <span>{doc.extracted_counts.services} services</span>
                    <span>{doc.extracted_counts.accommodations} accommodations</span>
                  </div>
                )}

                {/* Verification progress */}
                {doc.status === "EXTRACTED" && getVerificationProgress(doc)}
              </div>
            </div>

            <Button variant="ghost" size="icon" className="flex-shrink-0">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
