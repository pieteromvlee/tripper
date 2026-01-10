import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id, Doc } from "../../../convex/_generated/dataModel";
import { useState } from "react";

interface AttachmentListProps {
  locationId: Id<"locations">;
}

interface AttachmentItemProps {
  attachment: Doc<"attachments">;
  onDelete: (attachmentId: Id<"attachments">) => void;
  isDeleting: boolean;
}

function AttachmentItem({ attachment, onDelete, isDeleting }: AttachmentItemProps) {
  const downloadUrl = useQuery(api.attachments.getDownloadUrl, {
    attachmentId: attachment._id,
  });

  const isPdf = attachment.mimeType === "application/pdf";
  const isImage = attachment.mimeType.startsWith("image/");

  const handleView = () => {
    if (downloadUrl) {
      window.open(downloadUrl, "_blank", "noopener,noreferrer");
    }
  };

  const handleDownload = () => {
    if (downloadUrl) {
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = attachment.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-surface-secondary rounded-lg border border-border">
      {/* File icon */}
      <div className="flex-shrink-0">
        {isPdf ? (
          <svg
            className="w-8 h-8 text-red-500"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4zm-3.5 9.5a1 1 0 011-1h1a1 1 0 011 1v3a1 1 0 01-1 1h-1a1 1 0 01-1-1v-3zm-3-1h1c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5H7v1.5a.5.5 0 01-1 0v-4a.5.5 0 01.5-.5zm9.5 0h2a.5.5 0 010 1h-1.5v1h1a.5.5 0 010 1h-1v1.5a.5.5 0 01-1 0v-4a.5.5 0 01.5-.5z" />
          </svg>
        ) : isImage ? (
          <div className="w-8 h-8 rounded overflow-hidden bg-surface-inset">
            {downloadUrl && (
              <img
                src={downloadUrl}
                alt={attachment.fileName}
                className="w-full h-full object-cover"
              />
            )}
          </div>
        ) : (
          <svg
            className="w-8 h-8 text-text-muted"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4z" />
          </svg>
        )}
      </div>

      {/* File name */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary truncate">
          {attachment.fileName}
        </p>
        <p className="text-xs text-text-muted">
          {new Date(attachment.uploadedAt).toLocaleDateString()}
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {/* View button (for PDFs and images) */}
        {(isPdf || isImage) && downloadUrl && (
          <button
            onClick={handleView}
            className="p-1.5 rounded-md text-text-muted hover:text-blue-600 hover:bg-blue-50 transition-colors"
            title="View"
            aria-label="View file"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
          </button>
        )}

        {/* Download button */}
        {downloadUrl && (
          <button
            onClick={handleDownload}
            className="p-1.5 rounded-md text-text-muted hover:text-green-600 hover:bg-green-50 transition-colors"
            title="Download"
            aria-label="Download file"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
          </button>
        )}

        {/* Delete button */}
        <button
          onClick={() => onDelete(attachment._id)}
          disabled={isDeleting}
          className={`p-1.5 rounded-md transition-colors ${
            isDeleting
              ? "text-text-muted cursor-not-allowed"
              : "text-text-muted hover:text-red-600 hover:bg-red-50"
          }`}
          title="Delete"
          aria-label="Delete file"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

export function AttachmentList({ locationId }: AttachmentListProps) {
  const attachments = useQuery(api.attachments.listByLocation, { locationId });
  const deleteAttachment = useMutation(api.attachments.deleteAttachment);
  const [deletingId, setDeletingId] = useState<Id<"attachments"> | null>(null);

  const handleDelete = async (attachmentId: Id<"attachments">) => {
    if (deletingId) return; // Prevent multiple deletes

    const confirmed = window.confirm(
      "Are you sure you want to delete this attachment?"
    );
    if (!confirmed) return;

    setDeletingId(attachmentId);
    try {
      await deleteAttachment({ attachmentId });
    } catch (error) {
      console.error("Failed to delete attachment:", error);
      alert("Failed to delete attachment. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  // Loading state
  if (attachments === undefined) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Empty state
  if (attachments.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-text-muted">No attachments yet</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {attachments.map((attachment) => (
        <AttachmentItem
          key={attachment._id}
          attachment={attachment}
          onDelete={handleDelete}
          isDeleting={deletingId === attachment._id}
        />
      ))}
    </div>
  );
}
