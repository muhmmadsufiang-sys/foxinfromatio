const WebSocket = require('ws');
const http = require('http');
const path = require('path');
const fs = require('fs');

// Create HTTP server for serving files
const server = http.createServer((req, res) => {
    if (req.url === '/') {
        fs.readFile(path.join(__dirname, 'index.html'), (err, data) => {
            if (err) {
                res.writeHead(404);
                res.end('File not found');
                return;
            }
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(data);
        });
    } else {
        const filePath = path.join(__dirname, req.url);
        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(404);
                res.end('File not found');
                return;
            }
            const ext = path.extname(filePath);
            const contentType = {
                '.html': 'text/html',
                '.js': 'application/javascript',
                '.css': 'text/css'
            }[ext] || 'text/plain';
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(data);
        });
    }
});

// WebSocket server
const wss = new WebSocket.Server({ server });

const clients = new Map();
const rooms = new Map();

function generateId() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

wss.on('connection', (ws) => {
    const clientId = generateId();
    clients.set(clientId, { ws, roomId: null });
    
    console.log(`Client ${clientId} connected`);
    
    ws.send(JSON.stringify({
        type: 'connected',
        clientId: clientId
    }));
    
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            
            switch (data.type) {
                case 'create-room':
                    const roomId = data.roomId || generateId();
                    rooms.set(roomId, { host: clientId, viewers: [] });
                    clients.get(clientId).roomId = roomId;
                    
                    ws.send(JSON.stringify({
                        type: 'room-created',
                        roomId: roomId
                    }));
                    break;
                    
                case 'join-room':
                    const targetRoom = data.roomId;
                    if (rooms.has(targetRoom)) {
                        const room = rooms.get(targetRoom);
                        room.viewers.push(clientId);
                        clients.get(clientId).roomId = targetRoom;
                        
                        // Notify host
                        const hostClient = clients.get(room.host);
                        if (hostClient) {
                            hostClient.ws.send(JSON.stringify({
                                type: 'viewer-joined',
                                viewerId: clientId
                            }));
                        }
                        
                        ws.send(JSON.stringify({
                            type: 'room-joined',
                            roomId: targetRoom,
                            hostId: room.host
                        }));
                    } else {
                        ws.send(JSON.stringify({
                            type: 'error',
                            message: 'Room not found'
                        }));
                    }
                    break;
                    
                case 'signal':
                    // Forward WebRTC signaling data
                    const targetClient = clients.get(data.to);
                    if (targetClient) {
                        targetClient.ws.send(JSON.stringify({
                            type: 'signal',
                            from: clientId,
                            data: data.signal
                        }));
                    }
                    break;
                    
                case 'offer':
                case 'answer':
                case 'ice-candidate':
                    // Forward WebRTC messages
                    const recipient = clients.get(data.to);
                    if (recipient) {
                        recipient.ws.send(JSON.stringify({
                            ...data,
                            from: clientId
                        }));
                    }
                    break;
            }
        } catch (error) {
            console.error('Message parsing error:', error);
        }
    });
    
    ws.on('close', () => {
        console.log(`Client ${clientId} disconnected`);
        
        const client = clients.get(clientId);
        if (client && client.roomId) {
            const room = rooms.get(client.roomId);
            if (room) {
                if (room.host === clientId) {
                    // Host disconnected, notify all viewers
                    room.viewers.forEach(viewerId => {
                        const viewer = clients.get(viewerId);
                        if (viewer) {
                            viewer.ws.send(JSON.stringify({
                                type: 'host-disconnected'
                            }));
                        }
                    });
                    rooms.delete(client.roomId);
                } else {
                    // Viewer disconnected
                    room.viewers = room.viewers.filter(id => id !== clientId);
                    const hostClient = clients.get(room.host);
                    if (hostClient) {
                        hostClient.ws.send(JSON.stringify({
                            type: 'viewer-disconnected',
                            viewerId: clientId
                        }));
                    }
                }
            }
        }
        
        clients.delete(clientId);
    });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`WebSocket server running on ws://localhost:${PORT}`);
});