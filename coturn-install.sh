#!/bin/bash

# CoTURN Quick Setup Script for Ubuntu/Debian
# Run with: sudo bash coturn-install.sh

echo "🚀 Installing CoTURN Server..."

# Update system
apt-get update

# Install CoTURN
apt-get install -y coturn

# Enable CoTURN service
systemctl enable coturn

# Generate secret key
SECRET=$(openssl rand -hex 32)
echo "Generated secret: $SECRET"

# Get public IP
PUBLIC_IP=$(curl -s ifconfig.me)
echo "Detected public IP: $PUBLIC_IP"

# Create configuration
cat > /etc/turnserver.conf << EOF
# CoTURN Configuration
listening-port=3478
tls-listening-port=5349
external-ip=$PUBLIC_IP
relay-ip=$PUBLIC_IP
use-auth-secret
static-auth-secret=$SECRET
realm=turnserver.local
log-file=/var/log/turnserver.log
verbose
no-multicast-peers
no-cli
no-tlsv1
no-tlsv1_1
fingerprint
max-bps=1000000
user-quota=12
total-quota=1200
min-port=49152
max-port=65535
userdb=/var/lib/turn/turndb
denied-peer-ip=0.0.0.0-0.255.255.255
denied-peer-ip=10.0.0.0-10.255.255.255
denied-peer-ip=172.16.0.0-172.31.255.255
denied-peer-ip=192.168.0.0-192.168.255.255
allowed-peer-ip=127.0.0.1
EOF

# Configure firewall
ufw allow 3478/tcp
ufw allow 3478/udp
ufw allow 5349/tcp
ufw allow 5349/udp
ufw allow 49152:65535/udp

# Create user
turnadmin -a -u turnuser -p turnpass -r turnserver.local

# Start service
systemctl start coturn

# Check status
systemctl status coturn

echo "✅ CoTURN installation complete!"
echo ""
echo "📋 Configuration Details:"
echo "Server IP: $PUBLIC_IP"
echo "TURN Port: 3478"
echo "TURNS Port: 5349"
echo "Username: turnuser"
echo "Password: turnpass"
echo "Secret: $SECRET"
echo ""
echo "🔧 Add to your ICE servers:"
echo "{"
echo "  urls: ['turn:$PUBLIC_IP:3478', 'turns:$PUBLIC_IP:5349'],"
echo "  username: 'turnuser',"
echo "  credential: 'turnpass'"
echo "}"