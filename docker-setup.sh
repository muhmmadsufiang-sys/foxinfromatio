#!/bin/bash

# Docker TURN Server Setup for Remote Desktop Pro

echo "🐳 Setting up TURN Server with Docker..."

# Get external IP
EXTERNAL_IP=$(curl -s ifconfig.me)
echo "📡 External IP: $EXTERNAL_IP"

# Export for docker-compose
export EXTERNAL_IP=$EXTERNAL_IP

# Install Docker if not installed
if ! command -v docker &> /dev/null; then
    echo "📦 Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
fi

# Install Docker Compose if not installed
if ! command -v docker-compose &> /dev/null; then
    echo "📦 Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# Create logs directory
mkdir -p logs

# Start TURN server
echo "🚀 Starting TURN Server..."
docker-compose up -d

# Wait for service to start
sleep 5

# Check status
docker-compose ps

echo "✅ TURN Server is running!"
echo "📋 Server Details:"
echo "   URL: turn:$EXTERNAL_IP:3478"
echo "   Username: sufian"
echo "   Password: sufian123"
echo ""
echo "🔧 Test at: https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/"
echo "📊 Check logs: docker-compose logs -f coturn"