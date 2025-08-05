# Use Microsoft's official Playwright Docker image
FROM mcr.microsoft.com/playwright:v1.54.0-jammy

# Install curl for health checks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Install Playwright browsers (base image already has system dependencies)
RUN npx playwright install chromium

# Copy source code
COPY . .

# Build TypeScript
RUN pnpm build

# Create non-root user for security
RUN groupadd -r seccheck && useradd -r -g seccheck -G audio,video seccheck \
    && mkdir -p /home/seccheck/Downloads \
    && chown -R seccheck:seccheck /home/seccheck \
    && chown -R seccheck:seccheck /app

# Switch to non-root user
USER seccheck

# Expose health check port
EXPOSE 3001

# Health check via HTTP endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

# Start worker directly
CMD ["node", "dist/worker.js"]