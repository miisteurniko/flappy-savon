// ========================================
// Flappy Savon - Renderer Module
// ========================================

const Renderer = {
    _ctx: null,
    _obstacleImg: null,
    _gridOffset: 0,
    _t: 0,

    // Initialize renderer
    init(canvas) {
        this._ctx = canvas.getContext('2d', { alpha: false });

        // Disable smoothing for crisper rendering
        this._ctx.imageSmoothingEnabled = false;

        // Load obstacle image if configured
        if (CONFIG.images.obstacle) {
            this._obstacleImg = new Image();
            this._obstacleImg.src = CONFIG.images.obstacle;
        }
    },

    // Update animation time
    tick(dt) {
        this._t++;
        this._gridOffset += 0.15 * dt;
        if (this._gridOffset > 32) this._gridOffset -= 32;
    },

    // Clear canvas
    clear() {
        this._ctx.clearRect(0, 0, CONFIG.canvas.width, CONFIG.canvas.height);
    },

    // Draw background (optimized - no gradient loop)
    drawBackground(prevTheme, currentTheme, themeTrans) {
        const cx = this._ctx;
        const W = CONFIG.canvas.width;
        const H = CONFIG.canvas.height;

        // Draw current theme background solid
        cx.fillStyle = currentTheme.bg1;
        cx.fillRect(0, 0, W, H);

        // Transition overlay (if needed)
        if (themeTrans < 1) {
            cx.globalAlpha = 1 - themeTrans;
            cx.fillStyle = prevTheme.bg1;
            cx.fillRect(0, 0, W, H);
            cx.globalAlpha = 1;
        }
    },

    // Draw ground (static - no animation for performance)
    drawFoamGround() {
        const cx = this._ctx;
        const W = CONFIG.canvas.width;
        const H = CONFIG.canvas.height;
        const groundY = H - CONFIG.ground.height;

        // Solid ground
        cx.fillStyle = '#c8e0f0';
        cx.fillRect(0, groundY, W, CONFIG.ground.height);

        // Simple wave top (static)
        cx.fillStyle = '#dbeef8';
        cx.fillRect(0, groundY, W, 12);
    },

    // Draw pipes
    drawPipes(pipes) {
        const cx = this._ctx;
        const H = CONFIG.canvas.height;
        const PIPE_W = CONFIG.pipes.width;
        const groundH = CONFIG.ground.height;

        for (const p of pipes) {
            // Round to integer pixels to prevent sub-pixel flickering
            const px = Math.round(p.x);
            const topH = Math.round(p.topH);
            const bottomY = Math.round(p.bottomY);

            if (this._obstacleImg && this._obstacleImg.complete) {
                const th = Math.max(20, topH);
                cx.drawImage(this._obstacleImg, px, 0, PIPE_W, th);

                const bottomH = Math.max(20, H - groundH - bottomY);
                cx.drawImage(this._obstacleImg, px, bottomY, PIPE_W, bottomH);
            } else {
                // Kraft paper style (solid color)
                cx.fillStyle = '#c6a076';

                this._roundRect(px, 0, PIPE_W, topH, 12, true);
                this._roundRect(px, bottomY, PIPE_W, H - groundH - bottomY, 12, true);

                // Caps
                cx.fillStyle = '#9e7a52';
                cx.fillRect(px, topH - 8, PIPE_W, 8);
                cx.fillRect(px, bottomY, PIPE_W, 8);

                // Highlights
                cx.fillStyle = '#ffffff3a';
                cx.fillRect(px + 8, Math.max(8, topH * 0.35), PIPE_W - 16, 12);
                cx.fillRect(px + 8, bottomY + (H - groundH - bottomY) * 0.2, PIPE_W - 16, 12);
            }
        }
    },

    // Draw soap (player)
    drawSoap(x, y, w, h, rot, skinId) {
        const cx = this._ctx;
        const skin = CONFIG.skins.find(s => s.id === skinId) || CONFIG.skins[0];

        cx.save();
        cx.translate(Math.round(x), Math.round(y));
        cx.rotate(rot);

        // 1. Drop shadow (soft, reduced)
        cx.shadowColor = 'rgba(0,0,0,0.08)'; // Was 0.15
        cx.shadowBlur = 6;                   // Was 10
        cx.shadowOffsetY = 2;                // Was 4

        // 2. Body Gradient (simulating 3D volume)
        // Light comes from top-left
        const grad = cx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
        grad.addColorStop(0, skin.c1); // Light color top-left
        grad.addColorStop(1, skin.c2); // Dark color bottom-right
        cx.fillStyle = grad;

        this._roundRect(-w / 2, -h / 2, w, h, 14, true);

        // Reset shadow for internal details
        cx.shadowColor = 'transparent';
        cx.shadowBlur = 0;
        cx.shadowOffsetY = 0;

        // 3. Highlight (Glossy / Wet look)
        // Subtler, top-left curve
        cx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this._roundRect(-w / 2 + 4, -h / 2 + 4, w - 8, h * 0.4, 6, true);

        // 4. Engraved Text Effect ("SAVON YVARD")
        cx.font = '800 8px Spinnaker, sans-serif';
        cx.textAlign = 'center';
        cx.textBaseline = 'middle';

        // Engraving highlight (bottom-right)
        cx.fillStyle = 'rgba(255,255,255,0.4)';
        cx.fillText('SAVON YVARD', 0.5, 2.5);

        // Engraving shadow (top-left)
        cx.fillStyle = 'rgba(0,0,0,0.2)';
        cx.fillText('SAVON YVARD', -0.5, 1.5);

        // Main text color
        cx.fillStyle = '#2c2420'; // Dark ink
        cx.fillText('SAVON YVARD', 0, 2);

        cx.restore();
    },

    // Draw bubbles (simplified for performance)
    drawBubbles(bubbles) {
        const cx = this._ctx;

        for (const b of bubbles) {
            if (!b.active) continue; // Skip inactive particles

            cx.globalAlpha = b.alpha;
            cx.fillStyle = '#e0f0ff';
            cx.beginPath();
            cx.arc(Math.round(b.x), Math.round(b.y), b.r, 0, Math.PI * 2);
            cx.fill();

            // Simple highlight
            cx.fillStyle = '#ffffff';
            cx.beginPath();
            cx.arc(Math.round(b.x) - 2, Math.round(b.y) - 2, b.r * 0.3, 0, Math.PI * 2);
            cx.fill();
        }
        cx.globalAlpha = 1;
    },

    // Draw confetti (new record only)
    drawConfetti(confetti) {
        const cx = this._ctx;

        for (const c of confetti) {
            if (!c.active) continue; // Skip inactive particles

            cx.fillStyle = c.col;
            cx.beginPath();
            cx.arc(Math.round(c.x), Math.round(c.y), c.r, 0, Math.PI * 2);
            cx.fill();
        }
    },

    // Draw "tap to start" message
    drawTapToStart() {
        const cx = this._ctx;
        const W = CONFIG.canvas.width;
        const H = CONFIG.canvas.height;

        cx.save();
        cx.fillStyle = '#1a1a1a'; // Dark ink for visibility
        cx.font = '800 24px "Spinnaker", sans-serif';
        cx.textAlign = 'center';
        cx.fillText('Appuie pour jouer', W / 2, H * 0.35);
        cx.font = '14px "Spinnaker", sans-serif';
        cx.fillText('Espace / clic = saut', W / 2, H * 0.35 + 26);
        cx.restore();
    },

    // Draw game over screen
    drawGameOver() {
        const cx = this._ctx;
        const W = CONFIG.canvas.width;
        const H = CONFIG.canvas.height;

        cx.save();
        cx.fillStyle = '#000000aa';
        cx.fillRect(0, 0, W, H);
        cx.fillStyle = '#fff';
        cx.textAlign = 'center';
        cx.font = '800 36px "Spinnaker", sans-serif';
        cx.fillText('Perdu !', W / 2, H / 2 - 30);
        cx.font = '16px "Spinnaker", sans-serif';
        cx.fillText('Cliquer ou espace pour rejouer', W / 2, H / 2 + 6);
        cx.restore();
    },

    // Draw pause overlay
    drawPaused() {
        const cx = this._ctx;
        const W = CONFIG.canvas.width;
        const H = CONFIG.canvas.height;

        cx.save();
        cx.fillStyle = '#00000088';
        cx.fillRect(0, 0, W, H);
        cx.fillStyle = '#fff';
        cx.textAlign = 'center';
        cx.font = '800 32px "Spinnaker", sans-serif';
        cx.fillText('⏸ PAUSE', W / 2, H / 2 - 20);
        cx.font = '14px "Spinnaker", sans-serif';
        cx.fillText('Appuie sur P pour reprendre', W / 2, H / 2 + 20);
        cx.restore();
    },

    // Helper: rounded rectangle
    _roundRect(x, y, w, h, r, fill) {
        const cx = this._ctx;
        cx.beginPath();
        cx.moveTo(x + r, y);
        cx.arcTo(x + w, y, x + w, y + h, r);
        cx.arcTo(x + w, y + h, x, y + h, r);
        cx.arcTo(x, y + h, x, y, r);
        cx.arcTo(x, y, x + w, y, r);
        if (fill) cx.fill();
        else cx.stroke();
    },

    // Helper: mix two hex colors
    _mixColor(hex1, hex2, k) {
        const c2rgb = c => {
            const m = c.match(/#([0-9a-f]{6})/i);
            if (!m) return [15, 26, 38];
            const n = parseInt(m[1], 16);
            return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
        };

        const a = c2rgb(hex1);
        const b = c2rgb(hex2);

        return `rgba(${Math.round(a[0] * (1 - k) + b[0] * k)},${Math.round(a[1] * (1 - k) + b[1] * k)},${Math.round(a[2] * (1 - k) + b[2] * k)},1)`;
    }
};
