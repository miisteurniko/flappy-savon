// ========================================
// Flappy Savon - Game Logic Module
// ========================================

const Game = {
    // Game state
    state: {
        alive: false,
        gameOver: false,
        paused: false,
        score: 0,
        pipes: [],
        t: 0
    },

    // Soap (player) state
    soap: {
        x: CONFIG.soap.startX,
        y: CONFIG.canvas.height * 0.5,
        vx: 0,
        vy: 0,
        w: CONFIG.soap.width,
        h: CONFIG.soap.height,
        rot: 0
    },

    // Theme state
    theme: {
        current: CONFIG.themes[0],
        previous: CONFIG.themes[0],
        transition: 1
    },

    // Initialize game
    init() {
        this.reset();
    },

    // Reset game state
    reset() {
        this.state.pipes = [];
        this.state.t = 0;
        this.state.score = 0;
        this.state.alive = false;
        this.state.gameOver = false;
        this.state.paused = false;

        // Reset soap position
        this.soap.x = CONFIG.soap.startX;
        this.soap.y = CONFIG.canvas.height * 0.5;
        this.soap.vx = 0;
        this.soap.vy = 0;
        this.soap.rot = 0;

        // Initialize pipes
        for (let i = 0; i < 4; i++) {
            this._addPipe(CONFIG.canvas.width + i * CONFIG.pipes.spacing);
        }

        // Reset theme
        this.theme.current = this._getThemeForScore(0);
        this.theme.previous = this.theme.current;
        this.theme.transition = 1;

        // Reset particles
        Particles.reset();

        // Initialize security session
        Security.initSession();
    },

    // Flap action (optimized for performance)
    flap() {
        if (this.state.paused) return;

        if (this.state.gameOver) {
            this.reset();
            return;
        }

        // Core physics only - keep minimal
        this.state.alive = true;
        this.soap.vy = CONFIG.physics.flapForce;

        // Deferred operations (non-blocking)
        requestAnimationFrame(() => {
            Audio.ensureContext();
            Audio.flap();
            Security.recordFlap();

            // Rare bubble (10% chance)
            if (Math.random() < 0.1) {
                Particles.spawnBubble(this.soap.x + 8, this.soap.y);
            }
        });
    },

    // Toggle pause
    togglePause() {
        if (!this.state.alive || this.state.gameOver) return;
        this.state.paused = !this.state.paused;
        return this.state.paused;
    },

    // Update game logic
    update(dt) {
        // Update theme transition
        const nextTheme = this._getThemeForScore(this.state.score);
        if (nextTheme.id !== this.theme.current.id) {
            this.theme.previous = this.theme.current;
            this.theme.current = nextTheme;
            this.theme.transition = 0;
        }
        if (this.theme.transition < 1) {
            this.theme.transition = Math.min(1, this.theme.transition + 0.02 * dt);
        }

        // Update particles (only confetti used now)
        Particles.update(dt, this.state.t, this.theme.current);

        if (this.state.paused || this.state.gameOver) return;

        const W = CONFIG.canvas.width;
        const H = CONFIG.canvas.height;
        const groundY = H - CONFIG.ground.height;

        // Move pipes
        for (const p of this.state.pipes) {
            p.x -= CONFIG.physics.scrollSpeed * dt;
        }

        // Recycle pipes
        if (this.state.pipes.length && this.state.pipes[0].x + CONFIG.pipes.width < 0) {
            this.state.pipes.shift();
            this._addPipe(this.state.pipes[this.state.pipes.length - 1].x + CONFIG.pipes.spacing);
        }

        // Update soap physics
        if (this.state.alive) {
            this.soap.vy += CONFIG.physics.gravity * dt;
            this.soap.y += this.soap.vy * dt;
            this.soap.rot = Math.atan2(this.soap.vy, 8);
        }

        // Ground collision
        if (this.soap.y + this.soap.h / 2 > groundY + 6) {
            this.soap.y = groundY - this.soap.h / 2 + 6;
            return 'dead';
        }

        // Ceiling collision
        if (this.soap.y - this.soap.h / 2 < 0) {
            this.soap.y = this.soap.h / 2;
            this.soap.vy = 0;
        }

        // Pipe collision and scoring
        for (const p of this.state.pipes) {
            if (!p.passed && p.x + CONFIG.pipes.width < this.soap.x) {
                p.passed = true;
                this.state.score++;
                Security.recordPipe(this.state.score);
                Particles.splash(this.soap.x, this.soap.y);
                Particles.adjustForTheme(this.theme.current);
                Audio.score();
                return 'score';
            }

            // Check collision
            if (this._checkPipeCollision(p)) {
                return 'dead';
            }
        }

        this.state.t++;
        return null;
    },

    // Mark game as dead
    die() {
        if (this.state.gameOver) return;
        this.state.gameOver = true;
        this.state.alive = false;
        Audio.hit();
    },

    // Add a new pipe
    _addPipe(x) {
        const margin = 60;
        const H = CONFIG.canvas.height;
        const groundH = CONFIG.ground.height;
        const gap = CONFIG.pipes.gap;

        const maxTop = H - groundH - margin - gap;
        const topH = Math.max(margin, Math.min(maxTop, this._rand(margin, maxTop)));
        const bottomY = topH + gap;

        this.state.pipes.push({ x, topH, bottomY, passed: false });
    },

    // Check collision with pipe
    _checkPipeCollision(p) {
        const padding = 8;
        const sx1 = this.soap.x - this.soap.w / 2 + padding;
        const sx2 = this.soap.x + this.soap.w / 2 - padding;
        const sy1 = this.soap.y - this.soap.h / 2 + 6;
        const sy2 = this.soap.y + this.soap.h / 2 - 6;

        const H = CONFIG.canvas.height;
        const groundH = CONFIG.ground.height;
        const PIPE_W = CONFIG.pipes.width;

        // Top pipe
        const topRect = { x: p.x, y: 0, w: PIPE_W, h: p.topH };
        // Bottom pipe
        const bottomRect = { x: p.x, y: p.bottomY, w: PIPE_W, h: H - groundH - p.bottomY };

        return this._intersectAABB(sx1, sy1, sx2, sy2, topRect.x, topRect.y, topRect.x + topRect.w, topRect.y + topRect.h) ||
            this._intersectAABB(sx1, sy1, sx2, sy2, bottomRect.x, bottomRect.y, bottomRect.x + bottomRect.w, bottomRect.y + bottomRect.h);
    },

    // AABB intersection test
    _intersectAABB(ax1, ay1, ax2, ay2, bx1, by1, bx2, by2) {
        return ax1 < bx2 && ax2 > bx1 && ay1 < by2 && ay2 > by1;
    },

    // Get theme for score
    _getThemeForScore(score) {
        let theme = CONFIG.themes[0];
        for (const th of CONFIG.themes) {
            if (score >= th.from) theme = th;
        }
        return theme;
    },

    // Random number in range
    _rand(a, b) {
        return Math.random() * (b - a) + a;
    },

    // Getters
    getScore() { return this.state.score; },
    isAlive() { return this.state.alive; },
    isGameOver() { return this.state.gameOver; },
    isPaused() { return this.state.paused; },
    getPipes() { return this.state.pipes; },
    getSoap() { return this.soap; },
    getTheme() { return this.theme; }
};
