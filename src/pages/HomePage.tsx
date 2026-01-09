import { useState } from "react";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { Link } from "react-router-dom";
import { TripList, CreateTripModal } from "../components/trips";

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
        <TripList />
      </main>

      <CreateTripModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />
    </div>
  );
}
