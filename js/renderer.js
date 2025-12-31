// ========================================
// Flappy Savon - Renderer Module
// ========================================

const Renderer = {
    _ctx: null,
    _obstacleImg: null,
    _stars: [],
    _clouds: [],
    _hills: [],
    _hillRightEdge: 0,
    _critters: [],
    _isNight: false,
    _shake: 0,

    // Initialize renderer
    init(canvas) {
        this._ctx = canvas.getContext('2d', { alpha: false });
        this._ctx.imageSmoothingEnabled = false;

        // Load obstacle image if configured
        if (CONFIG.images.obstacle) {
            this._obstacleImg = new Image();
            this._obstacleImg.src = CONFIG.images.obstacle;
        }

        // Initialize Decor (Stars & Clouds)
        this._initDecor();

        // Initial day/night check
        this._checkDayNight();
    },

    _initDecor() {
        const W = CONFIG.canvas.width;
        const H = CONFIG.canvas.height;

        // 1. Stars (Static positions)
        for (let i = 0; i < 60; i++) {
            this._stars.push({
                x: Math.random() * W,
                y: Math.random() * (H * 0.6), // Top 60%
                r: Math.random() * 1.5 + 0.5,
                alpha: Math.random(),
                speed: Math.random() * 0.05 + 0.02
            });
        }

        // 2. Clouds (Procedural)
        for (let i = 0; i < 6; i++) {
            this._clouds.push({
                x: Math.random() * W,
                y: Math.random() * (H * 0.4),
                w: 60 + Math.random() * 80,
                h: 20 + Math.random() * 20,
                speed: 10 + Math.random() * 15 // Very slow parallax
            });
        }

        // 3. Hills (Permanent background)
        // Generate a smooth curve with mapped points
        let hx = 0;
        while (hx < W + 100) {
            this._hills.push({
                x: hx,
                y: Math.sin(hx * 0.01) * 20 + Math.sin(hx * 0.03) * 15
            });
            hx += 10;
        }
        // Track right edge for wrapping
        this._hillRightEdge = hx;

        // 4. Critters Pool (Pre-allocated, Zero GC)
        for (let i = 0; i < 10; i++) {
            this._critters.push({
                active: false,
                type: 'bird',
                x: 0, y: 0, vx: 0, flap: 0, t: 0
            });
        }
    },

    _checkDayNight() {
        // Approximate France (Lat 47) Sun Cycle
        const now = new Date();
        const month = now.getMonth(); // 0-11
        const hour = now.getHours();

        // Simple lookup for sunrise/sunset hour in France (approximate)
        // J F M A M J J A S O N D
        const sunrise = [8, 8, 7, 7, 6, 6, 6, 7, 7, 8, 8, 8];
        const sunset = [17, 18, 19, 21, 21, 22, 22, 21, 20, 19, 17, 17];

        // Is it night?
        if (hour < sunrise[month] || hour >= sunset[month]) {
            this._isNight = true;
        } else {
            this._isNight = false;
        }
    },

    // Trigger screen shake
    shake(intensity) {
        this._shake = intensity;
    },

    // Update animation time
    tick(dt) {
        // Smooth decor update: Clamp dt to max 1.5 to prevent visual bumps on input
        const smoothDt = Math.min(dt, 1.5);

        this._t++;
        this._gridOffset += 0.15 * smoothDt;
        if (this._gridOffset > 32) this._gridOffset -= 32;

        // Decay shake
        if (this._shake > 0.5) {
            this._shake *= 0.9;
        } else {
            this._shake = 0;
        }

        // Check Day/Night every ~10 seconds (600 frames)
        if (this._t % 600 === 0) this._checkDayNight();

        // Animate Decor
        if (this._isNight) {
            // Twinkle stars
            for (const s of this._stars) {
                s.alpha += s.speed * (Math.random() < 0.5 ? 1 : -1);
                if (s.alpha < 0.2) s.alpha = 0.2;
                if (s.alpha > 0.8) s.alpha = 0.8;
            }
        } else {
            // Move clouds (parallax)
            // Move at 10% of game speed for depth
            const cloudSpeed = CONFIG.physics.scrollSpeed * 0.1 * smoothDt;
            for (const c of this._clouds) {
                c.x -= cloudSpeed;
                if (c.x + c.w < 0) {
                    c.x = CONFIG.canvas.width + 50;
                    c.y = Math.random() * (CONFIG.canvas.height * 0.4);
                }
            }
        }


        // 2. Animate Hills (Parallax - very slow)
        // Use direct index manipulation instead of shift/push for O(1) performance
        const hillSpeed = CONFIG.physics.scrollSpeed * 0.05 * smoothDt;
        const hillCount = this._hills.length;

        if (hillCount > 0) {
            // Move all hills
            for (let i = 0; i < hillCount; i++) {
                this._hills[i].x -= hillSpeed;
            }

            // Recycle hills that went off-screen (reposition to end)
            // Only process the first hill (the leftmost one)
            const first = this._hills[0];
            if (first.x < -10) {
                const last = this._hills[hillCount - 1];
                const newX = last.x + 10;
                first.x = newX;
                first.y = Math.sin(newX * 0.01) * 20 + Math.sin(newX * 0.03) * 15;
                // Move to end using splice (once per recycled hill, not per frame)
                this._hills.push(this._hills.shift());
            }
        }

        // 3. Animate/Spawn Critters
        this._manageCritters(dt);
    },

    _manageCritters(dt) {
        const W = CONFIG.canvas.width;
        const H = CONFIG.canvas.height;
        const speed = CONFIG.physics.scrollSpeed * dt;

        // Count active critters
        let activeCount = 0;
        for (const c of this._critters) {
            if (c.active) activeCount++;
        }

        // Spawn logic (rare) - reuse inactive slot
        if (activeCount < 5 && Math.random() < 0.005) {
            // Find inactive critter
            for (const c of this._critters) {
                if (c.active) continue;

                // Reuse this slot
                c.active = true;
                c.x = W + 20;

                if (this._isNight) {
                    c.type = 'firefly';
                    c.y = H * 0.5 + (Math.random() * 200 - 100);
                    c.vx = -(Math.random() * 0.5 + 0.5) * speed;
                    c.t = Math.random() * 100;
                    c.flap = 0;
                } else {
                    c.type = 'bird';
                    c.y = H * 0.2 + Math.random() * 200;
                    c.vx = -(Math.random() * 1 + 1) * speed;
                    c.flap = 0;
                    c.t = 0;
                }
                break;
            }
        }

        // Move & deactivate (no splice)
        for (const c of this._critters) {
            if (!c.active) continue;

            c.x += c.vx;

            if (c.type === 'firefly') {
                c.t += 0.1 * dt;
                c.y += Math.sin(c.t) * 0.5 * dt;
            } else if (c.type === 'bird') {
                c.flap += 0.2 * dt;
            }

            if (c.x < -20) c.active = false; // Deactivate instead of splice
        }
    },

    // Clear canvas
    clear() {
        this._ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
        this._ctx.clearRect(0, 0, CONFIG.canvas.width, CONFIG.canvas.height);

        // Apply shake if active
        if (this._shake > 0) {
            const dx = (Math.random() - 0.5) * this._shake;
            const dy = (Math.random() - 0.5) * this._shake;
            this._ctx.translate(dx, dy);
        }
    },

    // Draw background (optimized - no gradient loop)
    drawBackground(prevTheme, currentTheme, themeTrans) {
        const cx = this._ctx;
        const W = CONFIG.canvas.width;
        const H = CONFIG.canvas.height;

        // Draw current theme background solid
        cx.fillStyle = currentTheme.bg1;
        cx.fillRect(0, 0, W, H);

        // Night overlay (darken when it's real-world night time)
        if (this._isNight) {
            cx.fillStyle = 'rgba(10, 15, 30, 0.25)';
            cx.fillRect(0, 0, W, H);
        }

        // Decor (Stars/Clouds/Hills/Critters) BEHIND the transition fade logic
        this._drawDecor(cx, W, H, currentTheme);

        // Transition overlay (if needed)
        if (themeTrans < 1) {
            cx.globalAlpha = 1 - themeTrans;
            cx.fillStyle = prevTheme.bg1;
            cx.fillRect(0, 0, W, H);

            // Note: We don't draw prev theme decor to avoid visual clutter during fade
            // The new theme's decor (already drawn) will just fade in slightly obscured by the prev color layer

            cx.globalAlpha = 1;
        }
    },

    _drawDecor(cx, W, H, theme) {
        // 1. Hills (Furthest)
        cx.fillStyle = this._mixColor(theme.bg1, '#000000', 0.05); // 5% darker than bg
        cx.beginPath();
        cx.moveTo(0, H); // Start bottom-left

        // Ensure we start from the left edge
        if (this._hills.length > 0) {
            // Draw from x=0 with the first hill's Y value
            const firstHill = this._hills[0];
            cx.lineTo(0, H - CONFIG.ground.height - 50 + firstHill.y);
        }

        // Draw all hill points
        for (const p of this._hills) {
            cx.lineTo(p.x, H - CONFIG.ground.height - 50 + p.y);
        }

        // Ensure we end at the right edge
        if (this._hills.length > 0) {
            const lastHill = this._hills[this._hills.length - 1];
            cx.lineTo(W, H - CONFIG.ground.height - 50 + lastHill.y);
        }

        cx.lineTo(W, H); // Bottom-right
        cx.closePath();
        cx.fill();

        // 2. Stars / Clouds
        if (this._isNight) {
            cx.fillStyle = '#ffffff';
            for (const s of this._stars) {
                cx.globalAlpha = s.alpha;
                cx.beginPath();
                cx.arc(Math.round(s.x), Math.round(s.y), s.r, 0, Math.PI * 2);
                cx.fill();
            }
            cx.globalAlpha = 1;
        } else {
            cx.fillStyle = 'rgba(255, 255, 255, 0.4)'; // Soft white clouds
            for (const c of this._clouds) {
                this._roundRect(Math.round(c.x), Math.round(c.y), c.w, c.h, c.h / 2, true);
            }
        }

        // 3. Critters
        for (const c of this._critters) {
            if (c.type === 'firefly') {
                cx.fillStyle = '#ffffaa';
                cx.shadowColor = '#ffffaa';
                cx.shadowBlur = 6;
                cx.beginPath();
                cx.arc(c.x, c.y, 2, 0, Math.PI * 2);
                cx.fill();
                cx.shadowBlur = 0;
            } else if (c.type === 'bird') {
                cx.fillStyle = 'rgba(0,0,0,0.2)'; // Dark silhouette
                cx.beginPath();
                const wingY = Math.sin(c.flap) * 3;
                cx.moveTo(c.x, c.y);
                cx.lineTo(c.x + 5, c.y - wingY);
                cx.lineTo(c.x + 10, c.y);
                cx.fill();
            }
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

    // Draw soap (player) - ENHANCED but OPTIMIZED
    drawSoap(x, y, w, h, rot, skinId) {
        const cx = this._ctx;

        // Cache skin and gradient lookup (avoid recreation every frame)
        if (this._cachedSkinId !== skinId) {
            this._cachedSkin = CONFIG.skins.find(s => s.id === skinId) || CONFIG.skins[0];
            this._cachedSkinId = skinId;
            // Pre-create gradient for this skin
            const grad = cx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
            grad.addColorStop(0, this._cachedSkin.c1);
            grad.addColorStop(1, this._cachedSkin.c2);
            this._cachedGradient = grad;
        }
        const skin = this._cachedSkin;

        cx.save();
        cx.translate(Math.round(x), Math.round(y));
        cx.rotate(rot);

        // Border for depth (skin-based color)
        cx.strokeStyle = skin.c2;
        cx.lineWidth = 1.5;
        this._roundRect(-w / 2, -h / 2, w, h, 10, false, true);

        // Body with cached gradient
        cx.fillStyle = this._cachedGradient;
        this._roundRect(-w / 2, -h / 2, w, h, 10, true);

        // Top highlight (wet/glossy look) - smaller
        cx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        this._roundRect(-w / 2 + 6, -h / 2 + 4, w - 12, h * 0.22, 4, true);


        // Text with slight shadow
        cx.font = '700 6px Spinnaker, sans-serif';
        cx.textAlign = 'center';
        cx.textBaseline = 'middle';
        cx.fillStyle = 'rgba(0,0,0,0.1)';
        cx.fillText('SAVON YVARD', 0.5, 1.5);
        cx.fillStyle = skin.c2;
        cx.fillText('SAVON YVARD', 0, 1);

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
        cx.fillText('Appuie pour sauter', W / 2, H * 0.35 + 26);
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
    _roundRect(x, y, w, h, r, fill, stroke) {
        const cx = this._ctx;
        cx.beginPath();
        cx.moveTo(x + r, y);
        cx.arcTo(x + w, y, x + w, y + h, r);
        cx.arcTo(x + w, y + h, x, y + h, r);
        cx.arcTo(x, y + h, x, y, r);
        cx.arcTo(x, y, x + w, y, r);
        cx.closePath();
        if (fill) cx.fill();
        if (stroke) cx.stroke();
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
