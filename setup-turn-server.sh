#!/bin/bash

# Complete TURN Server Setup for Remote Desktop Pro
# Run this on Ubuntu/Debian VPS

echo "🚀 Setting up TURN Server for Remote Desktop Pro..."

# Update system
sudo apt update && sudo apt upgrade -y

# Install CoTURN
sudo apt install coturn -y

# Enable CoTURN service
sudo systemctl enable coturn

# Create configuration
sudo tee /etc/turnserver.conf > /dev/null <<EOF
# TURN Server Configuration for Remote Desktop Pro
listening-port=3478
tls-listening-port=5349
listening-ip=0.0.0.0
relay-ip=0.0.0.0
external-ip=$(curl -s ifconfig.me)

# Authentication
lt-cred-mech
user=sufian:sufian123

# Security
fingerprint
no-multicast-peers
no-cli
no-tlsv1
no-tlsv1_1

# Performance
total-quota=100
bps-capacity=0
stale-nonce=600

# Logging
log-file=/var/log/turnserver.log
verbose

# Realm
realm=teachsufian.com
server-name=coturn.teachsufian.com

# SSL (optional)
# cert=/etc/ssl/certs/turn_server_cert.pem
# pkey=/etc/ssl/private/turn_server_pkey.pem
EOF

# Configure firewall
sudo ufw allow 3478/tcp
sudo ufw allow 3478/udp
sudo ufw allow 5349/tcp
sudo ufw allow 5349/udp
sudo ufw allow 49152:65535/udp

# Start service
sudo systemctl restart coturn
sudo systemctl status coturn

echo "✅ TURN Server setup complete!"
echo "📋 Server Details:"
echo "   URL: turn:$(curl -s ifconfig.me):3478"
echo "   Username: sufian"
echo "   Password: sufian123"
echo ""
echo "🔧 Test your server at: https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/"