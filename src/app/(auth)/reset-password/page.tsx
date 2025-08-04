"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { Lock, AlertCircle, CheckCircle, Loader2 } from "lucide-react";

function ResetPasswordContent() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    const verifyToken = async () => {
      try {
        // Get the session to verify the reset token
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error || !session) {
          setError("Invalid or expired reset link. Please request a new password reset.");
          setVerifying(false);
          return;
        }

        setVerifying(false);
      } catch (err) {
        setError("An error occurred while verifying your reset link.");
        setVerifying(false);
      }
    };

    verifyToken();
  }, [supabase.auth]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validation
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        setError(error.message);
        return;
      }

      setSuccess(true);
      
      // Redirect to sign in after 3 seconds
      setTimeout(() => {
        router.push("/sign-in");
      }, 3000);
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <>
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-900/50 rounded-full mb-6">
            <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Verifying reset link</h1>
          <p className="text-gray-400">Please wait while we verify your password reset link...</p>
        </div>
      </>
    );
  }

  if (success) {
    return (
      <>
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-900/50 rounded-full mb-6">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Password updated!</h1>
          <p className="text-gray-400 mb-6">
            Your password has been successfully updated. You&apos;ll be redirected to sign in shortly.
          </p>
          
          <Button
            onClick={() => router.push("/sign-in")}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3"
          >
            Go to Sign In
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Reset your password</h1>
        <p className="text-gray-400">Enter your new password below</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-red-200 text-sm">{error}</p>
        </div>
      )}

      {error.includes("Invalid or expired") ? (
        <div className="space-y-4">
          <Link href="/forgot-password">
            <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3">
              Request new reset link
            </Button>
          </Link>
          
          <Link href="/sign-in">
            <Button
              variant="outline"
              className="w-full border-gray-700 bg-black/50 hover:bg-gray-800 text-white"
            >
              Back to sign in
            </Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleResetPassword} className="space-y-4 mb-6">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
              New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 bg-black/50 border-gray-700 focus:border-purple-500 focus:ring-purple-500/20 text-white"
                placeholder="••••••••"
                required
                disabled={loading}
                minLength={6}
              />
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-10 bg-black/50 border-gray-700 focus:border-purple-500 focus:ring-purple-500/20 text-white"
                placeholder="••••••••"
                required
                disabled={loading}
                minLength={6}
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3"
          >
            {loading ? "Updating password..." : "Update password"}
          </Button>
        </form>
      )}

      <p className="text-center text-gray-400 text-sm mt-6">
        Remember your password?{" "}
        <Link href="/sign-in" className="text-purple-400 hover:text-purple-300 transition-colors">
          Sign in
        </Link>
      </p>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-900/50 rounded-full mb-6">
          <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Loading...</h1>
        <p className="text-gray-400">Please wait...</p>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}