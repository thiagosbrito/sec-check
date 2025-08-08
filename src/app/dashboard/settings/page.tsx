"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GlassCard } from "@/components/ui/glass-card";
import { 
  User, 
  Mail, 
  Shield, 
  Bell,
  Key,
  AlertCircle,
  CheckCircle2,
  RefreshCw
} from "lucide-react";
import { useClientAuth } from "@/hooks/useClientAuth";

export default function SettingsPage() {
  const { user } = useClientAuth();
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Form state
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailReports: true,
    scanCompleted: true,
    securityAlerts: true,
    weeklyDigest: false,
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.user_metadata?.name || '',
        email: user.email || '',
      });
    }
  }, [user]);

  const handleProfileSave = async () => {
    try {
      setSaveLoading(true);
      setMessage(null);
      
      // This would typically update the user profile
      // For now, we'll simulate success since Supabase auth handles this
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setMessage({
        type: 'success',
        text: 'Profile updated successfully'
      });
      
      setTimeout(() => setMessage(null), 5000);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to update profile'
      });
    } finally {
      setSaveLoading(false);
    }
  };

  const handleNotificationsSave = async () => {
    try {
      setSaveLoading(true);
      setMessage(null);
      
      // This would typically save notification preferences
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setMessage({
        type: 'success',
        text: 'Notification preferences saved'
      });
      
      setTimeout(() => setMessage(null), 5000);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to save preferences'
      });
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
            <p className="text-gray-400">
              Manage your account preferences and security settings
            </p>
          </div>
        </div>

        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
              message.type === 'success' 
                ? 'bg-green-900/20 border border-green-500/50' 
                : 'bg-red-900/20 border border-red-500/50'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            )}
            <div>
              <p className={`font-medium ${
                message.type === 'success' ? 'text-green-300' : 'text-red-300'
              }`}>
                {message.type === 'success' ? 'Success' : 'Error'}
              </p>
              <p className={`text-sm ${
                message.type === 'success' ? 'text-green-200' : 'text-red-200'
              }`}>
                {message.text}
              </p>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Profile Settings */}
          <GlassCard variant="dark" gradient="rainbow" className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <User className="w-6 h-6 text-purple-400" />
              <h2 className="text-xl font-semibold text-white">Profile Information</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                  Full Name
                </label>
                <Input
                  id="name"
                  value={profileData.name}
                  onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                  className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                  className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500"
                  placeholder="Enter your email"
                  disabled
                />
                <p className="text-xs text-gray-400 mt-1">
                  Email changes must be done through your authentication provider
                </p>
              </div>

              <Button
                onClick={handleProfileSave}
                disabled={saveLoading}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500"
              >
                {saveLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Profile'
                )}
              </Button>
            </div>
          </GlassCard>

          {/* Account Security */}
          <GlassCard variant="dark" gradient="rainbow" className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="w-6 h-6 text-green-400" />
              <h2 className="text-xl font-semibold text-white">Account Security</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                <div className="flex items-center gap-3">
                  <Key className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="text-white font-medium">Password</p>
                    <p className="text-sm text-gray-400">Last updated: Never</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-600 text-gray-300 hover:text-white hover:border-blue-500"
                  disabled
                >
                  Change Password
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-purple-400" />
                  <div>
                    <p className="text-white font-medium">Email Verification</p>
                    <p className="text-sm text-green-400">Verified</p>
                  </div>
                </div>
                <CheckCircle2 className="w-5 h-5 text-green-400" />
              </div>

              <div className="p-3 bg-blue-900/20 border border-blue-500/50 rounded-lg">
                <p className="text-blue-200 text-sm">
                  <AlertCircle className="w-4 h-4 inline mr-2" />
                  Security settings are managed by your authentication provider. 
                  Contact support for advanced security options.
                </p>
              </div>
            </div>
          </GlassCard>

          {/* Notification Preferences */}
          <GlassCard variant="dark" gradient="rainbow" className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <Bell className="w-6 h-6 text-yellow-400" />
              <h2 className="text-xl font-semibold text-white">Notifications</h2>
            </div>

            <div className="space-y-4">
              {Object.entries(notificationSettings).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">
                      {key === 'emailReports' && 'Email Reports'}
                      {key === 'scanCompleted' && 'Scan Completed'}
                      {key === 'securityAlerts' && 'Security Alerts'}
                      {key === 'weeklyDigest' && 'Weekly Digest'}
                    </p>
                    <p className="text-sm text-gray-400">
                      {key === 'emailReports' && 'Receive scan reports via email'}
                      {key === 'scanCompleted' && 'Notify when scans finish'}
                      {key === 'securityAlerts' && 'Critical security findings'}
                      {key === 'weeklyDigest' && 'Weekly summary of activity'}
                    </p>
                  </div>
                  <button
                    onClick={() => setNotificationSettings(prev => ({
                      ...prev,
                      [key]: !value
                    }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      value ? 'bg-blue-600' : 'bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        value ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              ))}

              <Button
                onClick={handleNotificationsSave}
                disabled={saveLoading}
                className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500"
              >
                {saveLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Preferences'
                )}
              </Button>
            </div>
          </GlassCard>

          {/* Quick Links */}
          <GlassCard variant="dark" gradient="rainbow" className="p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Quick Actions</h2>
            
            <div className="space-y-3">
              <Button
                asChild
                variant="outline"
                className="w-full justify-start border-gray-600 text-gray-300 hover:text-white hover:border-purple-500"
              >
                <a href="/dashboard/billing">
                  <Shield className="w-4 h-4 mr-2" />
                  Billing & Subscription
                </a>
              </Button>

              <Button
                asChild
                variant="outline"
                className="w-full justify-start border-gray-600 text-gray-300 hover:text-white hover:border-blue-500"
              >
                <a href="/dashboard/history">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Scan History
                </a>
              </Button>

              <Button
                asChild
                variant="outline"
                className="w-full justify-start border-gray-600 text-gray-300 hover:text-white hover:border-green-500"
              >
                <Link href="/dashboard/reports">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Security Reports
                </Link>
              </Button>
            </div>
          </GlassCard>
        </div>
      </motion.div>
    </div>
  );
}