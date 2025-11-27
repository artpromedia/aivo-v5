/**
 * FileUploadZone - Drag-drop file upload with camera capture
 * 
 * Supports:
 * - Drag and drop files
 * - Click to browse
 * - Camera capture on mobile
 * - Image, PDF, and document uploads
 */

"use client";

import { useState, useRef, useCallback, type DragEvent, type ChangeEvent } from "react";

interface FileUploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  maxFiles?: number;
  maxSizeMB?: number;
  disabled?: boolean;
  showPreview?: boolean;
}

const ACCEPTED_TYPES = {
  images: ["image/jpeg", "image/png", "image/gif", "image/webp", "image/heic"],
  documents: ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  text: ["text/plain"]
};

const ALL_ACCEPTED = [...ACCEPTED_TYPES.images, ...ACCEPTED_TYPES.documents, ...ACCEPTED_TYPES.text];

export function FileUploadZone({
  onFilesSelected,
  accept = ALL_ACCEPTED.join(","),
  maxFiles = 5,
  maxSizeMB = 10,
  disabled = false,
  showPreview = true
}: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [previews, setPreviews] = useState<{ file: File; url: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): string | null => {
    if (!ALL_ACCEPTED.includes(file.type)) {
      return `${file.name} is not a supported file type`;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      return `${file.name} is too large (max ${maxSizeMB}MB)`;
    }
    return null;
  }, [maxSizeMB]);

  const processFiles = useCallback((files: FileList | File[]) => {
    setError(null);
    const fileArray = Array.from(files);
    
    if (fileArray.length > maxFiles) {
      setError(`You can only upload up to ${maxFiles} files at once`);
      return;
    }

    const validFiles: File[] = [];
    const newPreviews: { file: File; url: string }[] = [];

    for (const file of fileArray) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        continue;
      }
      
      validFiles.push(file);
      
      // Generate preview for images
      if (showPreview && file.type.startsWith("image/")) {
        newPreviews.push({
          file,
          url: URL.createObjectURL(file)
        });
      }
    }

    if (validFiles.length > 0) {
      setPreviews(prev => [...prev, ...newPreviews]);
      onFilesSelected(validFiles);
    }
  }, [maxFiles, validateFile, showPreview, onFilesSelected]);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (disabled) return;
    
    if (e.dataTransfer.files?.length) {
      processFiles(e.dataTransfer.files);
    }
  }, [disabled, processFiles]);

  const handleFileSelect = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      processFiles(e.target.files);
    }
    // Reset input to allow selecting the same file again
    e.target.value = "";
  }, [processFiles]);

  const handleBrowseClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleCameraClick = useCallback(() => {
    cameraInputRef.current?.click();
  }, []);

  const removePreview = useCallback((index: number) => {
    setPreviews(prev => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].url);
      updated.splice(index, 1);
      return updated;
    });
  }, []);

  // Clean up preview URLs on unmount
  // useEffect(() => {
  //   return () => {
  //     previews.forEach(p => URL.revokeObjectURL(p.url));
  //   };
  // }, []);

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-2xl p-8 text-center
          transition-all duration-200 cursor-pointer
          ${disabled
            ? "border-slate-200 bg-slate-50 cursor-not-allowed"
            : isDragging
            ? "border-primary-500 bg-primary-50"
            : "border-slate-300 hover:border-primary-400 hover:bg-lavender-50"
          }
        `}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={handleBrowseClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleBrowseClick();
          }
        }}
        aria-label="Upload homework file"
        aria-disabled={disabled}
      >
        {/* Icon */}
        <div className={`
          mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4
          ${isDragging ? "bg-primary-100" : "bg-lavender-100"}
        `}>
          <svg
            className={`w-8 h-8 ${isDragging ? "text-primary-600" : "text-lavender-600"}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
        </div>

        {/* Text */}
        <p className="text-slate-700 font-medium mb-1">
          {isDragging ? "Drop it here!" : "Drag & drop your homework here"}
        </p>
        <p className="text-sm text-slate-500 mb-4">
          or click to browse files
        </p>

        {/* File type badges */}
        <div className="flex flex-wrap justify-center gap-2">
          <span className="px-2 py-1 bg-slate-100 rounded text-xs text-slate-600">
            📷 Images
          </span>
          <span className="px-2 py-1 bg-slate-100 rounded text-xs text-slate-600">
            📄 PDFs
          </span>
          <span className="px-2 py-1 bg-slate-100 rounded text-xs text-slate-600">
            📝 Documents
          </span>
        </div>

        {/* Hidden file inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={maxFiles > 1}
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled}
          aria-hidden="true"
        />
      </div>

      {/* Camera capture button (mobile-friendly) */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleCameraClick}
          disabled={disabled}
          className={`
            flex-1 flex items-center justify-center gap-2 px-4 py-3
            border-2 border-slate-200 rounded-xl
            text-slate-700 font-medium
            transition-colors
            ${disabled
              ? "opacity-50 cursor-not-allowed"
              : "hover:border-primary-300 hover:bg-primary-50"
            }
          `}
        >
          <span className="text-xl">📸</span>
          <span>Take Photo</span>
        </button>
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled}
          aria-hidden="true"
        />
      </div>

      {/* Error message */}
      {error && (
        <div
          className="p-3 bg-coral-light rounded-xl text-sm text-coral-dark flex items-center gap-2"
          role="alert"
        >
          <span>⚠️</span>
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-coral-dark hover:text-coral"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      )}

      {/* Previews */}
      {showPreview && previews.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {previews.map((preview, index) => (
            <div
              key={preview.url}
              className="relative group rounded-xl overflow-hidden bg-slate-100"
            >
              <img
                src={preview.url}
                alt={`Preview of ${preview.file.name}`}
                className="w-full h-24 object-cover"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removePreview(index);
                }}
                className="absolute top-1 right-1 w-6 h-6 bg-slate-900/70 text-white rounded-full
                  opacity-0 group-hover:opacity-100 transition-opacity
                  flex items-center justify-center text-xs"
                aria-label={`Remove ${preview.file.name}`}
              >
                ✕
              </button>
              <p className="absolute bottom-0 left-0 right-0 px-2 py-1 bg-slate-900/70 text-white text-xs truncate">
                {preview.file.name}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Accessibility hints */}
      <p className="text-xs text-slate-400 text-center">
        Supported: JPG, PNG, PDF, Word documents • Max {maxSizeMB}MB per file
      </p>
    </div>
  );
}
