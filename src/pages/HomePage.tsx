import { useState } from "react";
import { Authenticated, Unauthenticated, AuthLoading, useQuery, useMutation } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { Link, useNavigate } from "react-router-dom";
import { TripList, CreateTripModal } from "../components/trips";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { useTheme } from "../hooks/useDarkMode";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { logger } from "../lib/logger";

export default function HomePage() {
  return (
    <>
      <AuthLoading>
        <div className="min-h-screen flex items-center justify-center bg-surface">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      </AuthLoading>

      <Unauthenticated>
        <div className="min-h-screen flex flex-col items-center justify-center bg-surface px-4">
          <h1 className="text-2xl font-bold text-text-primary mb-2 uppercase tracking-wider">Tripper</h1>
          <p className="text-text-secondary mb-8 text-center text-sm">Plan your city trips with interactive maps</p>
          <Link
            to="/login"
            className="bg-blue-600 text-white px-6 py-2 border border-blue-400 font-medium hover:bg-blue-500 transition text-sm"
          >
            Sign In to Get Started
          </Link>
        </div>
      </Unauthenticated>

      <Authenticated>
        <AuthenticatedHome />
      </Authenticated>
    </>
  );
}

function AuthenticatedHome() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const { signOut } = useAuthActions();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const pendingInvites = useQuery(api.tripMembers.getMyInvites);
  const acceptInvite = useMutation(api.tripMembers.acceptInvite);
  const declineInvite = useMutation(api.tripMembers.declineInvite);

  const handleAcceptInvite = async (inviteId: Id<"tripInvites">, tripId: Id<"trips">) => {
    setInviteError(null);
    try {
      await acceptInvite({ inviteId });
      navigate(`/trip/${tripId}`);
    } catch (error) {
      logger.error("Failed to accept invite:", error);
      setInviteError(error instanceof Error ? error.message : "Failed to accept invite");
    }
  };

  const handleDeclineInvite = async (inviteId: Id<"tripInvites">) => {
    setInviteError(null);
    try {
      await declineInvite({ inviteId });
    } catch (error) {
      logger.error("Failed to decline invite:", error);
      setInviteError(error instanceof Error ? error.message : "Failed to decline invite");
    }
  };

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-surface-secondary border-b border-border px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-sm font-bold text-text-primary uppercase tracking-wide">My Trips</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-4 py-2 border border-blue-400 text-xs font-medium hover:bg-blue-500 transition flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Trip
            </button>
            {/* Theme toggle (desktop only) */}
            <button
              onClick={toggleTheme}
              className="hidden md:flex p-2 text-text-secondary hover:text-text-primary hover:bg-surface-elevated border border-transparent hover:border-border"
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDark ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            <button
              onClick={() => signOut()}
              className="text-text-secondary hover:text-text-primary px-3 py-2 text-xs font-medium hover:bg-surface-elevated border border-transparent hover:border-border transition"
              title="Sign Out"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4">
        {/* Pending Invites */}
        {pendingInvites && pendingInvites.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xs font-bold text-text-primary mb-3 uppercase tracking-wide">Pending Invitations</h2>
            {inviteError && (
              <p className="text-red-400 text-xs bg-red-500/10 px-3 py-2 border border-red-500/30 mb-2">{inviteError}</p>
            )}
            <div className="space-y-2">
              {pendingInvites.map((invite) => (
                <div
                  key={invite._id}
                  className="bg-surface-elevated border border-yellow-500/50 p-3 flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-text-primary">{invite.tripName}</p>
                    <p className="text-xs text-text-secondary">
                      Invited by {invite.inviterEmail}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDeclineInvite(invite._id)}
                      className="px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-secondary border border-transparent hover:border-border transition"
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => handleAcceptInvite(invite._id, invite.tripId)}
                      className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-500 border border-green-400 transition"
                    >
                      Accept
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <ErrorBoundary>
          <TripList />
        </ErrorBoundary>
      </main>

      <CreateTripModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />
    </div>
  );
}
