"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Target,
  Briefcase,
  Shield,
  FileText,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";
import {
  IEPProcessingStatus,
  ExtractedGoalCard,
  ExtractedAccommodationCard,
} from "@/components/iep";
import { cn } from "@/lib/utils";

interface ExtractedGoal {
  id: string;
  goal_text: string;
  domain: string;
  baseline?: string;
  target_criteria?: string;
  timeframe?: string;
  confidence_score: number;
  smart_analysis?: any;
  ai_suggestions?: string[];
  improved_goal?: string;
  is_verified: boolean;
  verified_by?: string;
  verified_at?: string;
  page_number?: number;
}

interface ExtractedService {
  id: string;
  service_type: string;
  service_name: string;
  frequency?: string;
  duration?: string;
  location?: string;
  provider?: string;
  start_date?: string;
  end_date?: string;
  confidence_score: number;
  is_verified: boolean;
  verified_by?: string;
  verified_at?: string;
}

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

interface ExtractedPresentLevel {
  id: string;
  domain: string;
  area: string;
  description: string;
  strengths?: string;
  needs?: string;
  baseline_data?: string;
  confidence_score: number;
  is_verified: boolean;
}

interface DocumentData {
  document_id: string;
  filename: string;
  status: string;
  goals: ExtractedGoal[];
  services: ExtractedService[];
  accommodations: ExtractedAccommodation[];
  present_levels: ExtractedPresentLevel[];
}

type TabType = "goals" | "services" | "accommodations" | "present_levels";

