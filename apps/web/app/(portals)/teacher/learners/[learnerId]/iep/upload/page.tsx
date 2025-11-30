"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, FileText, Upload, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { IEPUploader, IEPDocumentList } from "@/components/iep";

export default function IEPUploadPage() {
  const params = useParams();
  const router = useRouter();
  const learnerId = (params?.learnerId as string) || "";
  const [activeTab, setActiveTab] = useState<"upload" | "documents">("upload");

  const handleUploadComplete = (documentId: string) => {
    router.push(`/teacher/learners/${learnerId}/iep/documents/${documentId}/review`);
  };

  const handleSelectDocument = (documentId: string) => {
    router.push(`/teacher/learners/${learnerId}/iep/documents/${documentId}/review`);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">IEP Document Management</h1>
          <p className="text-muted-foreground">
            Upload and manage IEP documents with AI-powered extraction
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <Button
          variant={activeTab === "upload" ? "default" : "ghost"}
          onClick={() => setActiveTab("upload")}
          className="rounded-b-none"
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload New
        </Button>
        <Button
          variant={activeTab === "documents" ? "default" : "ghost"}
          onClick={() => setActiveTab("documents")}
          className="rounded-b-none"
        >
          <History className="h-4 w-4 mr-2" />
          Previous Documents
        </Button>
      </div>

      {/* Content */}
      {activeTab === "upload" ? (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Upload section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload IEP Document
              </CardTitle>
              <CardDescription>
                Upload a PDF of the student's IEP. Our AI will automatically extract
                goals, services, accommodations, and present levels.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <IEPUploader
                learnerId={learnerId}
                onUploadComplete={handleUploadComplete}
                onError={(error) => console.error(error)}
              />
            </CardContent>
          </Card>

          {/* Info section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>How It Works</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
                    1
                  </div>
                  <div>
                    <h4 className="font-medium">Upload</h4>
                    <p className="text-sm text-muted-foreground">
                      Upload the IEP PDF document. Files are scanned for security.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
                    2
                  </div>
                  <div>
                    <h4 className="font-medium">AI Extraction</h4>
                    <p className="text-sm text-muted-foreground">
                      OCR extracts text, then AI identifies goals, services, and accommodations.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
                    3
                  </div>
                  <div>
                    <h4 className="font-medium">SMART Validation</h4>
                    <p className="text-sm text-muted-foreground">
                      Goals are analyzed against SMART criteria with improvement suggestions.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
                    4
                  </div>
                  <div>
                    <h4 className="font-medium">Review & Approve</h4>
                    <p className="text-sm text-muted-foreground">
                      Review extracted data, make edits, and approve to add to the system.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Supported Formats</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    PDF documents (up to 25MB)
                  </li>
                  <li className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    Scanned IEPs (OCR enabled)
                  </li>
                  <li className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    Digital/text-based PDFs
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Previous IEP Documents
            </CardTitle>
            <CardDescription>
              View and manage previously uploaded IEP documents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <IEPDocumentList
              learnerId={learnerId}
              onSelectDocument={handleSelectDocument}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
