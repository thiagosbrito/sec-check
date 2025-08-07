"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

function CallbackContent() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // Function to handle checkout redirection
  const handleCheckoutRedirect = async (plan: string, interval: string) => {
    try {
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan,
          interval,
          successUrl: `${window.location.origin}/dashboard/billing?success=true`,
          cancelUrl: `${window.location.origin}/dashboard/billing?canceled=true`,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await response.json();
      
      if (url) {
        // Redirect to Stripe Checkout
        window.location.href = url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      // Fallback to dashboard with error
      router.push('/dashboard?error=checkout_failed');
    }
  };

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the code from URL params
        const code = searchParams.get('code');
        const redirectUrl = searchParams.get('redirectUrl');
        const shouldCheckout = searchParams.get('checkout');
        const selectedPlan = searchParams.get('plan');
        const selectedInterval = searchParams.get('interval');
        
        if (code) {
          // Exchange the code for a session
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          
          if (error) {
            console.error("Auth callback error:", error);
            setStatus("error");
            setError(error.message);
            return;
          }

          if (data.session) {
            setStatus("success");
            
            // TODO: Create user in our database using tRPC
            // This will be implemented when we integrate tRPC with auth
            
            // Redirect based on plan selection or redirect URL
            setTimeout(() => {
              if (shouldCheckout && selectedPlan && selectedInterval) {
                // Create checkout session and redirect to Stripe
                handleCheckoutRedirect(selectedPlan, selectedInterval);
              } else if (redirectUrl) {
                // Redirect to scan page with the URL parameter
                router.push(`/dashboard/scan?url=${encodeURIComponent(redirectUrl)}`);
              } else {
                // Default redirect to dashboard
                router.push("/dashboard");
              }
            }, 2000);
          }
        } else {
          // No code found, check if we have an existing session
          const { data, error } = await supabase.auth.getSession();

          if (error) {
            console.error("Session error:", error);
            setStatus("error");
            setError(error.message);
            return;
          }

          if (data.session) {
            setStatus("success");
            setTimeout(() => {
              router.push("/dashboard");
            }, 2000);
          } else {
            // No session found, redirect to sign in
            setTimeout(() => {
              router.push("/sign-in");
            }, 2000);
          }
        }
      } catch (err) {
        console.error("Unexpected error:", err);
        setStatus("error");
        setError("An unexpected error occurred");
      }
    };

    handleAuthCallback();
  }, [router, searchParams, supabase.auth]);

  if (status === "loading") {
    return (
      <>
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-900/50 rounded-full mb-6">
            <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Completing sign in</h1>
          <p className="text-gray-400">Please wait while we set up your account...</p>
        </div>
      </>
    );
  }

  if (status === "success") {
    return (
      <>
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-900/50 rounded-full mb-6">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Welcome to SecCheck!</h1>
          <p className="text-gray-400">Redirecting you to your dashboard...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-900/50 rounded-full mb-6">
          <AlertCircle className="w-8 h-8 text-red-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Authentication failed</h1>
        <p className="text-gray-400 mb-6">
          {error || "There was a problem with your authentication. Please try signing in again."}
        </p>
        <button
          onClick={() => router.push("/sign-in")}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200"
        >
          Go to Sign In
        </button>
      </div>
    </>
  );
}

export default function CallbackPage() {
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
      <CallbackContent />
    </Suspense>
  );
}