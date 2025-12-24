// Live Animated Background System
class AnimatedBackground {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.waves = [];
        this.time = 0;
        
        this.init();
        this.createParticles();
        this.animate();
        this.handleResize();
    }
    
    init() {
        this.resize();
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    handleResize() {
        window.addEventListener('resize', () => {
            this.resize();
            this.createParticles();
        });
    }
    
    createParticles() {
        this.particles = [];
        const particleCount = Math.floor((this.canvas.width * this.canvas.height) / 15000);
        
        for (let i = 0; i < particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                radius: Math.random() * 2 + 1,
                opacity: Math.random() * 0.5 + 0.3,
                color: `hsl(${200 + Math.random() * 60}, 70%, 60%)`
            });
        }
    }
    
    drawWaves() {
        // Animated wave lines
        for (let i = 0; i < 3; i++) {
            this.ctx.strokeStyle = `hsla(${200 + i * 30}, 70%, 60%, 0.4)`;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            
            for (let x = 0; x < this.canvas.width; x += 8) {
                const y = this.canvas.height / 2 + 
                         Math.sin((x + this.time) * 0.008 + i) * (40 + i * 20) +
                         Math.sin((x + this.time) * 0.012 + i * 2) * 15;
                x === 0 ? this.ctx.moveTo(x, y) : this.ctx.lineTo(x, y);
            }
            this.ctx.stroke();
        }
    }
    
    drawParticles() {
        this.particles.forEach((particle, index) => {
            // Update position
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            // Bounce off edges
            if (particle.x < 0 || particle.x > this.canvas.width) particle.vx *= -1;
            if (particle.y < 0 || particle.y > this.canvas.height) particle.vy *= -1;
            
            // Draw particle
            this.ctx.fillStyle = particle.color.replace('60%)', `60%, ${particle.opacity})`);
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Draw connections
            this.particles.forEach((otherParticle, otherIndex) => {
                if (index !== otherIndex) {
                    const dx = particle.x - otherParticle.x;
                    const dy = particle.y - otherParticle.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < 100) {
                        this.ctx.strokeStyle = `rgba(59, 130, 246, ${0.2 * (1 - distance / 100)})`;
                        this.ctx.lineWidth = 1;
                        this.ctx.beginPath();
                        this.ctx.moveTo(particle.x, particle.y);
                        this.ctx.lineTo(otherParticle.x, otherParticle.y);
                        this.ctx.stroke();
                    }
                }
            });
        });
    }
    
    drawFloatingElements() {
        // Floating orbs
        const orbCount = 3;
        for (let i = 0; i < orbCount; i++) {
            const x = this.canvas.width * (0.2 + i * 0.3) + Math.sin(this.time * 0.001 + i) * 50;
            const y = this.canvas.height * (0.3 + i * 0.2) + Math.cos(this.time * 0.0015 + i) * 30;
            const radius = 60 + Math.sin(this.time * 0.002 + i) * 20;
            
            const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, radius);
            gradient.addColorStop(0, `hsla(${220 + i * 40}, 70%, 60%, 0.3)`);
            gradient.addColorStop(1, 'transparent');
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(x, y, radius, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    animate() {
        // Clear canvas with gradient background
        const gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
        gradient.addColorStop(0, 'rgba(15, 23, 42, 0.95)');
        gradient.addColorStop(0.5, 'rgba(30, 41, 59, 0.9)');
        gradient.addColorStop(1, 'rgba(15, 23, 42, 0.95)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw all elements
        this.drawWaves();
        this.drawFloatingElements();
        this.drawParticles();
        
        this.time += 2;
        requestAnimationFrame(() => this.animate());
    }
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Initialize main background
    if (document.getElementById('bgCanvas')) {
        new AnimatedBackground('bgCanvas');
    }
    
    // Initialize other page backgrounds
    setTimeout(() => {
        ['loginBgCanvas', 'appBgCanvas', 'privacyBgCanvas', 'termsBgCanvas', 'contactBgCanvas'].forEach(id => {
            if (document.getElementById(id)) {
                new AnimatedBackground(id);
            }
        });
    }, 100);
});

// Export for manual initialization
window.AnimatedBackground = AnimatedBackground;