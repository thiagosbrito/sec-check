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
websockify --web=/usr/share/novnc 6080 localhost:5900 &

# Wait a bit for services to start
sleep 3

echo "VNC server started on display :99"
echo "WebSocket VNC available on port 6080"