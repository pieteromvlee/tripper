import { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { Authenticated } from "convex/react";
import { Navigate } from "react-router-dom";

export default function LoginPage() {
  const { signIn } = useAuthActions();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signIn("password", {
        email,
        password,
        flow: isSignUp ? "signUp" : "signIn",
      });
      // The Authenticated component will handle redirect
    } catch (err) {
      console.error("Sign in error:", err);
      setError(isSignUp ? "Could not create account. Try a different email." : "Invalid email or password.");
      setLoading(false);
    }
  };

  return (
    <>
      <Authenticated>
        <Navigate to="/" replace />
      </Authenticated>
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">
          {isSignUp ? "Create Account" : "Welcome Back"}
        </h1>
        <p className="text-gray-600 mb-8 text-center">
          {isSignUp ? "Sign up to start planning trips" : "Sign in to access your trips"}
        </p>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? "Please wait..." : isSignUp ? "Create Account" : "Sign In"}
          </button>
        </form>

        <p className="mt-6 text-center text-gray-600">
          {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError("");
            }}
            className="text-blue-600 font-medium hover:underline"
          >
            {isSignUp ? "Sign In" : "Sign Up"}
          </button>
        </p>
        </div>
      </div>
    </>
  );
}
