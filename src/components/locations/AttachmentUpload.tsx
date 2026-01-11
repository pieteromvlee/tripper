import { useState, useRef, type ChangeEvent } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { logger } from "../../lib/logger";

interface AttachmentUploadProps {
  locationId: Id<"locations">;
  onUploadComplete?: () => void;
}

// Accepted file types
const ACCEPTED_TYPES = {
  "application/pdf": [".pdf"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/gif": [".gif"],
  "image/webp": [".webp"],
};

const ACCEPT_STRING = Object.entries(ACCEPTED_TYPES)
  .flatMap(([mime, exts]) => [mime, ...exts])
  .join(",");

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function AttachmentUpload({
  locationId,
  onUploadComplete,
}: AttachmentUploadProps) {
  const generateUploadUrl = useMutation(api.attachments.generateUploadUrl);
  const saveAttachment = useMutation(api.attachments.saveAttachment);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    // Check file type
    const acceptedMimes = Object.keys(ACCEPTED_TYPES);
    if (!acceptedMimes.includes(file.type)) {
      return "Invalid file type. Please upload a PDF or image file.";
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return "File is too large. Maximum size is 10MB.";
    }

    return null;
  };

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset state
    setError(null);
    setUploadProgress(0);

    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    setIsUploading(true);

    try {
      // Step 1: Get the upload URL
      const uploadUrl = await generateUploadUrl();

      // Step 2: Upload the file using XMLHttpRequest for progress tracking
      const fileId = await new Promise<Id<"_storage">>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round(
              (event.loaded / event.total) * 100
            );
            setUploadProgress(percentComplete);
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response.storageId as Id<"_storage">);
            } catch {
              reject(new Error("Failed to parse upload response"));
            }
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });

        xhr.addEventListener("error", () => {
          reject(new Error("Upload failed"));
        });

        xhr.open("POST", uploadUrl);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.send(file);
      });

      // Step 3: Save the attachment metadata
      await saveAttachment({
        locationId,
        fileName: file.name,
        fileId,
        mimeType: file.type,
      });

      // Reset and notify
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setUploadProgress(0);
      onUploadComplete?.();
    } catch (err) {
      logger.error("Upload failed:", err);
      setError("Failed to upload file. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-2">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPT_STRING}
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading}
      />

      {/* Upload button */}
      <button
        onClick={handleButtonClick}
        disabled={isUploading}
        className={`
          w-full flex items-center justify-center gap-2 px-4 py-2.5
          rounded-lg border-2 border-dashed transition-colors
          md:w-auto md:px-3 md:py-1.5 md:border md:rounded
          ${
            isUploading
              ? "border-border bg-surface-secondary text-text-muted cursor-not-allowed"
              : "border-border hover:border-blue-400 hover:bg-blue-500/10 text-text-secondary hover:text-blue-600"
          }
        `}
      >
        {isUploading ? (
          <>
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin md:w-3 md:h-3" />
            <span className="text-sm font-medium md:text-xs">Uploading...</span>
          </>
        ) : (
          <>
            <svg
              className="w-5 h-5 md:w-4 md:h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            <span className="text-sm font-medium md:text-xs">Add Attachment</span>
          </>
        )}
      </button>

      {/* Progress bar */}
      {isUploading && uploadProgress > 0 && (
        <div className="w-full bg-surface-inset rounded-full h-2 overflow-hidden">
          <div
            className="bg-blue-500 h-full transition-all duration-300 ease-out"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 p-2 bg-red-500/10 border border-red-500/30 rounded-lg">
          <svg
            className="w-4 h-4 text-red-500 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          <button
            onClick={() => setError(null)}
            className="ml-auto p-1 text-red-500 hover:text-red-700"
            aria-label="Dismiss error"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Help text - hidden on desktop */}
      <p className="text-xs text-text-muted text-center md:hidden">
        PDF and images up to 10MB
      </p>
    </div>
  );
}
