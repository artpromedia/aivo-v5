"use client";

import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Upload,
  FileText,
  Target,
  BookOpen,
  Briefcase,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";

export default function IEPManagementPage() {
  const params = useParams();
  const router = useRouter();
  const learnerId = (params?.learnerId as string) || "";

  const features = [
    {
      title: "Upload IEP Document",
      description: "Upload a PDF and let AI extract goals, services, and accommodations automatically",
      icon: Upload,
      href: `/teacher/learners/${learnerId}/iep/upload`,
      color: "text-blue-600 bg-blue-100 dark:bg-blue-900",
    },
    {
      title: "Goal Templates",
      description: "Browse SMART-compliant goal templates organized by domain",
      icon: BookOpen,
      href: `/teacher/learners/${learnerId}/iep/templates`,
      color: "text-purple-600 bg-purple-100 dark:bg-purple-900",
    },
    {
      title: "Current Goals",
      description: "View and manage the student's active IEP goals",
      icon: Target,
      href: `/teacher/learners/${learnerId}/goals`,
      color: "text-green-600 bg-green-100 dark:bg-green-900",
    },
    {
      title: "Services",
      description: "Track related services like speech therapy, OT, and counseling",
      icon: Briefcase,
      href: `/teacher/learners/${learnerId}/services`,
      color: "text-orange-600 bg-orange-100 dark:bg-orange-900",
    },
    {
      title: "Accommodations",
      description: "Manage classroom and testing accommodations",
      icon: Shield,
      href: `/teacher/learners/${learnerId}/accommodations`,
      color: "text-pink-600 bg-pink-100 dark:bg-pink-900",
    },
  ];

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">IEP Management</h1>
          <p className="text-muted-foreground">
            Upload, extract, and manage IEP documents with AI assistance
          </p>
        </div>
      </div>

      {/* Feature cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <div
              key={feature.title}
              className="cursor-pointer"
              onClick={() => router.push(feature.href)}
            >
              <Card className="h-full hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className={`w-10 h-10 rounded-lg ${feature.color} flex items-center justify-center mb-2`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            </div>
          );
        })}
      </div>

      {/* Quick stats or recent activity could go here */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            AI-Powered IEP Extraction
          </CardTitle>
          <CardDescription>
            How AIVO helps with IEP document management
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <h4 className="font-medium">1. Upload</h4>
              <p className="text-sm text-muted-foreground">
                Upload the student's IEP as a PDF document. We support both digital
                and scanned documents with OCR.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">2. Extract</h4>
              <p className="text-sm text-muted-foreground">
                AI automatically identifies and extracts goals, services,
                accommodations, and present levels from the document.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">3. Review & Approve</h4>
              <p className="text-sm text-muted-foreground">
                Review extracted data with SMART criteria analysis, make edits,
                and approve to create trackable goals.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
