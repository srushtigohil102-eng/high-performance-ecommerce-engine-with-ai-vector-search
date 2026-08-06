# 🚀 Deployment Guide

## 📋 Prerequisites

- Node.js 18+
- MongoDB 8.0+ (or MongoDB Atlas)
- Redis 7.0+
- Docker (optional)
- PM2 (for production)

---

## 🐳 Option 1: Docker Deployment (Recommended)

### Step 1: Install Docker
- Windows: https://www.docker.com/products/docker-desktop/
- Mac: https://www.docker.com/products/docker-desktop/
- Linux: https://docs.docker.com/engine/install/

### Step 2: Configure Environment
```bash
cp .env.example .env
# Edit .env with production values
Step 3: Build and Deploy
bash
# Build images
docker-compose build

# Start containers
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f app
Step 4: Verify Deployment
bash
curl http://localhost:5000/health

 Option 2: PM2 Deployment
Step 1: Install PM2
bash
npm install -g pm2
Step 2: Build Application
bash
npm run build
Step 3: Start with PM2
bash
pm2 start ecosystem.config.js
pm2 save
pm2 status
Step 4: Set PM2 to Start on Boot
bash
pm2 startup
pm2 save
Step 5: Monitor
bash
pm2 logs
pm2 monit
☁️ Option 3: Cloud Deployment
AWS EC2
Launch Ubuntu 22.04 instance

SSH into instance

Install Node.js, MongoDB, Redis

Clone repository

Install dependencies

Build and start with PM2

DigitalOcean Droplet
Create Ubuntu Droplet

SSH into droplet

Install Node.js, MongoDB, Redis

Clone repository

Install dependencies

Build and start with PM2

Heroku
Create heroku.yml

Add MongoDB Atlas URL

Add Redis URL

Deploy with Git

🔧 Environment Variables
Production .env
env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://username:password@host:port/database
REDIS_URL=redis://host:6379
JWT_SECRET=strong_secret_key_here
🧪 Health Checks
Application Health
text
GET /health
Expected Response
json
{
  "status": "healthy",
  "timestamp": "2026-07-30T...",
  "environment": "production",
  "services": {
    "mongodb": { "status": "connected" },
    "redis": { "status": "connected" }
  },
  "system": {
    "memory": { "usagePercent": "45.00" },
    "cpu": { "cores": 8 }
  },
  "responseTime": 12
}
📊 Monitoring
PM2 Monitoring
bash
pm2 monit
pm2 logs
pm2 status
pm2 describe ecommerce-ai-engine
Docker Monitoring
bash
docker stats
docker logs ecommerce-app
docker-compose logs -f
Application Monitoring
Winston logs in logs/ directory

Request tracking middleware

Error logging with context

Performance metrics

🔒 Security
Production Security Checklist
□ HTTPS enabled (use Nginx/SSL)
□ MongoDB authentication enabled
□ Redis authentication enabled
□ JWT secret in environment variable
□ Rate limiting enabled
□ Helmet security headers enabled
□ CORS configured for frontend domain
□ Input validation enabled
□ SQL injection protection (MongoDB)
□ XSS protection enabled
🐛 Troubleshooting
Common Issues
Issue	Solution
MongoDB connection failed	Check MongoDB URI and network
Redis connection failed	Check Redis URI and network
Port already in use	Change PORT in .env
Permission denied	Run with sudo or check permissions
Out of memory	Increase memory limit
Debug Commands
bash
# Check logs
tail -f logs/combined.log

# Check process
ps aux | grep node

# Check ports
netstat -tulpn | grep 5000

# Check MongoDB
mongosh --eval "db.adminCommand('ping')"

# Check Redis
redis-cli ping
📋 Post-Deployment Checklist
□ Health endpoint returns 200
□ Swagger docs accessible at /api-docs
□ MongoDB connection successful
□ Redis connection successful
□ JWT authentication working
□ Product CRUD working
□ Search API working
□ Email notifications working
□ Payment integration working
□ Logs are being generated
□ Monitoring is set up
□ Backups are configured