export default function IEPReviewPage() {
  const params = useParams();
  const router = useRouter();
  const learnerId = (params?.learnerId as string) || "";
  const docId = (params?.docId as string) || "";

  const [documentData, setDocumentData] = useState<DocumentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("goals");
  const [isApproving, setIsApproving] = useState(false);

  useEffect(() => {
    if (docId) {
      fetchDocumentData();
    }
  }, [docId]);

  const fetchDocumentData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/iep/documents/${docId}/extracted`);
      if (!response.ok) throw new Error("Failed to fetch document data");
      const data = await response.json();
      setDocumentData(data);
    } catch (error) {
      console.error("Error fetching document:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyGoal = async (goalId: string, goalText: string) => {
    try {
      await fetch(`/api/iep/documents/${docId}/goals/${goalId}/verify`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal_text: goalText }),
      });
      fetchDocumentData();
    } catch (error) {
      console.error("Error verifying goal:", error);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    // Note: Would need a delete endpoint
    console.log("Delete goal:", goalId);
  };

  const handleEditGoal = async (goalId: string, goalText: string) => {
    // Edit is handled through verify with updated text
    await handleVerifyGoal(goalId, goalText);
  };

  const handleVerifyService = async (serviceId: string) => {
    try {
      await fetch(`/api/iep/documents/${docId}/services/${serviceId}/verify`, {
        method: "PUT",
      });
      fetchDocumentData();
    } catch (error) {
      console.error("Error verifying service:", error);
    }
  };

  const handleVerifyAccommodation = async (accommodationId: string) => {
    try {
      await fetch(`/api/iep/documents/${docId}/accommodations/${accommodationId}/verify`, {
        method: "PUT",
      });
      fetchDocumentData();
    } catch (error) {
      console.error("Error verifying accommodation:", error);
    }
  };

  const handleApproveAll = async () => {
    setIsApproving(true);
    try {
      const response = await fetch(`/api/iep/documents/${docId}/approve`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to approve document");
      router.push(`/teacher/learners/${learnerId}/iep/upload`);
    } catch (error) {
      console.error("Error approving document:", error);
    } finally {
      setIsApproving(false);
    }
  };

  const getVerificationStats = () => {
    if (!documentData) return { verified: 0, total: 0, percentage: 0 };

    const goalsVerified = documentData.goals.filter((g) => g.is_verified).length;
    const servicesVerified = documentData.services.filter((s) => s.is_verified).length;
    const accommodationsVerified = documentData.accommodations.filter((a) => a.is_verified).length;

    const verified = goalsVerified + servicesVerified + accommodationsVerified;
    const total =
      documentData.goals.length +
      documentData.services.length +
      documentData.accommodations.length;

    return {
      verified,
      total,
      percentage: total > 0 ? Math.round((verified / total) * 100) : 0,
    };
  };

  const stats = getVerificationStats();
  const canApprove = stats.percentage === 100;

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!documentData) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Document not found</p>
        </div>
      </div>
    );
  }

  // Show processing status if not yet extracted
  if (
    documentData.status !== "EXTRACTED" &&
    documentData.status !== "REVIEWED"
  ) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Processing Document</h1>
            <p className="text-muted-foreground">{documentData.filename}</p>
          </div>
        </div>

        <Card className="max-w-xl mx-auto">
          <CardContent className="pt-6">
            <IEPProcessingStatus
              documentId={docId}
              onComplete={() => fetchDocumentData()}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  const tabs: { key: TabType; label: string; icon: any; count: number }[] = [
    { key: "goals", label: "Goals", icon: Target, count: documentData.goals.length },
    { key: "services", label: "Services", icon: Briefcase, count: documentData.services.length },
    { key: "accommodations", label: "Accommodations", icon: Shield, count: documentData.accommodations.length },
    { key: "present_levels", label: "Present Levels", icon: FileText, count: documentData.present_levels.length },
  ];

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Review Extracted Data</h1>
            <p className="text-muted-foreground">{documentData.filename}</p>
          </div>
        </div>

        <Button
          onClick={handleApproveAll}
          disabled={!canApprove || isApproving}
          className="gap-2"
        >
          {isApproving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle2 className="h-4 w-4" />
          )}
          Approve & Create IEP Goals
        </Button>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Verification Progress</span>
            <span className="text-sm text-muted-foreground">
              {stats.verified}/{stats.total} items verified ({stats.percentage}%)
            </span>
          </div>
          <Progress value={stats.percentage} className="h-2" />
          {!canApprove && (
            <p className="text-sm text-muted-foreground mt-2">
              Verify all extracted items to approve and create IEP goals
            </p>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2 border-b overflow-x-auto pb-px">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const verifiedCount =
            tab.key === "goals"
              ? documentData.goals.filter((g) => g.is_verified).length
              : tab.key === "services"
              ? documentData.services.filter((s) => s.is_verified).length
              : tab.key === "accommodations"
              ? documentData.accommodations.filter((a) => a.is_verified).length
              : documentData.present_levels.filter((p) => p.is_verified).length;

          return (
            <Button
              key={tab.key}
              variant={activeTab === tab.key ? "default" : "ghost"}
              onClick={() => setActiveTab(tab.key)}
              className="rounded-b-none flex-shrink-0 gap-2"
            >
              <Icon className="h-4 w-4" />
              {tab.label}
              <Badge variant={verifiedCount === tab.count ? "success" : "secondary"} className="ml-1">
                {verifiedCount}/{tab.count}
              </Badge>
            </Button>
          );
        })}
      </div>

      {/* Content */}
      <div className="space-y-4">
        {activeTab === "goals" && (
          <>
            {documentData.goals.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                No goals extracted from this document
              </p>
            ) : (
              documentData.goals.map((goal) => (
                <ExtractedGoalCard
                  key={goal.id}
                  goal={goal}
                  onVerify={handleVerifyGoal}
                  onDelete={handleDeleteGoal}
                  onEdit={handleEditGoal}
                />
              ))
            )}
          </>
        )}

        {activeTab === "services" && (
          <>
            {documentData.services.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                No services extracted from this document
              </p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {documentData.services.map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    onVerify={() => handleVerifyService(service.id)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === "accommodations" && (
          <>
            {documentData.accommodations.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                No accommodations extracted from this document
              </p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {documentData.accommodations.map((accommodation) => (
                  <ExtractedAccommodationCard
                    key={accommodation.id}
                    accommodation={accommodation}
                    onVerify={handleVerifyAccommodation}
                    onDelete={async () => {}}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === "present_levels" && (
          <>
            {documentData.present_levels.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                No present levels extracted from this document
              </p>
            ) : (
              <div className="space-y-4">
                {documentData.present_levels.map((level) => (
                  <PresentLevelCard key={level.id} level={level} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Service Card Component
function ServiceCard({
  service,
  onVerify,
}: {
  service: ExtractedService;
  onVerify: () => void;
}) {
  const [isLoading, setIsLoading] = useState(false);

  const handleVerify = async () => {
    setIsLoading(true);
    try {
      await onVerify();
    } finally {
      setIsLoading(false);
    }
  };

  const formatServiceType = (type: string) => {
    return type
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <Card className={cn(service.is_verified && "border-green-200 dark:border-green-800")}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">{service.service_name}</CardTitle>
            <CardDescription>{formatServiceType(service.service_type)}</CardDescription>
          </div>
          {service.is_verified && (
            <Badge variant="success" className="gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Verified
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="grid grid-cols-2 gap-2 text-sm">
          {service.frequency && (
            <div>
              <span className="text-muted-foreground">Frequency: </span>
              {service.frequency}
            </div>
          )}
          {service.duration && (
            <div>
              <span className="text-muted-foreground">Duration: </span>
              {service.duration}
            </div>
          )}
          {service.location && (
            <div>
              <span className="text-muted-foreground">Location: </span>
              {service.location}
            </div>
          )}
          {service.provider && (
            <div>
              <span className="text-muted-foreground">Provider: </span>
              {service.provider}
            </div>
          )}
        </div>

        {!service.is_verified && (
          <Button size="sm" onClick={handleVerify} disabled={isLoading} className="mt-2 gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Verify
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// Present Level Card Component
function PresentLevelCard({ level }: { level: ExtractedPresentLevel }) {
  const formatDomain = (domain: string) => {
    return domain
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <Card className={cn(level.is_verified && "border-green-200 dark:border-green-800")}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">{level.area}</CardTitle>
            <CardDescription>{formatDomain(level.domain)}</CardDescription>
          </div>
          {level.is_verified && (
            <Badge variant="success" className="gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Verified
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm">{level.description}</p>

        {level.strengths && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Strengths</p>
            <p className="text-sm">{level.strengths}</p>
          </div>
        )}

        {level.needs && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Needs</p>
            <p className="text-sm">{level.needs}</p>
          </div>
        )}

        {level.baseline_data && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Baseline Data</p>
            <p className="text-sm">{level.baseline_data}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
