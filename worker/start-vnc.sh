#!/bin/bash

# Kill any existing services
pkill -f Xvfb || true
pkill -f x11vnc || true  
pkill -f websockify || true

# Start virtual display
export DISPLAY=:99
Xvfb :99 -screen 0 1280x720x24 &
sleep 2

# Start VNC server (simplified)
x11vnc -display :99 -nopw -listen localhost -forever -shared &
sleep 2

# Start websockify (simplified)
echo "🚀 Starting websockify on port 6080..."
websockify 6080 localhost:5900 &
WEBSOCKIFY_PID=$!
sleep 2

# Quick status check
echo "📊 VNC Status:"
echo "- Display: $DISPLAY"
echo "- VNC Port: 5900"  
echo "- WebSocket Port: 6080"

# Check if websockify is running
if kill -0 $WEBSOCKIFY_PID 2>/dev/null; then
    echo "✅ Websockify running (PID: $WEBSOCKIFY_PID)"
else
    echo "❌ Websockify failed"
fi

echo "🎬 VNC setup complete"