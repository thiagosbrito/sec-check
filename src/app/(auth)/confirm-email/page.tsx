"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle, AlertCircle, Loader2, Mail } from "lucide-react";

function ConfirmEmailContent() {
  const [status, setStatus] = useState<"loading" | "success" | "error" | "expired">("loading");
  const [error, setError] = useState("");
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const token = searchParams.get("token");
    const type = searchParams.get("type");

    const confirmEmail = async () => {
      if (!token || type !== "email") {
        setStatus("error");
        setError("Invalid confirmation link");
        return;
      }

      try {
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: "email",
        });

        if (error) {
          if (error.message.includes("expired")) {
            setStatus("expired");
          } else {
            setStatus("error");
            setError(error.message);
          }
          return;
        }

        if (data.user) {
          setStatus("success");
          // Redirect to dashboard after 3 seconds
          setTimeout(() => {
            router.push("/dashboard");
          }, 3000);
        }
      } catch (err) {
        setStatus("error");
        setError("An unexpected error occurred");
      }
    };

    confirmEmail();
  }, [searchParams, router, supabase.auth]);

  const resendConfirmation = async () => {
    const email = searchParams.get("email");
    if (!email) {
      setError("Email not found");
      return;
    }

    try {
      setStatus("loading");
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/callback`,
        },
      });

      if (error) {
        setStatus("error");
        setError(error.message);
      } else {
        setStatus("success");
      }
    } catch (err) {
      setStatus("error");
      setError("Failed to resend confirmation email");
    }
  };

  if (status === "loading") {
    return (
      <>
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-900/50 rounded-full mb-6">
            <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Confirming your email</h1>
          <p className="text-gray-400">Please wait while we verify your account...</p>
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
          <h1 className="text-2xl font-bold text-white mb-2">Email confirmed!</h1>
          <p className="text-gray-400 mb-6">
            Your account has been successfully verified. You&apos;ll be redirected to your dashboard shortly.
          </p>
          
          <Button
            onClick={() => router.push("/dashboard")}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3"
          >
            Go to Dashboard
          </Button>
        </div>
      </>
    );
  }

  if (status === "expired") {
    return (
      <>
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-900/50 rounded-full mb-6">
            <Mail className="w-8 h-8 text-orange-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Link expired</h1>
          <p className="text-gray-400 mb-6">
            Your confirmation link has expired. Click below to receive a new confirmation email.
          </p>
          
          <div className="space-y-4">
            <Button
              onClick={resendConfirmation}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3"
            >
              Resend confirmation email
            </Button>
            
            <Link href="/sign-up">
              <Button
                variant="outline"
                className="w-full border-gray-700 bg-black/50 hover:bg-gray-800 text-white"
              >
                Back to sign up
              </Button>
            </Link>
          </div>
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
        <h1 className="text-2xl font-bold text-white mb-2">Confirmation failed</h1>
        <p className="text-gray-400 mb-6">
          {error || "We couldn&apos;t confirm your email address. Please try again."}
        </p>
        
        <div className="space-y-4">
          <Button
            onClick={resendConfirmation}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3"
          >
            Resend confirmation email
          </Button>
          
          <Link href="/sign-up">
            <Button
              variant="outline"
              className="w-full border-gray-700 bg-black/50 hover:bg-gray-800 text-white"
            >
              Back to sign up
            </Button>
          </Link>
        </div>
      </div>
    </>
  );
}

export default function ConfirmEmailPage() {
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
      <ConfirmEmailContent />
    </Suspense>
  );
}