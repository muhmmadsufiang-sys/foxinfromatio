# Remote Desktop Pro - WebSocket Signaling Server

## 🚀 Quick Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Server
```bash
npm start
```

### 3. Development Mode (Auto-restart)
```bash
npm run dev
```

## 📡 Server Features

- **WebSocket Signaling**: Real-time peer connection management
- **Room Management**: Create and join rooms with 6-digit codes
- **Auto-reconnection**: Client reconnects automatically
- **File Serving**: Serves your HTML/CSS/JS files
- **Error Handling**: Robust error management

## 🌐 Usage

### Local Development
- Server: `http://localhost:8080`
- WebSocket: `ws://localhost:8080`

### Production Deployment
1. Deploy to cloud service (Heroku, Railway, etc.)
2. Update WebSocket URL in signaling-client.js
3. Use HTTPS/WSS for secure connections

## 🔧 Configuration

Edit `server.js` to change:
- Port number (default: 8080)
- CORS settings
- Room management logic

## 📱 Client Integration

The signaling client automatically:
- Connects to WebSocket server
- Handles room creation/joining
- Manages WebRTC signaling
- Provides reconnection logic

## 🛠️ Commands

```bash
# Install dependencies
npm install

# Start production server
npm start

# Start development server with auto-reload
npm run dev
```

## 🔒 Security Notes

- Use WSS (secure WebSocket) in production
- Implement authentication if needed
- Add rate limiting for production use
- Consider using TURN servers for NAT traversal