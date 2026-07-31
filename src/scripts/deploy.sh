#!/bin/bash

echo "🚀 Starting deployment..."

# Step 1: Pull latest code
echo "📥 Pulling latest code..."
git pull origin main

# Step 2: Install dependencies
echo "📦 Installing dependencies..."
npm install --production

# Step 3: Run build
echo "🔨 Building application..."
npm run build

# Step 4: Run database migrations (if any)
echo "🗄️ Running database migrations..."
# npm run migrate

# Step 5: Restart PM2 process
echo "🔄 Restarting application..."
pm2 restart ecommerce-ai-engine || pm2 start dist/index.js --name ecommerce-ai-engine

# Step 6: Check status
echo "✅ Deployment complete!"
pm2 status

echo "📊 Checking application health..."
curl -s http://localhost:5000/health | jq '.'