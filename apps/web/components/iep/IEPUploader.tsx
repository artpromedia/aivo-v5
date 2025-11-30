"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, X, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface UploadedFile {
  file: File;
  id: string;
  status: "pending" | "uploading" | "processing" | "success" | "error";
  progress: number;
  error?: string;
  documentId?: string;
}

interface IEPUploaderProps {
  learnerId: string;
  onUploadComplete?: (documentId: string) => void;
  onError?: (error: string) => void;
  maxFiles?: number;
  maxFileSize?: number; // in MB
  className?: string;
}

export function IEPUploader({
  learnerId,
  onUploadComplete,
  onError,
  maxFiles = 5,
  maxFileSize = 25,
  className,
}: IEPUploaderProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      // Handle rejected files
      rejectedFiles.forEach((rejected) => {
        const error = rejected.errors[0];
        if (error.code === "file-too-large") {
          onError?.(`File ${rejected.file.name} is too large. Maximum size is ${maxFileSize}MB.`);
        } else if (error.code === "file-invalid-type") {
          onError?.(`File ${rejected.file.name} is not a valid PDF.`);
        }
      });

      // Add accepted files
      const newFiles: UploadedFile[] = acceptedFiles.map((file) => ({
        file,
        id: crypto.randomUUID(),
        status: "pending",
        progress: 0,
      }));

      setFiles((prev) => [...prev, ...newFiles].slice(0, maxFiles));
    },
    [maxFiles, maxFileSize, onError]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    maxSize: maxFileSize * 1024 * 1024,
    maxFiles: maxFiles - files.length,
    disabled: isUploading || files.length >= maxFiles,
  });

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const uploadFile = async (uploadedFile: UploadedFile) => {
    const formData = new FormData();
    formData.append("file", uploadedFile.file);
    formData.append("learner_id", learnerId);

    try {
      // Update status to uploading
      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadedFile.id ? { ...f, status: "uploading", progress: 0 } : f
        )
      );

      const response = await fetch("/api/iep/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Upload failed");
      }

      const data = await response.json();

      // Update status to processing
      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadedFile.id
            ? { ...f, status: "processing", progress: 50, documentId: data.document_id }
            : f
        )
      );

      // Poll for completion
      await pollForCompletion(uploadedFile.id, data.document_id);
    } catch (error) {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadedFile.id
            ? { ...f, status: "error", error: (error as Error).message }
            : f
        )
      );
      onError?.((error as Error).message);
    }
  };

  const pollForCompletion = async (fileId: string, documentId: string) => {
    const maxAttempts = 60; // 5 minutes with 5s intervals
    let attempts = 0;

    const poll = async () => {
      try {
        const response = await fetch(`/api/iep/documents/${documentId}/status`);
        const data = await response.json();

        if (data.status === "EXTRACTED" || data.status === "REVIEWED") {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileId ? { ...f, status: "success", progress: 100 } : f
            )
          );
          onUploadComplete?.(documentId);
          return;
        }

        if (data.status === "FAILED") {
          throw new Error(data.error_message || "Processing failed");
        }

        // Update progress based on status
        const progressMap: Record<string, number> = {
          PENDING: 25,
          SCANNING: 35,
          OCR_PROCESSING: 50,
          EXTRACTING: 75,
          VALIDATING: 90,
        };

        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileId
              ? { ...f, progress: progressMap[data.status] || f.progress }
              : f
          )
        );

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 5000);
        } else {
          throw new Error("Processing timeout");
        }
      } catch (error) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileId
              ? { ...f, status: "error", error: (error as Error).message }
              : f
          )
        );
        onError?.((error as Error).message);
      }
    };

    poll();
  };

  const uploadAll = async () => {
    setIsUploading(true);
    const pendingFiles = files.filter((f) => f.status === "pending");

    for (const file of pendingFiles) {
      await uploadFile(file);
    }

    setIsUploading(false);
  };

  const getStatusIcon = (status: UploadedFile["status"]) => {
    switch (status) {
      case "pending":
        return <FileText className="h-5 w-5 text-muted-foreground" />;
      case "uploading":
      case "processing":
        return <Loader2 className="h-5 w-5 text-primary animate-spin" />;
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-destructive" />;
    }
  };

  const getStatusText = (file: UploadedFile) => {
    switch (file.status) {
      case "pending":
        return "Ready to upload";
      case "uploading":
        return "Uploading...";
      case "processing":
        return "Processing with AI...";
      case "success":
        return "Extraction complete";
      case "error":
        return file.error || "Upload failed";
    }
  };

  const pendingCount = files.filter((f) => f.status === "pending").length;
  const canUpload = pendingCount > 0 && !isUploading;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50",
          (isUploading || files.length >= maxFiles) &&
            "opacity-50 cursor-not-allowed"
        )}
      >
        <input {...getInputProps()} />
        <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
        {isDragActive ? (
          <p className="text-primary font-medium">Drop the IEP document here...</p>
        ) : (
          <>
            <p className="font-medium mb-1">
              Drag & drop IEP documents here, or click to select
            </p>
            <p className="text-sm text-muted-foreground">
              PDF files only, up to {maxFileSize}MB each
            </p>
          </>
        )}
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-sm">
            Documents ({files.length}/{maxFiles})
          </h4>
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
            >
              {getStatusIcon(file.status)}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{file.file.name}</p>
                <p
                  className={cn(
                    "text-xs",
                    file.status === "error"
                      ? "text-destructive"
                      : "text-muted-foreground"
                  )}
                >
                  {getStatusText(file)}
                </p>
                {(file.status === "uploading" || file.status === "processing") && (
                  <Progress value={file.progress} className="h-1 mt-2" />
                )}
              </div>
              <div className="flex items-center gap-2">
                {file.status === "success" && file.documentId && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      (window.location.href = `/teacher/learners/${learnerId}/iep/documents/${file.documentId}/review`)
                    }
                  >
                    Review
                  </Button>
                )}
                {(file.status === "pending" || file.status === "error") && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFile(file.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload button */}
      {canUpload && (
        <Button onClick={uploadAll} className="w-full" disabled={isUploading}>
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Upload {pendingCount} Document{pendingCount !== 1 ? "s" : ""}
            </>
          )}
        </Button>
      )}
    </div>
  );
}
