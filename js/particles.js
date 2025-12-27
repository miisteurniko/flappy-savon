// ========================================
// Flappy Savon - Particles System
// ========================================

const Particles = {
    // Fixed pools (Zero GC)
    bubbles: new Array(20).fill(null).map(() => ({
        active: false, x: 0, y: 0, r: 0, vy: 0, alpha: 0
    })),
    confetti: new Array(50).fill(null).map(() => ({
        active: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, r: 0, col: ''
    })),

    // Initialize/Reset
    init() {
        // Deactivate all
        for (const b of this.bubbles) b.active = false;
        for (const c of this.confetti) c.active = false;
    },

    reset() {
        this.init();
    },

    // Spawn a bubble (reuse inactive)
    spawnBubble(x, y) {
        // Find first inactive bubble
        const b = this.bubbles.find(p => !p.active);
        if (!b) return; // Pool full, skip spawn (better than GC)

        b.active = true;
        b.x = x;
        b.y = y;
        b.r = this._rand(3, 9);
        b.vy = this._rand(0.6, 1.6);
        b.alpha = this._rand(0.25, 0.6);
    },

    // Spawn confetti burst (reuse inactive)
    spawnConfetti() {
        let spawned = 0;
        const count = 10;

        for (const c of this.confetti) {
            if (spawned >= count) break;
            if (c.active) continue;

            c.active = true;
            c.x = CONFIG.canvas.width / 2 + this._rand(-60, 60);
            c.y = CONFIG.canvas.height * 0.3;
            c.vx = this._rand(-0.8, 0.8);
            c.vy = this._rand(-1.5, -0.3);
            c.life = this._rand(15, 25);
            c.r = this._rand(0, 5);
            c.col = `hsl(${Math.floor(this._rand(0, 360))}, 70%, 55%)`;

            spawned++;
        }
    },

    // Update all particles (No GC)
    update(dt) {
        // Update bubbles
        for (const b of this.bubbles) {
            if (!b.active) continue;

            b.y -= b.vy * dt;
            b.alpha -= 0.002 * dt;

            if (b.y < -20 || b.alpha <= 0) {
                b.active = false; // "Remove" by deactivating
            }
        }

        // Update confetti
        for (const c of this.confetti) {
            if (!c.active) continue;

            c.x += c.vx * dt;
            c.y += c.vy * dt;
            c.vy += 0.05 * dt;
            c.life -= dt;

            if (c.life <= 0) {
                c.active = false; // "Remove" by deactivating
            }
        }
    },

    // Helper: random number in range
    _rand(a, b) {
        return Math.random() * (b - a) + a;
    }
};
