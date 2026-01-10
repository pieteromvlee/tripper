import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

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
    } catch (err: any) {
      setError(err.data || err.message || "Failed to send invitation");
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: Id<"tripMembers">) => {
    try {
      await removeMember({ memberId });
    } catch (err: any) {
      setError(err.data || err.message || "Failed to remove member");
    }
  };

  const handleCancelInvite = async (inviteId: Id<"tripInvites">) => {
    try {
      await cancelInvite({ inviteId });
    } catch (err: any) {
      setError(err.data || err.message || "Failed to cancel invitation");
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-surface-elevated rounded-xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col border border-border-muted">
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-text-primary">Share Trip</h2>
            <button
              onClick={onClose}
              className="p-2 text-text-muted hover:text-text-primary rounded-lg hover:bg-surface-secondary transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Invite form - owner only */}
          {isOwner && (
            <form onSubmit={handleInvite}>
              <label className="block text-sm font-medium text-text-secondary mb-2">
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
                  className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                />
                <button
                  type="submit"
                  disabled={!email.trim() || isInviting}
                  className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
                >
                  {isInviting ? "..." : "Invite"}
                </button>
              </div>
              {error && (
                <p className="mt-2 text-sm text-red-600">{error}</p>
              )}
              {successMessage && (
                <p className="mt-2 text-sm text-green-600">{successMessage}</p>
              )}
            </form>
          )}

          {/* Members list */}
          <div>
            <h3 className="text-sm font-medium text-text-secondary mb-3">Members</h3>
            {members === undefined ? (
              <p className="text-text-muted text-sm">Loading...</p>
            ) : members.length === 0 ? (
              <p className="text-text-muted text-sm">No members yet</p>
            ) : (
              <ul className="space-y-2">
                {members.map((member) => (
                  <li
                    key={member._id}
                    className="flex items-center justify-between py-2 px-3 bg-surface-secondary rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                        {(member.name || member.email || "?").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-text-primary">
                          {member.name || member.email}
                        </p>
                        {member.name && member.email && (
                          <p className="text-xs text-text-muted">{member.email}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                          member.role === "owner"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-surface-inset text-text-secondary"
                        }`}
                      >
                        {member.role}
                      </span>
                      {isOwner && member.role !== "owner" && (
                        <button
                          onClick={() => handleRemoveMember(member._id)}
                          className="p-1 text-text-muted hover:text-red-600 rounded transition-colors"
                          title="Remove member"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              <h3 className="text-sm font-medium text-text-secondary mb-3">Pending Invites</h3>
              <ul className="space-y-2">
                {pendingInvites.map((invite) => (
                  <li
                    key={invite._id}
                    className="flex items-center justify-between py-2 px-3 bg-yellow-50 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center text-sm font-medium">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-text-primary">{invite.email}</p>
                        <p className="text-xs text-text-muted">Pending</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleCancelInvite(invite._id)}
                      className="p-1 text-text-muted hover:text-red-600 rounded transition-colors"
                      title="Cancel invite"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-border">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-text-primary bg-surface-secondary hover:bg-surface-inset rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
