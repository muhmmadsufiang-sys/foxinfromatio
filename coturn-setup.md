# CoTURN Server Setup Guide

## Installation on Ubuntu/Debian

```bash
# Update system packages
sudo apt-get update
sudo apt-get install coturn

# Enable CoTURN service
sudo systemctl enable coturn
```

## Configuration

### 1. Edit CoTURN Configuration
```bash
sudo nano /etc/turnserver.conf
```

### 2. Basic Configuration
```conf
# Basic TURN server configuration
listening-port=3478
tls-listening-port=5349

# External IP (replace with your server's public IP)
external-ip=YOUR_PUBLIC_IP

# Relay IP range
relay-ip=YOUR_PUBLIC_IP

# Authentication
use-auth-secret
static-auth-secret=YOUR_SECRET_KEY

# Database for users (optional)
userdb=/var/lib/turn/turndb

# Logging
log-file=/var/log/turnserver.log
verbose

# Security
no-multicast-peers
no-cli
no-tlsv1
no-tlsv1_1

# Realm
realm=yourserver.com

# Fingerprint
fingerprint
```

### 3. Generate Secret Key
```bash
# Generate a random secret
openssl rand -hex 32
```

### 4. Create User Database (Optional)
```bash
sudo turnadmin -a -u username -p password -r yourserver.com
```

## Firewall Configuration

```bash
# Allow TURN ports
sudo ufw allow 3478/tcp
sudo ufw allow 3478/udp
sudo ufw allow 5349/tcp
sudo ufw allow 5349/udp

# Allow relay port range
sudo ufw allow 49152:65535/udp
```

## SSL Certificate Setup

### Using Let's Encrypt
```bash
# Install certbot
sudo apt-get install certbot

# Get certificate
sudo certbot certonly --standalone -d yourserver.com

# Update CoTURN config
cert=/etc/letsencrypt/live/yourserver.com/cert.pem
pkey=/etc/letsencrypt/live/yourserver.com/privkey.pem
```

## Start CoTURN Service

```bash
# Start the service
sudo systemctl start coturn

# Check status
sudo systemctl status coturn

# View logs
sudo tail -f /var/log/turnserver.log
```

## Testing Your TURN Server

```bash
# Test TURN server connectivity
turnutils_uclient -t -T -v YOUR_PUBLIC_IP -p 3478 -u username -w password
```

## Integration with Remote Desktop

Add your TURN server to the ICE servers configuration:

```javascript
// Add to enhancedIceServers array
{
    urls: [
        'turn:YOUR_PUBLIC_IP:3478',
        'turns:YOUR_PUBLIC_IP:5349'
    ],
    username: 'username',
    credential: 'password'
}
```

## Production Recommendations

1. **Use Strong Credentials**: Generate secure usernames and passwords
2. **Enable SSL/TLS**: Use TURNS (secure TURN) for production
3. **Monitor Resources**: TURN servers can be resource-intensive
4. **Rate Limiting**: Configure rate limits to prevent abuse
5. **Regular Updates**: Keep CoTURN updated for security patches

## Troubleshooting

### Common Issues:
- **Port blocked**: Check firewall settings
- **SSL errors**: Verify certificate paths
- **Authentication failed**: Check username/password
- **High CPU usage**: Monitor concurrent connections

### Debug Commands:
```bash
# Check if CoTURN is listening
sudo netstat -tulpn | grep :3478

# Test connectivity
telnet YOUR_PUBLIC_IP 3478

# Check logs for errors
sudo journalctl -u coturn -f
```