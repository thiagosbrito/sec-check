"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { Github, Mail, Lock, AlertCircle, CheckCircle, User, Zap, Crown, Eye, EyeOff } from "lucide-react";
import { PLAN_CONFIG } from '@/lib/stripe/config';

function SignUpContent() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirectUrl');
  const selectedPlan = searchParams.get('plan') as 'developer' | 'team' | null;
  const selectedInterval = searchParams.get('interval') as 'monthly' | 'yearly' | null;
  const supabase = createClient();

  // Get plan details
  const planConfig = selectedPlan ? PLAN_CONFIG[selectedPlan] : null;
  const planPrice = planConfig && selectedInterval ? 
    (selectedInterval === 'monthly' ? planConfig.monthlyPrice : planConfig.yearlyPrice) / 100 : 0;

  const PlanIcon = selectedPlan === 'developer' ? Zap : Crown;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const getCallbackUrl = () => {
    const baseUrl = `${window.location.origin}/callback`;
    const params = new URLSearchParams();
    
    if (redirectUrl) {
      params.set('redirectUrl', redirectUrl);
    }
    
    // Add plan selection to callback for checkout redirection
    if (selectedPlan && selectedInterval) {
      params.set('plan', selectedPlan);
      params.set('interval', selectedInterval);
      params.set('checkout', 'true');
    }
    
    return params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validation
    if (!formData.name.trim()) {
      setError("Please enter your full name");
      setLoading(false);
      return;
    }

    if (!formData.email.trim()) {
      setError("Please enter a valid email address");
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            selectedPlan: selectedPlan || 'free', // Pass selected plan to trigger
            selectedInterval: selectedInterval || 'monthly',
          },
          emailRedirectTo: getCallbackUrl(),
        },
      });

      if (error) {
        // Map of common error messages to user-friendly versions
        const errorMap = new Map([
          ['User already registered', 'This email is already registered. Try signing in instead.'],
          ['Invalid email', 'Please enter a valid email address.'],
          ['Password should be at least 6 characters', 'Password must be at least 6 characters long.'],
          ['Signup is disabled', 'Account creation is temporarily disabled. Please try again later.'],
        ]);
        
        setError(errorMap.get(error.message) || error.message || 'Failed to create account. Please try again.');
        return;
      }

      if (data.user) {
        setSuccess(true);
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleGithubSignUp = async () => {
    setLoading(true);
    setError("");

    try {
      const callbackUrl = new URL(getCallbackUrl());
      callbackUrl.searchParams.set('selectedPlan', selectedPlan || 'free');
      callbackUrl.searchParams.set('selectedInterval', selectedInterval || 'monthly');

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: callbackUrl.toString(),
        },
      });

      if (error) {
        const errorMap = new Map([
          ['Invalid login credentials', 'Authentication failed. Please try again.'],
          ['OAuth provider error', 'GitHub sign-in failed. Please try again.'],
        ]);
        
        setError(errorMap.get(error.message) || error.message || 'GitHub sign-in failed. Please try again.');
        setLoading(false);
      }
    } catch (err) {
      setError("An unexpected error occurred");
      setLoading(false);
    }
  };

  if (success) {
    return (
      <>
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-900/50 rounded-full mb-4">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Check your email</h1>
          <p className="text-gray-400">
            We&apos;ve sent you a confirmation link at{" "}
            <span className="text-purple-400">{formData.email}</span>
          </p>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-blue-900/50 border border-blue-700 rounded-lg">
            <p className="text-blue-200 text-sm">
              Click the link in your email to verify your account and complete the signup process.
            </p>
          </div>

          <Button
            onClick={() => setSuccess(false)}
            variant="outline"
            className="w-full border-gray-700 bg-black/50 hover:bg-gray-800 text-white"
          >
            Back to sign up
          </Button>
        </div>

        <p className="text-center text-gray-400 text-sm mt-6">
          Already have an account?{" "}
          <Link href="/sign-in" className="text-purple-400 hover:text-purple-300 transition-colors">
            Sign in
          </Link>
        </p>
      </>
    );
  }

  return (
    <>
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Create your account</h1>
        <p className="text-gray-400">
          {selectedPlan ? `Sign up for ${planConfig?.name} plan` : 'Get started with SecCheck today'}
        </p>
      </div>

      {/* Selected Plan Display */}
      {selectedPlan && planConfig && (
        <div className="mb-6 p-4 bg-gradient-to-r from-purple-900/50 to-blue-900/50 border border-purple-500/50 rounded-lg">
          <div className="flex items-center gap-3 mb-2">
            <PlanIcon className="w-5 h-5 text-purple-400" />
            <span className="font-semibold text-white">{planConfig.name} Plan</span>
            <span className="text-purple-400">
              ${Math.floor(planPrice)}{planPrice % 1 !== 0 && `.${((planPrice % 1) * 100).toFixed(0).padStart(2, '0')}`}
              /{selectedInterval}
            </span>
          </div>
          <p className="text-sm text-gray-300">
            After signing up, you&apos;ll be redirected to complete your subscription.
          </p>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-red-200 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleEmailSignUp} className="space-y-4 mb-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
            Full Name
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleInputChange}
              className="pl-10 bg-black/50 border-gray-700 focus:border-purple-500 focus:ring-purple-500/20 text-white"
              placeholder="John Doe"
              required
              disabled={loading}
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
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
              name="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleInputChange}
              className="pl-10 pr-10 bg-black/50 border-gray-700 focus:border-purple-500 focus:ring-purple-500/20 text-white"
              placeholder="••••••••"
              required
              disabled={loading}
              minLength={6}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
              disabled={loading}
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
            Confirm Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className="pl-10 pr-10 bg-black/50 border-gray-700 focus:border-purple-500 focus:ring-purple-500/20 text-white"
              placeholder="••••••••"
              required
              disabled={loading}
              minLength={6}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
              disabled={loading}
            >
              {showConfirmPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3"
        >
          {loading ? "Creating account..." : "Create account"}
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
        onClick={handleGithubSignUp}
        disabled={loading}
        variant="outline"
        className="w-full border-gray-700 bg-black/50 hover:bg-gray-800 text-white font-semibold py-3"
      >
        <Github className="w-5 h-5 mr-2" />
        GitHub
      </Button>

      <p className="text-center text-gray-400 text-sm mt-6">
        Already have an account?{" "}
        <Link 
          href={redirectUrl ? `/sign-in?redirectUrl=${encodeURIComponent(redirectUrl)}` : "/sign-in"}
          className="text-purple-400 hover:text-purple-300 transition-colors"
        >
          Sign in
        </Link>
      </p>
    </>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignUpContent />
    </Suspense>
  );
}