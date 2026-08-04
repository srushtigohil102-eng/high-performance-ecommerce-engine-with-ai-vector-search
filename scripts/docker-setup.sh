#!/bin/bash

echo "🐳 Docker Setup for E-Commerce AI Engine"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker Desktop first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"

# Build and start containers
echo "📦 Building and starting containers..."
docker-compose up -d --build

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check container status
echo "📊 Container status:"
docker-compose ps

# Show logs
echo "📋 Application logs:"
docker-compose logs app --tail=20

echo ""
echo "✅ Docker setup complete!"
echo "📍 Application: http://localhost:5000"
echo "📍 MongoDB: mongodb://localhost:27017"
echo "📍 Redis: redis://localhost:6379"
echo ""
echo "📋 Commands:"
echo "  docker-compose up -d     Start containers"
echo "  docker-compose down      Stop containers"
echo "  docker-compose logs      View logs"
echo "  docker-compose ps        Check status"
