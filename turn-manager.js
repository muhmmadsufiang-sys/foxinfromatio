// Enhanced TURN Server Manager for Global Connectivity
// Optimized for out-of-city and long-distance connections

class TurnServerManager {
    constructor() {
        this.serverIP = null;
        this.isReady = false;
        this.globalServers = [
            // Your primary servers
            'coturn.teachsufian.com',
            'turn.teachsufian.com',
            // Backup global servers
            'openrelay.metered.ca',
            'global.turn.twilio.com',
            'turn.cloudflare.com'
        ];
    }
    
    async detectServerIP() {
        // Try to get public IP first
        const publicIP = await this.getPublicIP();
        
        const testServers = [
            ...this.globalServers,
            publicIP,
            'localhost'
        ].filter(Boolean);
        
        for (const server of testServers) {
            console.log(`🔍 Testing TURN server: ${server}`);
            if (await this.testTurnServer(server)) {
                this.serverIP = server;
                this.isReady = true;
                console.log(`✅ TURN Server connected: ${server}`);
                return server;
            }
        }
        
        console.log('⚠️ No custom TURN server found, using public servers');
        return null;
    }
    
    async getPublicIP() {
        const ipServices = [
            'https://api.ipify.org?format=json',
            'https://ipapi.co/json/',
            'https://httpbin.org/ip'
        ];
        
        for (const service of ipServices) {
            try {
                const response = await fetch(service);
                const data = await response.json();
                return data.ip || data.origin;
            } catch (error) {
                continue;
            }
        }
        return null;
    }
    
    async testTurnServer(ip) {
        return new Promise((resolve) => {
            const pc = new RTCPeerConnection({
                iceServers: [{
                    urls: `turn:${ip}:3478`,
                    username: 'sufian',
                    credential: 'sufian123'
                }],
                iceCandidatePoolSize: 10
            });
            
            let hasRelay = false;
            const timeout = setTimeout(() => {
                pc.close();
                resolve(hasRelay);
            }, 5000);
            
            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    const candidate = event.candidate.candidate;
                    if (candidate.includes('relay') || candidate.includes('turn')) {
                        hasRelay = true;
                        clearTimeout(timeout);
                        pc.close();
                        resolve(true);
                    }
                }
            };
            
            // Create dummy data channel to trigger ICE
            pc.createDataChannel('test');
            pc.createOffer().then(offer => {
                pc.setLocalDescription(offer);
            }).catch(() => {
                clearTimeout(timeout);
                pc.close();
                resolve(false);
            });
        });
    }
    
    getEnhancedIceServers() {
        const servers = [];
        
        // Add custom TURN server if available
        if (this.isReady && this.serverIP) {
            servers.push({
                urls: [
                    `turn:${this.serverIP}:3478`,
                    `turns:${this.serverIP}:5349`
                ],
                username: 'sufian',
                credential: 'sufian123'
            });
        }
        
        // Global connectivity servers
        servers.push(
            // Multiple STUN servers for better connectivity
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun.cloudflare.com:3478' },
            { urls: 'stun:global.stun.twilio.com:3478' },
            
            // Metered.ca TURN (Free, global)
            {
                urls: [
                    'turn:openrelay.metered.ca:80',
                    'turn:openrelay.metered.ca:443',
                    'turn:openrelay.metered.ca:443?transport=tcp'
                ],
                username: 'openrelayproject',
                credential: 'openrelayproject'
            },
            
            // Twilio global TURN
            {
                urls: 'turn:global.turn.twilio.com:3478?transport=udp',
                username: 'test',
                credential: 'test'
            },
            
            // Backup TURN servers
            {
                urls: 'turn:numb.viagenie.ca:3478',
                username: 'webrtc@live.com',
                credential: 'muazkh'
            }
        );
        
        return servers;
    }
}

// Initialize TURN server manager
const turnManager = new TurnServerManager();

// Auto-detect server on page load with retry
window.addEventListener('load', async () => {
    console.log('🌐 Initializing global connectivity...');
    
    // Try multiple times for better connectivity
    for (let i = 0; i < 3; i++) {
        try {
            await turnManager.detectServerIP();
            if (turnManager.isReady) break;
        } catch (error) {
            console.log(`Attempt ${i + 1} failed, retrying...`);
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log('🚀 Global connectivity ready!');
});

// Export for use in main app
window.getTurnServers = () => turnManager.getEnhancedIceServers();
window.turnManager = turnManager;