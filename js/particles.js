// ========================================
// Flappy Savon - Particles System
// ========================================

const Particles = {
    bubbles: [],
    leaves: [],
    confetti: [],
    steam: [],

    // Initialize particles
    init() {
        this.bubbles = [];
        this.leaves = [];
        this.confetti = [];
        this.steam = [];

        // Initial bubbles
        for (let i = 0; i < 10; i++) {
            this.spawnBubble(
                Math.random() * CONFIG.canvas.width,
                Math.random() * CONFIG.canvas.height
            );
        }

        // Initial leaves
        for (let i = 0; i < 6; i++) {
            this.spawnLeaf(CONFIG.canvas.width + Math.random() * CONFIG.canvas.width);
        }
    },

    // Reset particles
    reset() {
        this.init();
    },

    // Spawn a bubble
    spawnBubble(x, y) {
        this.bubbles.push({
            x,
            y,
            r: this._rand(3, 9),
            vy: this._rand(0.6, 1.6),
            alpha: this._rand(0.25, 0.6)
        });
    },

    // Spawn a leaf
    spawnLeaf(x, returning = false) {
        const leaf = {
            x,
            y: this._rand(40, CONFIG.canvas.height - CONFIG.ground.height - 120),
            w: this._rand(8, 14),
            h: this._rand(3, 6),
            vx: this._rand(0.4, 1.1),
            vy: this._rand(-0.2, 0.2),
            rot: this._rand(-0.3, 0.3)
        };

        if (returning) {
            return leaf;
        }
        this.leaves.push(leaf);
        return leaf;
    },

    // Spawn steam particle (for hammam theme)
    spawnSteam() {
        if (this.steam.length >= 14) return;

        this.steam.push({
            x: this._rand(20, CONFIG.canvas.width - 20),
            y: CONFIG.canvas.height - CONFIG.ground.height - this._rand(20, 100),
            r: this._rand(8, 18),
            v: this._rand(0.2, 0.6),
            a: this._rand(0.08, 0.18),
            seed: Math.random()
        });
    },

    // Spawn confetti burst
    spawnConfetti() {
        for (let i = 0; i < 60; i++) {
            this.confetti.push({
                x: CONFIG.canvas.width / 2 + this._rand(-80, 80),
                y: CONFIG.canvas.height * 0.3 + this._rand(-20, 20),
                vx: this._rand(-1, 1),
                vy: this._rand(-2, -0.5),
                life: this._rand(18, 30),
                r: this._rand(0, 6),
                col: `hsl(${Math.floor(this._rand(0, 360))}, 80%, 60%)`
            });
        }
    },

    // Create splash effect at position
    splash(x, y) {
        for (let i = 0; i < 5; i++) {
            this.spawnBubble(
                x + this._rand(-10, 10),
                y + this._rand(-8, 8)
            );
        }
    },

    // Update all particles
    update(dt, t, currentTheme) {
        const W = CONFIG.canvas.width;
        const H = CONFIG.canvas.height;
        const groundY = H - CONFIG.ground.height;

        // Update bubbles
        // Update bubbles (iterate backwards to allow removal)
        for (let i = this.bubbles.length - 1; i >= 0; i--) {
            const b = this.bubbles[i];
            b.y -= b.vy * dt;
            b.x += Math.sin((b.y + b.r) * 0.02) * 0.2;
            b.alpha -= 0.0008 * dt;

            // Remove dead bubbles
            if (b.y < -20 || b.alpha <= 0) {
                this.bubbles.splice(i, 1);
            }
        }

        // Maintain ambient bubbles (ensure at least 10 exist)
        if (this.bubbles.length < 10) {
            if (Math.random() < 0.05) { // Small chance per frame to respawn
                this.spawnBubble(
                    this._rand(0, W),
                    groundY + 20 // Start just below ground or at bottom
                );
            }
        }

        // Update leaves
        for (const f of this.leaves) {
            f.x -= f.vx * dt;
            f.y += f.vy * dt;
            f.rot += 0.01 * dt;

            if (f.x < -50) {
                Object.assign(f, this.spawnLeaf(W + this._rand(0, 200), true));
            }
        }

        // Update steam (only in fog theme)
        if (currentTheme.fog) {
            this.spawnSteam();
            for (let i = this.steam.length - 1; i >= 0; i--) {
                const s = this.steam[i];
                s.y -= s.v * dt;
                s.x += Math.sin((t + s.seed) * 0.05) * 0.2;
                s.a -= 0.0015 * dt;

                if (s.a <= 0 || s.y < -30) {
                    this.steam.splice(i, 1);
                }
            }
        } else {
            this.steam.length = 0;
        }

        // Update confetti
        for (let i = this.confetti.length - 1; i >= 0; i--) {
            const c = this.confetti[i];
            c.x += c.vx * dt;
            c.y += c.vy * dt;
            c.vy += 0.05 * dt;
            c.life -= dt;

            if (c.life <= 0) {
                this.confetti.splice(i, 1);
            }
        }
    },

    // Adjust particle density for theme
    adjustForTheme(theme) {
        const targetLeaves = theme.leaves;

        while (this.leaves.length < targetLeaves) {
            this.spawnLeaf(CONFIG.canvas.width + this._rand(0, 200));
        }
        while (this.leaves.length > targetLeaves) {
            this.leaves.pop();
        }

        if (Math.random() < 0.3 * theme.bubbleMul) {
            this.spawnBubble(
                this._rand(0, CONFIG.canvas.width),
                CONFIG.canvas.height - CONFIG.ground.height - this._rand(10, 90)
            );
        }
    },

    // Helper: random number in range
    _rand(a, b) {
        return Math.random() * (b - a) + a;
    }
};
