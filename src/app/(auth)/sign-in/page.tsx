"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { Github, Mail, Lock, AlertCircle } from "lucide-react";

function SignInContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirectUrl');
  const supabase = createClient();

  const getCallbackUrl = () => {
    const baseUrl = `${window.location.origin}/callback`;
    return redirectUrl ? `${baseUrl}?redirectUrl=${encodeURIComponent(redirectUrl)}` : baseUrl;
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        return;
      }

      if (data.user) {
        // Handle redirect URL if present
        if (redirectUrl) {
          router.push(`/dashboard/scan?url=${encodeURIComponent(redirectUrl)}`);
        } else {
          router.push("/dashboard");
        }
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleGithubSignIn = async () => {
    setLoading(true);
    setError("");

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: getCallbackUrl(),
        },
      });

      if (error) {
        setError(error.message);
        setLoading(false);
      }
    } catch (err) {
      setError("An unexpected error occurred");
      setLoading(false);
    }
  };

  return (
    <>
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Welcome back</h1>
        <p className="text-gray-400">Sign in to your SecCheck account</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-red-200 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleEmailSignIn} className="space-y-4 mb-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 bg-black/50 border-gray-700 focus:border-purple-500 focus:ring-purple-500/20 text-white"
              placeholder="your@email.com"
              required
              disabled={loading}
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
            Password
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
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Link
            href="/forgot-password"
            className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3"
        >
          {loading ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-700" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-gray-900 text-gray-400">Or continue with</span>
        </div>
      </div>

      <Button
        onClick={handleGithubSignIn}
        disabled={loading}
        variant="outline"
        className="w-full border-gray-700 bg-black/50 hover:bg-gray-800 text-white font-semibold py-3"
      >
        <Github className="w-5 h-5 mr-2" />
        GitHub
      </Button>

      <p className="text-center text-gray-400 text-sm mt-6">
        Don&apos;t have an account?{" "}
        <Link 
          href={redirectUrl ? `/sign-up?redirectUrl=${encodeURIComponent(redirectUrl)}` : "/sign-up"} 
          className="text-purple-400 hover:text-purple-300 transition-colors"
        >
          Sign up
        </Link>
      </p>
    </>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignInContent />
    </Suspense>
  );
}