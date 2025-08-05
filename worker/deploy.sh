#!/bin/bash

# SecCheck Worker Deployment Script for Fly.io

set -e

echo "🚀 Deploying SecCheck Security Scanner Worker to Fly.io..."

# Check if flyctl is installed
if ! command -v flyctl &> /dev/null; then
    echo "❌ flyctl is not installed. Please install it first:"
    echo "curl -L https://fly.io/install.sh | sh"
    exit 1
fi

# Build TypeScript
echo "📦 Building TypeScript..."
npm run build

# Check if app exists
if ! flyctl apps list | grep -q "sec-check-worker"; then
    echo "🆕 Creating new Fly.io app..."
    flyctl apps create sec-check-worker
fi

# Set secrets (you'll need to run these manually with your actual values)
echo "🔐 Setting up secrets..."
echo "Please run these commands with your actual values:"
echo "flyctl secrets set DATABASE_URL='your-supabase-postgresql-url'"
echo "flyctl secrets set REDIS_URL='your-redis-url'"
echo ""
echo "Press Enter when you've set the secrets..."
read

# Deploy to Fly.io
echo "🚁 Deploying to Fly.io..."
flyctl deploy

# Check deployment status
echo "✅ Deployment completed!"
echo "Check status: flyctl status"
echo "View logs: flyctl logs"
echo "Scale workers: flyctl scale count 2"

echo "🎉 SecCheck Worker deployed successfully!"