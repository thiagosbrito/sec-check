#!/bin/bash

# Kill any existing X server
pkill -f Xvfb || true
pkill -f x11vnc || true
pkill -f websockify || true
pkill -f fluxbox || true

# Start virtual display
export DISPLAY=:99
Xvfb :99 -screen 0 1280x720x24 &

# Wait for X server to start
sleep 2

# Start window manager (optional, makes it look nicer)
fluxbox &

# Start VNC server
x11vnc -display :99 -nopw -listen localhost -xkb -forever -shared &

# Start websockify to proxy VNC over WebSocket (for web browsers)
echo "Starting websockify on port 6080..."
websockify --web=/usr/share/novnc --cert=self 6080 localhost:5900 &
WEBSOCKIFY_PID=$!

# Wait a bit for services to start
sleep 3

echo "VNC server started on display :99"
echo "WebSocket VNC available on port 6080"

# Debug: Check if processes are running
echo "Debug: Checking running processes..."
ps aux | grep -E "(Xvfb|x11vnc|websockify)" || echo "No VNC processes found"

# Check if ports are listening
echo "Debug: Checking open ports..."
netstat -tlnp 2>/dev/null | grep -E "(5900|6080)" || echo "VNC ports not listening"

# Test websockify specifically
echo "Debug: Testing websockify PID: $WEBSOCKIFY_PID"
if kill -0 $WEBSOCKIFY_PID 2>/dev/null; then
    echo "✅ Websockify is running"
else
    echo "❌ Websockify failed to start"
fi