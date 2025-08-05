# Use Node.js 18 with Playwright support
FROM node:18-slim

# Install system dependencies for Playwright + VNC for live viewing
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    gnupg \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    lsb-release \
    xdg-utils \
    xvfb \
    x11vnc \
    fluxbox \
    websockify \
    novnc \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Install Playwright browsers with dependencies  
RUN npx playwright install --with-deps chromium

# Verify browser installation
RUN npx playwright install --dry-run chromium

# Copy source code
COPY . .

# Make VNC script executable
RUN chmod +x start-vnc.sh

# Build TypeScript
RUN pnpm build

# Create non-root user for security
RUN groupadd -r seccheck && useradd -r -g seccheck -G audio,video seccheck \
    && mkdir -p /home/seccheck/Downloads \
    && chown -R seccheck:seccheck /home/seccheck \
    && chown -R seccheck:seccheck /app

# Switch to non-root user
USER seccheck

# Expose health check port and VNC port
EXPOSE 3001 6080

# Health check via HTTP endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

# Start VNC server and worker
CMD ["sh", "-c", "./start-vnc.sh && node dist/worker.js"]