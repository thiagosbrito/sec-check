#!/bin/bash

echo "🔍 Debugging Playwright browser installation..."

echo "📂 Checking Playwright cache directory:"
ls -la /home/seccheck/.cache/ms-playwright/ || echo "Cache directory not found"

echo ""
echo "🌐 Checking specific browser directories:"
find /home/seccheck/.cache/ms-playwright/ -name "*chromium*" -type d 2>/dev/null || echo "No chromium directories found"

echo ""
echo "🚀 Checking for executable files:"
find /home/seccheck/.cache/ms-playwright/ -name "chrome*" -type f -executable 2>/dev/null || echo "No chrome executables found"

echo ""
echo "💻 Running playwright install --dry-run:"
npx playwright install --dry-run chromium || echo "Dry run failed"

echo ""
echo "🎯 Environment variables:"
echo "PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH: ${PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH:-'not set'}"
echo "HOME: ${HOME:-'not set'}"
echo "USER: ${USER:-'not set'}"