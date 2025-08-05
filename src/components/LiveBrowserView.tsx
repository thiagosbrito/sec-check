"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Monitor, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface LiveBrowserViewProps {
  scanId: string;
  isScanning: boolean;
}

interface StreamData {
  streamUrl: string;
  liveViewEnabled: boolean;
  instructions: {
    message: string;
    note: string;
  };
}

export default function LiveBrowserView({ scanId, isScanning }: LiveBrowserViewProps) {
  const [streamData, setStreamData] = useState<StreamData | null>(null);
  const [showStream, setShowStream] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStreamInfo = async () => {
    if (!scanId) return;
    
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/scan/${scanId}/stream`);
      const data = await response.json();

      if (data.success) {
        setStreamData(data.data);
      } else {
        setError(data.error || 'Failed to get stream info');
      }
    } catch (err) {
      setError('Failed to connect to stream service');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isScanning && scanId) {
      fetchStreamInfo();
    }
  }, [isScanning, scanId]);

  if (!isScanning || !streamData) {
    return null;
  }

  return (
    <Card className="bg-gray-900/50 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Monitor className="w-5 h-5 text-blue-400" />
          Live Browser View
          {streamData.liveViewEnabled ? (
            <Badge variant="outline" className="text-green-400 border-green-400">
              LIVE
            </Badge>
          ) : (
            <Badge variant="outline" className="text-gray-400 border-gray-400">
              DISABLED
            </Badge>
          )}
        </CardTitle>
        <CardDescription className="text-gray-400">
          {streamData.instructions.message}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-red-900/20 border border-red-800 rounded-lg">
            <div className="flex items-center gap-2 text-red-400">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}

        {streamData.liveViewEnabled ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => setShowStream(!showStream)}
                variant={showStream ? "destructive" : "default"}
                className="flex items-center gap-2"
              >
                {showStream ? (
                  <>
                    <EyeOff className="w-4 h-4" />
                    Hide Stream
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4" />
                    Show Live View
                  </>
                )}
              </Button>
              <Button
                onClick={fetchStreamInfo}
                variant="outline"
                disabled={loading}
                className="text-gray-300"
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </Button>
            </div>

            {showStream && (
              <div className="border border-gray-700 rounded-lg overflow-hidden bg-black">
                <div className="bg-gray-800 px-4 py-2 border-b border-gray-700">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="ml-4 text-sm text-gray-400">Railway Worker Browser</span>
                  </div>
                </div>
                <div className="relative">
                  <iframe
                    src={streamData.streamUrl}
                    className="w-full h-96 bg-black"
                    allow="fullscreen"
                    title="Live Browser View"
                  />
                  <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-bold">
                    ● LIVE
                  </div>
                </div>
              </div>
            )}

            <div className="text-sm text-gray-400 bg-gray-800/50 p-3 rounded-lg">
              <strong>💡 What you'll see:</strong>
              <ul className="mt-2 space-y-1 text-xs">
                <li>• Playwright opening your website in a real browser</li>
                <li>• Automated mouse movements and clicks</li>
                <li>• Security tests running in real-time</li>
                <li>• Form interactions and navigation</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <Monitor className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="mb-2">Live view is currently disabled</p>
            <p className="text-sm opacity-75">
              Enable live viewing in Railway worker settings to see browser automation in real-time
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}