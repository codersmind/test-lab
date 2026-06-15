"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Shield } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import toast from "react-hot-toast";

const allowedDomain =
  process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN || "mydomain.com";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, configured } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Signed in successfully");
      router.push("/mail");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gmail-bg p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gmail-red mb-4">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-normal text-gmail-text">MailBox</h1>
          <p className="text-gmail-text-secondary mt-1">Sign in to continue</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gmail-border">
          {!configured && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
              Firebase is not configured. Copy <code className="text-xs">.env.example</code> to{" "}
              <code className="text-xs">.env.local</code> and add your keys.
            </div>
          )}

          <div className="mb-6 p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-900 flex gap-2">
            <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p>
              Accounts are created by your administrator only. Sign in with the
              email and password shared with you (e.g.{" "}
              <span className="font-medium">you@{allowedDomain}</span>).
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gmail-text mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gmail-border rounded-lg focus:outline-none focus:ring-2 focus:ring-gmail-blue/30"
                placeholder={`you@${allowedDomain}`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gmail-text mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gmail-border rounded-lg focus:outline-none focus:ring-2 focus:ring-gmail-blue/30"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gmail-blue text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="text-center text-sm text-gmail-text-secondary mt-6">
            Need an account? Contact your administrator.
          </p>
        </div>
      </div>
    </div>
  );
}
