// WebSocket Signaling Client
class SignalingClient {
    constructor() {
        this.ws = null;
        this.clientId = null;
        this.roomId = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
    }
    
    connect(serverUrl = 'ws://localhost:8080') {
        try {
            this.ws = new WebSocket(serverUrl);
            
            this.ws.onopen = () => {
                console.log('Connected to signaling server');
                this.isConnected = true;
                this.reconnectAttempts = 0;
            };
            
            this.ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.handleMessage(data);
            };
            
            this.ws.onclose = () => {
                console.log('Disconnected from signaling server');
                this.isConnected = false;
                this.attemptReconnect(serverUrl);
            };
            
            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };
            
        } catch (error) {
            console.error('Failed to connect to signaling server:', error);
        }
    }
    
    attemptReconnect(serverUrl) {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Reconnection attempt ${this.reconnectAttempts}`);
            setTimeout(() => {
                this.connect(serverUrl);
            }, 2000 * this.reconnectAttempts);
        }
    }
    
    handleMessage(data) {
        switch (data.type) {
            case 'connected':
                this.clientId = data.clientId;
                break;
                
            case 'room-created':
                this.roomId = data.roomId;
                if (window.onRoomCreated) {
                    window.onRoomCreated(data.roomId);
                }
                break;
                
            case 'room-joined':
                this.roomId = data.roomId;
                if (window.onRoomJoined) {
                    window.onRoomJoined(data.roomId, data.hostId);
                }
                break;
                
            case 'viewer-joined':
                if (window.onViewerJoined) {
                    window.onViewerJoined(data.viewerId);
                }
                break;
                
            case 'signal':
            case 'offer':
            case 'answer':
            case 'ice-candidate':
                if (window.onSignalReceived) {
                    window.onSignalReceived(data);
                }
                break;
                
            case 'host-disconnected':
                if (window.onHostDisconnected) {
                    window.onHostDisconnected();
                }
                break;
                
            case 'viewer-disconnected':
                if (window.onViewerDisconnected) {
                    window.onViewerDisconnected(data.viewerId);
                }
                break;
                
            case 'error':
                console.error('Server error:', data.message);
                if (window.onServerError) {
                    window.onServerError(data.message);
                }
                break;
        }
    }
    
    createRoom(roomId) {
        if (this.isConnected) {
            this.ws.send(JSON.stringify({
                type: 'create-room',
                roomId: roomId
            }));
        }
    }
    
    joinRoom(roomId) {
        if (this.isConnected) {
            this.ws.send(JSON.stringify({
                type: 'join-room',
                roomId: roomId
            }));
        }
    }
    
    sendSignal(to, signal) {
        if (this.isConnected) {
            this.ws.send(JSON.stringify({
                type: 'signal',
                to: to,
                signal: signal
            }));
        }
    }
    
    sendOffer(to, offer) {
        if (this.isConnected) {
            this.ws.send(JSON.stringify({
                type: 'offer',
                to: to,
                offer: offer
            }));
        }
    }
    
    sendAnswer(to, answer) {
        if (this.isConnected) {
            this.ws.send(JSON.stringify({
                type: 'answer',
                to: to,
                answer: answer
            }));
        }
    }
    
    sendIceCandidate(to, candidate) {
        if (this.isConnected) {
            this.ws.send(JSON.stringify({
                type: 'ice-candidate',
                to: to,
                candidate: candidate
            }));
        }
    }
}

// Global signaling client instance
window.signalingClient = new SignalingClient();