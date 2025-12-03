'use client';

import { useCallback, useRef, useState } from 'react';
import { Camera, FileImage, File, X, Upload, CheckCircle, AlertCircle } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

export interface EvidenceFile {
  file: File;
  preview: string;
  type: 'image' | 'pdf' | 'other';
}

interface IEPEvidenceUploadProps {
  value: EvidenceFile | null;
  onChange: (file: EvidenceFile | null) => void;
  disabled?: boolean;
  error?: string;
}

// ============================================================================
// Constants
// ============================================================================

const ACCEPTED_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  pdf: ['application/pdf'],
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// ============================================================================
// Helper Functions
// ============================================================================

function getFileType(file: File): 'image' | 'pdf' | 'other' {
  if (ACCEPTED_TYPES.image.includes(file.type)) return 'image';
  if (ACCEPTED_TYPES.pdf.includes(file.type)) return 'pdf';
  return 'other';
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ============================================================================
// Upload Options Sheet
// ============================================================================

interface UploadOptionsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onTakePhoto: () => void;
  onChooseFile: () => void;
}

function UploadOptionsSheet({
  isOpen,
  onClose,
  onTakePhoto,
  onChooseFile,
}: UploadOptionsSheetProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-50"
        onClick={onClose}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
        role="button"
        tabIndex={0}
        aria-label="Close menu"
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up">
        <div className="bg-white rounded-t-3xl shadow-2xl overflow-hidden">
          {/* Handle */}
          <div className="flex justify-center py-3">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
          </div>

          <div className="px-4 pb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Add Evidence</h3>

            <div className="space-y-2">
              {/* Take Photo Option */}
              <button
                onClick={onTakePhoto}
                className="w-full flex items-center gap-4 p-4 bg-violet-50 hover:bg-violet-100 rounded-xl transition-colors"
              >
                <div className="flex items-center justify-center w-12 h-12 bg-violet-600 rounded-full">
                  <Camera className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900">Take Photo</p>
                  <p className="text-sm text-gray-500">Use your camera to capture evidence</p>
                </div>
              </button>

              {/* Choose File Option */}
              <button
                onClick={onChooseFile}
                className="w-full flex items-center gap-4 p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
              >
                <div className="flex items-center justify-center w-12 h-12 bg-blue-600 rounded-full">
                  <FileImage className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900">Choose File</p>
                  <p className="text-sm text-gray-500">
                    Select from gallery or files (images, PDF)
                  </p>
                </div>
              </button>
            </div>

            {/* Cancel */}
            <button
              onClick={onClose}
              className="w-full mt-4 py-3 text-gray-600 font-medium hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ============================================================================
// File Preview Component
// ============================================================================

interface FilePreviewProps {
  evidence: EvidenceFile;
  onRemove: () => void;
  disabled?: boolean;
}

function FilePreview({ evidence, onRemove, disabled }: FilePreviewProps) {
  return (
    <div className="relative">
      <div className="bg-white rounded-xl border-2 border-emerald-200 p-4">
        <div className="flex items-center gap-4">
          {/* Preview thumbnail */}
          <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
            {evidence.type === 'image' ? (
              <img
                src={evidence.preview}
                alt="Evidence preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <File className="w-8 h-8 text-red-500" />
              </div>
            )}
          </div>

          {/* File info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-medium text-emerald-700">Evidence attached</span>
            </div>
            <p className="text-sm text-gray-600 truncate">{evidence.file.name}</p>
            <p className="text-xs text-gray-400">{formatFileSize(evidence.file.size)}</p>
          </div>

          {/* Remove button */}
          {!disabled && (
            <button
              onClick={onRemove}
              className="flex-shrink-0 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
              aria-label="Remove evidence"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Main Evidence Upload Component
// ============================================================================

export function IEPEvidenceUpload({
  value,
  onChange,
  disabled = false,
  error,
}: IEPEvidenceUploadProps) {
  const [showOptions, setShowOptions] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // Reset input
      event.target.value = '';

      // Validate file type
      const fileType = getFileType(file);
      if (fileType === 'other') {
        setUploadError('Please select an image or PDF file');
        return;
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        setUploadError('File size must be less than 10MB');
        return;
      }

      // Clear error and create preview
      setUploadError(null);

      if (fileType === 'image') {
        const reader = new FileReader();
        reader.onload = (e) => {
          onChange({
            file,
            preview: e.target?.result as string,
            type: 'image',
          });
        };
        reader.readAsDataURL(file);
      } else {
        onChange({
          file,
          preview: '',
          type: 'pdf',
        });
      }

      setShowOptions(false);
    },
    [onChange],
  );

  const handleTakePhoto = useCallback(() => {
    cameraInputRef.current?.click();
  }, []);

  const handleChooseFile = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleRemove = useCallback(() => {
    onChange(null);
  }, [onChange]);

  // If we have evidence, show preview
  if (value) {
    return (
      <div className="space-y-2">
        <p className="block text-sm font-semibold text-gray-700">
          Evidence
          <span className="font-normal text-gray-400 ml-1">(optional)</span>
        </p>
        <FilePreview evidence={value} onRemove={handleRemove} disabled={disabled} />
      </div>
    );
  }

  // Show upload zone
  return (
    <div className="space-y-2">
      <p className="block text-sm font-semibold text-gray-700">
        Evidence
        <span className="font-normal text-gray-400 ml-1">(optional)</span>
      </p>
      <p className="text-xs text-gray-500 mb-2">
        Attach a photo or document as supporting evidence
      </p>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />

      {/* Upload zone */}
      <button
        type="button"
        onClick={() => !disabled && setShowOptions(true)}
        disabled={disabled}
        className={`w-full border-2 border-dashed rounded-xl p-6 transition-all ${
          disabled
            ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
            : 'border-gray-300 hover:border-violet-400 hover:bg-violet-50 cursor-pointer'
        }`}
      >
        <div className="flex flex-col items-center gap-2">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center ${
              disabled ? 'bg-gray-100' : 'bg-violet-100'
            }`}
          >
            <Upload className={`w-6 h-6 ${disabled ? 'text-gray-400' : 'text-violet-600'}`} />
          </div>
          <span className={`font-medium ${disabled ? 'text-gray-400' : 'text-gray-700'}`}>
            Add photo or document
          </span>
          <span className="text-xs text-gray-400">Images or PDF • Max 10MB</span>
        </div>
      </button>

      {/* Error message */}
      {(uploadError || error) && (
        <div className="flex items-center gap-2 text-red-600 text-sm mt-2">
          <AlertCircle className="w-4 h-4" />
          <span>{uploadError || error}</span>
        </div>
      )}

      {/* Options sheet */}
      <UploadOptionsSheet
        isOpen={showOptions}
        onClose={() => setShowOptions(false)}
        onTakePhoto={handleTakePhoto}
        onChooseFile={handleChooseFile}
      />
    </div>
  );
}

// ============================================================================
// Skeleton
// ============================================================================

export function IEPEvidenceUploadSkeleton() {
  return (
    <div className="space-y-2 animate-pulse">
      <div className="h-5 w-24 bg-gray-200 rounded" />
      <div className="h-4 w-48 bg-gray-100 rounded" />
      <div className="border-2 border-dashed border-gray-200 rounded-xl p-6">
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 bg-gray-100 rounded-full" />
          <div className="h-5 w-36 bg-gray-100 rounded" />
          <div className="h-3 w-28 bg-gray-100 rounded" />
        </div>
      </div>
    </div>
  );
}
