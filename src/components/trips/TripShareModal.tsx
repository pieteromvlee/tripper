import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { getErrorMessage } from "../../lib/errorHandling";

interface TripShareModalProps {
  tripId: Id<"trips">;
  isOwner: boolean;
  onClose: () => void;
}

export function TripShareModal({ tripId, isOwner, onClose }: TripShareModalProps) {
  const [email, setEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const members = useQuery(api.tripMembers.list, { tripId });
  const pendingInvites = useQuery(
    api.tripMembers.listPendingInvites,
    isOwner ? { tripId } : "skip"
  );

  const invite = useMutation(api.tripMembers.invite);
  const removeMember = useMutation(api.tripMembers.removeMember);
  const cancelInvite = useMutation(api.tripMembers.cancelInvite);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || isInviting) return;

    setIsInviting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const result = await invite({ tripId, email: email.trim() });
      setEmail("");
      if (result.status === "added") {
        setSuccessMessage(`${result.email} has been added to the trip!`);
      } else {
        setSuccessMessage(`Invitation sent to ${result.email}. They'll see it when they log in.`);
      }
    } catch (error: unknown) {
      setError(getErrorMessage(error));
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: Id<"tripMembers">) => {
    try {
      await removeMember({ memberId });
    } catch (error: unknown) {
      setError(getErrorMessage(error));
    }
  };

  const handleCancelInvite = async (inviteId: Id<"tripInvites">) => {
    try {
      await cancelInvite({ inviteId });
    } catch (error: unknown) {
      setError(getErrorMessage(error));
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-trip-title"
    >
      <div
        className="bg-surface-elevated w-full max-w-md max-h-[80vh] flex flex-col border border-border"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-2 bg-surface-secondary border-b border-border">
          <div className="flex items-center justify-between">
            <h2 id="share-trip-title" className="text-sm font-bold text-text-primary uppercase tracking-wide">Share Trip</h2>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="p-1 text-text-muted hover:text-text-primary hover:bg-surface-elevated border border-transparent hover:border-border transition-colors"
              aria-label="Close"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Invite form - owner only */}
          {isOwner && (
            <form onSubmit={handleInvite}>
              <label className="block text-xs font-medium text-text-secondary mb-1 uppercase tracking-wide">
                Invite by email
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                    setSuccessMessage(null);
                  }}
                  placeholder="friend@example.com"
                  className="flex-1 px-3 py-2 border border-border bg-surface-inset focus:outline-none focus:border-blue-400 text-sm"
                />
                <button
                  type="submit"
                  disabled={!email.trim() || isInviting}
                  className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-500 border border-blue-400 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium transition-colors"
                >
                  {isInviting ? "..." : "Invite"}
                </button>
              </div>
              {error && (
                <p className="mt-2 text-xs text-red-400">{error}</p>
              )}
              {successMessage && (
                <p className="mt-2 text-xs text-green-400">{successMessage}</p>
              )}
            </form>
          )}

          {/* Members list */}
          <div>
            <h3 className="text-xs font-medium text-text-secondary mb-2 uppercase tracking-wide">Members</h3>
            {members === undefined ? (
              <p className="text-text-muted text-xs">Loading...</p>
            ) : members.length === 0 ? (
              <p className="text-text-muted text-xs">No members yet</p>
            ) : (
              <ul className="space-y-1">
                {members.map((member) => (
                  <li
                    key={member._id}
                    className="flex items-center justify-between py-2 px-3 bg-surface-secondary border border-border"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-medium border border-blue-500/50">
                        {(member.name || member.email || "?").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-text-primary">
                          {member.name || member.email}
                        </p>
                        {member.name && member.email && (
                          <p className="text-xs text-text-muted">{member.email}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 text-xs font-medium border ${
                          member.role === "owner"
                            ? "bg-purple-500/10 text-purple-400 border-purple-500/50"
                            : "bg-surface-inset text-text-secondary border-border"
                        }`}
                      >
                        {member.role}
                      </span>
                      {isOwner && member.role !== "owner" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveMember(member._id);
                          }}
                          className="p-1 text-text-muted hover:text-red-400 border border-transparent hover:border-red-500/50 transition-colors"
                          title="Remove member"
                          aria-label={`Remove ${member.name || member.email}`}
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Pending invites - owner only */}
          {isOwner && pendingInvites && pendingInvites.length > 0 && (
            <div>
              <h3 className="text-xs font-medium text-text-secondary mb-2 uppercase tracking-wide">Pending Invites</h3>
              <ul className="space-y-1">
                {pendingInvites.map((invite) => (
                  <li
                    key={invite._id}
                    className="flex items-center justify-between py-2 px-3 bg-yellow-500/10 border border-yellow-500/50"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-yellow-500/20 text-yellow-400 flex items-center justify-center text-xs font-medium border border-yellow-500/50">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-text-primary">{invite.email}</p>
                        <p className="text-xs text-text-muted">Pending</p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCancelInvite(invite._id);
                      }}
                      className="p-1 text-text-muted hover:text-red-400 border border-transparent hover:border-red-500/50 transition-colors"
                      title="Cancel invite"
                      aria-label={`Cancel invite for ${invite.email}`}
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="p-3 border-t border-border">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="w-full px-4 py-2 text-text-secondary border border-border hover:bg-surface-secondary hover:border-border-focus text-xs font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
