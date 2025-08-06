"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock, Zap, Scan } from "lucide-react";
import { normalizeUrl, isValidUrl } from "@/lib/utils/url";
import { cn } from "@/lib/utils";

interface URLInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (normalizedUrl: string) => void;
  placeholder?: string;
  disabled?: boolean;
  isLoading?: boolean;
  loadingText?: string;
  submitText?: string;
  variant?: "hero" | "dashboard";
  className?: string;
  inputClassName?: string;
  buttonClassName?: string;
}

export function URLInput({
  value,
  onChange,
  onSubmit,
  placeholder = "https://example.com",
  disabled = false,
  isLoading = false,
  loadingText = "Scanning...",
  submitText = "Start Scan",
  variant = "dashboard",
  className,
  inputClassName,
  buttonClassName,
}: URLInputProps) {
  const [isValid, setIsValid] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validate URL on change
  useEffect(() => {
    if (value.trim()) {
      setIsValid(isValidUrl(value));
    } else {
      setIsValid(true); // Empty is considered valid (not an error state)
    }
  }, [value]);

  const handleSubmit = async () => {
    if (!value.trim() || !isValid || disabled || isLoading || isSubmitting) return;
    
    // Prevent double submissions
    setIsSubmitting(true);
    
    try {
      const normalizedUrl = normalizeUrl(value);
      await onSubmit(normalizedUrl);
    } finally {
      // Reset after a delay to prevent rapid resubmission
      setTimeout(() => setIsSubmitting(false), 2000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  const canSubmit = value.trim() && isValid && !disabled && !isLoading && !isSubmitting;

  if (variant === "hero") {
    return (
      <div className={cn("max-w-2xl mx-auto", className)}>
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur-lg opacity-25 group-hover:opacity-40 transition duration-1000"></div>
          <div className="relative bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none z-10">
                  <Lock className="w-5 h-5 text-gray-500" />
                </div>
                <Input
                  type="text"
                  placeholder={placeholder}
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className={cn(
                    "h-14 text-lg bg-black/50 border-gray-700 focus:border-purple-500 focus:ring-purple-500/20 text-white placeholder:text-gray-400 pl-12",
                    !isValid && value.trim() && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
                    inputClassName
                  )}
                  disabled={disabled || isLoading}
                />
              </div>
              <Button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className={cn(
                  "h-14 px-8 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold text-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none",
                  buttonClassName
                )}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Scan className="w-5 h-5 animate-spin" />
                    {loadingText}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    {submitText}
                  </div>
                )}
              </Button>
            </div>
            {!isValid && value.trim() && (
              <p className="text-red-400 text-sm mt-2 ml-1">
                Please enter a valid website URL
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Dashboard variant
  return (
    <div className={cn("flex gap-4", className)}>
      <div className="flex-1">
        <Input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className={cn(
            "bg-black/50 border-gray-700 focus:border-purple-500 focus:ring-purple-500/20 text-white",
            !isValid && value.trim() && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
            inputClassName
          )}
          disabled={disabled || isLoading}
        />
        {!isValid && value.trim() && (
          <p className="text-red-400 text-xs mt-1">
            Please enter a valid website URL
          </p>
        )}
      </div>
      <Button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className={cn(
          "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold px-8",
          buttonClassName
        )}
      >
        {isLoading ? (
          <>
            <Scan className="w-4 h-4 mr-2 animate-spin" />
            {loadingText}
          </>
        ) : (
          <>
            <Scan className="w-4 h-4 mr-2" />
            {submitText}
          </>
        )}
      </Button>
    </div>
  );
}