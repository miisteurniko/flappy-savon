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
        this._ctx = canvas.getContext('2d');

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

    // Draw background with theme transition
    drawBackground(prevTheme, currentTheme, themeTrans) {
        const cx = this._ctx;
        const W = CONFIG.canvas.width;
        const H = CONFIG.canvas.height;

        // Mix colors for transition
        const bg1 = this._mixColor(prevTheme.bg1, currentTheme.bg1, themeTrans);
        const bg2 = this._mixColor(prevTheme.bg2, currentTheme.bg2, themeTrans);

        // Gradient background
        const g = cx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, bg1);
        g.addColorStop(1, bg2);
        cx.fillStyle = g;
        cx.fillRect(0, 0, W, H);
    },

    // Draw foam ground
    drawFoamGround(themeId) {
        const cx = this._ctx;
        const W = CONFIG.canvas.width;
        const H = CONFIG.canvas.height;
        const y0 = H - CONFIG.ground.height + 8;

        for (let i = 0; i < 3; i++) {
            const amp = 8 + i * 4;
            const h = 26 - i * 6;
            const off = (this._t * 0.8 + i * 30) % W;

            let col = i === 0 ? 'rgba(232,245,255,0.9)' :
                i === 1 ? 'rgba(207,232,255,0.8)' :
                    'rgba(207,232,255,0.6)';

            if (themeId === 'atelier') {
                col = col.replace('255', '245');
            }

            cx.fillStyle = col;
            cx.beginPath();
            cx.moveTo(0, y0 + h);

            for (let x = 0; x <= W; x += 8) {
                const y = y0 + Math.sin((x + off) / 40) * amp;
                cx.lineTo(x, y);
            }

            cx.lineTo(W, H);
            cx.lineTo(0, H);
            cx.closePath();
            cx.fill();
        }
    },

    // Draw pipes
    drawPipes(pipes) {
        const cx = this._ctx;
        const H = CONFIG.canvas.height;
        const PIPE_W = CONFIG.pipes.width;
        const groundH = CONFIG.ground.height;

        for (const p of pipes) {
            if (this._obstacleImg && this._obstacleImg.complete) {
                const topH = Math.max(20, p.topH);
                cx.drawImage(this._obstacleImg, p.x, 0, PIPE_W, topH);

                const bottomH = Math.max(20, H - groundH - p.bottomY);
                cx.drawImage(this._obstacleImg, p.x, p.bottomY, PIPE_W, bottomH);
            } else {
                // Kraft paper style
                const g1 = cx.createLinearGradient(0, 0, 0, H);
                g1.addColorStop(0, '#d5b48a');
                g1.addColorStop(1, '#b78b5f');
                cx.fillStyle = g1;

                this._roundRect(p.x, 0, PIPE_W, p.topH, 12, true);
                this._roundRect(p.x, p.bottomY, PIPE_W, H - groundH - p.bottomY, 12, true);

                // Caps
                cx.fillStyle = '#9e7a52';
                cx.fillRect(p.x, p.topH - 8, PIPE_W, 8);
                cx.fillRect(p.x, p.bottomY, PIPE_W, 8);

                // Highlights
                cx.fillStyle = '#ffffff3a';
                cx.fillRect(p.x + 8, Math.max(8, p.topH * 0.35), PIPE_W - 16, 12);
                cx.fillRect(p.x + 8, p.bottomY + (H - groundH - p.bottomY) * 0.2, PIPE_W - 16, 12);
            }
        }
    },

    // Draw soap (player)
    drawSoap(x, y, w, h, rot, skinId) {
        const cx = this._ctx;
        const skin = CONFIG.skins.find(s => s.id === skinId) || CONFIG.skins[0];

        cx.save();
        cx.translate(x, y);
        cx.rotate(rot);

        const r = 12;
        const g = cx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
        g.addColorStop(0, skin.c1);
        g.addColorStop(1, skin.c2);
        cx.fillStyle = g;
        this._roundRect(-w / 2, -h / 2, w, h, r, true);

        // Highlight
        cx.globalAlpha = 0.6;
        cx.fillStyle = '#ffffff';
        this._roundRect(-w / 2 + 6, -h / 2 + 6, w - 12, 8, 6, true);

        // Text
        cx.globalAlpha = 1;
        cx.fillStyle = '#0e1116';
        cx.font = '800 8px "Spinnaker", sans-serif';
        cx.textAlign = 'center';
        cx.textBaseline = 'middle';
        cx.fillText('SAVON YVARD', 0, 2);

        cx.restore();
    },

    // Draw bubbles
    drawBubbles(bubbles) {
        const cx = this._ctx;
        cx.save();

        for (const b of bubbles) {
            cx.globalAlpha = b.alpha;
            const grad = cx.createRadialGradient(b.x - 2, b.y - 2, 1, b.x, b.y, b.r);
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(0.2, '#ffffffaa');
            grad.addColorStop(1, '#a9d4ff10');
            cx.fillStyle = grad;
            cx.beginPath();
            cx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
            cx.fill();
        }

        cx.globalAlpha = 1;
        cx.restore();
    },

    // Draw leaves
    drawLeaves(leaves, themeId) {
        const cx = this._ctx;
        cx.save();

        for (const f of leaves) {
            cx.translate(f.x, f.y);
            cx.rotate(f.rot);
            cx.fillStyle = themeId === 'atelier' ? '#7ecb80' : '#6fbf73';
            cx.beginPath();
            cx.ellipse(0, 0, f.w, f.h, 0, 0, Math.PI * 2);
            cx.fill();
            cx.setTransform(1, 0, 0, 1, 0, 0);
        }

        cx.restore();
    },

    // Draw steam particles
    drawSteam(steam, hasFog) {
        if (!hasFog) return;

        const cx = this._ctx;
        cx.save();

        for (const s of steam) {
            cx.globalAlpha = s.a;
            const grad = cx.createRadialGradient(s.x, s.y, 1, s.x, s.y, s.r);
            grad.addColorStop(0, '#ffffffaa');
            grad.addColorStop(1, '#ffffff00');
            cx.fillStyle = grad;
            cx.beginPath();
            cx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            cx.fill();
        }

        cx.globalAlpha = 1;
        cx.restore();
    },

    // Draw confetti
    drawConfetti(confetti) {
        const cx = this._ctx;

        for (const c of confetti) {
            cx.save();
            cx.translate(c.x, c.y);
            cx.rotate(c.r);
            cx.fillStyle = c.col;
            cx.fillRect(-2, -2, 4, 4);
            cx.restore();
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
