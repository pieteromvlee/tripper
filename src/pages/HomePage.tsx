import { useState } from "react";
import { Authenticated, Unauthenticated, AuthLoading, useQuery, useMutation } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { Link, useNavigate } from "react-router-dom";
import { TripList, CreateTripModal } from "../components/trips";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

export default function HomePage() {
  return (
    <>
      <AuthLoading>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      </AuthLoading>

      <Unauthenticated>
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tripper</h1>
          <p className="text-gray-600 mb-8 text-center">Plan your city trips with interactive maps</p>
          <Link
            to="/login"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
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
  const { signOut } = useAuthActions();
  const navigate = useNavigate();

  const pendingInvites = useQuery(api.tripMembers.getMyInvites);
  const acceptInvite = useMutation(api.tripMembers.acceptInvite);
  const declineInvite = useMutation(api.tripMembers.declineInvite);

  const handleAcceptInvite = async (inviteId: Id<"tripInvites">, tripId: Id<"trips">) => {
    try {
      await acceptInvite({ inviteId });
      navigate(`/trip/${tripId}`);
    } catch (error) {
      console.error("Failed to accept invite:", error);
    }
  };

  const handleDeclineInvite = async (inviteId: Id<"tripInvites">) => {
    try {
      await declineInvite({ inviteId });
    } catch (error) {
      console.error("Failed to decline invite:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">My Trips</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Trip
            </button>
            <button
              onClick={() => signOut()}
              className="text-gray-500 hover:text-gray-700 px-3 py-2 text-sm font-medium transition"
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
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Pending Invitations</h2>
            <div className="space-y-3">
              {pendingInvites.map((invite) => (
                <div
                  key={invite._id}
                  className="bg-white border border-yellow-200 rounded-lg p-4 flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium text-gray-900">{invite.tripName}</p>
                    <p className="text-sm text-gray-500">
                      Invited by {invite.inviterEmail}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDeclineInvite(invite._id)}
                      className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition"
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => handleAcceptInvite(invite._id, invite.tripId)}
                      className="px-3 py-1.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition"
                    >
                      Accept
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <TripList />
      </main>

      <CreateTripModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />
    </div>
  );
}
