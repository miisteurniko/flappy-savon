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

        // 4. Animate Skin Decor
        this._animateSkinDecor(smoothDt);
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
                    c.vx = -(Math.random() * 1 + 1) * speed; // Fix duplicate
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

        // Draw Cached/Simple Background (Gradient instead of tiles)
        this._drawSimpleBackground(cx, W, H, currentTheme);

        // Night overlay (darken when it's real-world night time)
        if (this._isNight) {
            cx.fillStyle = 'rgba(10, 15, 30, 0.25)';
            cx.fillRect(0, 0, W, H);
        }

        // Decor (Stars/Clouds/Hills/Critters) BEHIND the transition fade logic
        this._drawDecor(cx, W, H, currentTheme);

        // Skin Specific Decor (Flowers etc)
        this._drawSkinDecor(cx, W, H);

        // Transition overlay (if needed)
        if (themeTrans < 1) {
            cx.globalAlpha = 1 - themeTrans;
            this._drawSimpleBackground(cx, W, H, prevTheme);
            cx.globalAlpha = 1;

            // Note: We don't draw prev theme decor to avoid visual clutter during fade
            // The new theme's decor (already drawn) will just fade in slightly obscured by the prev color layer

            cx.globalAlpha = 1;
        }
    },

    _drawSimpleBackground(cx, W, H, theme) {
        // Optimized: Vertical Gradient instead of 600+ tile rects
        // Reuse canvas gradient if possible? For now, creation is cheap enough vs rects
        const grad = cx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, theme.bg1);
        grad.addColorStop(1, theme.bg2);

        cx.fillStyle = grad;
        cx.fillRect(0, 0, W, H);
    },

    _drawDecor(cx, W, H, theme) {
        // 1. Hills (Furthest) - Use cached color
        if (this._cachedHillBg !== theme.bg1) {
            this._cachedHillBg = theme.bg1;
            this._cachedHillStyle = this._mixColor(theme.bg1, '#000000', 0.05);
        }
        cx.fillStyle = this._cachedHillStyle;
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
                // Outer glow (cheaper than shadowBlur)
                cx.fillStyle = 'rgba(255, 255, 170, 0.3)';
                cx.beginPath();
                cx.arc(c.x, c.y, 6, 0, Math.PI * 2);
                cx.fill();
                // Core
                cx.fillStyle = '#ffffaa';
                cx.beginPath();
                cx.arc(c.x, c.y, 2, 0, Math.PI * 2);
                cx.fill();
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

    // Draw ground (Bathtub edge style)
    drawFoamGround() {
        const cx = this._ctx;
        const W = CONFIG.canvas.width;
        const H = CONFIG.canvas.height;
        const groundY = H - CONFIG.ground.height;

        // Tub Body (Porcelain White/Ceramic)
        cx.fillStyle = '#ffffff';
        cx.fillRect(0, groundY, W, CONFIG.ground.height);

        // Tub Top Lip (Shadow/Definition)
        cx.fillStyle = '#e8eff5';
        cx.fillRect(0, groundY, W, 15);

        // Inner shadow line for 3D effect
        cx.fillStyle = '#d0dbe5';
        cx.fillRect(0, groundY + 15, W, 2);

        // Bottom shade
        cx.fillStyle = '#f5f9fc';
        cx.fillRect(0, H - 25, W, 25);
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
                // Blue Pipe Style (Bath theme)
                const pipeColor = '#80d0f0'; // Light Cyan/Blue
                const pipeShadow = '#5bb0d0'; // Darker Blue
                const pipeHighlight = '#b0e8ff'; // Very light blue
                const outlineColor = '#2c5c7c'; // Softer Dark Blue

                // Set outline style once for the pipe
                cx.strokeStyle = outlineColor;
                cx.lineWidth = 2;

                // Top Pipe Body
                cx.fillStyle = pipeColor;
                cx.fillRect(px, 0, PIPE_W, topH);
                // Shading
                cx.fillStyle = pipeShadow;
                cx.fillRect(px + PIPE_W - 12, 0, 12, topH);
                cx.fillStyle = pipeHighlight;
                cx.fillRect(px + 10, 0, 8, topH);
                // Body Outline (Left/Right)
                cx.beginPath();
                cx.moveTo(px, 0); cx.lineTo(px, topH);
                cx.moveTo(px + PIPE_W, 0); cx.lineTo(px + PIPE_W, topH);
                cx.stroke();

                // Top Pipe Rim (Cap) - Hanging down
                const capH = 26;
                const rimY = topH - capH;
                cx.fillStyle = pipeColor;
                cx.fillRect(px - 3, rimY, PIPE_W + 6, capH);
                // Rim Details
                cx.fillStyle = pipeShadow;
                cx.fillRect(px + PIPE_W - 9, rimY, 12, capH);
                cx.fillStyle = pipeHighlight;
                cx.fillRect(px + 8, rimY, 8, capH);
                // Outline Rim
                cx.strokeRect(px - 3, rimY, PIPE_W + 6, capH);

                // Bottom Pipe Body
                const botH = H - groundH - bottomY;
                cx.fillStyle = pipeColor;
                cx.fillRect(px, bottomY, PIPE_W, botH);
                // Shading
                cx.fillStyle = pipeShadow;
                cx.fillRect(px + PIPE_W - 12, bottomY, 12, botH);
                cx.fillStyle = pipeHighlight;
                cx.fillRect(px + 10, bottomY, 8, botH);
                // Body Outline (Left/Right)
                cx.beginPath();
                cx.moveTo(px, bottomY); cx.lineTo(px, bottomY + botH);
                cx.moveTo(px + PIPE_W, bottomY); cx.lineTo(px + PIPE_W, bottomY + botH);
                cx.stroke();

                // Bottom Pipe Rim (Cap)
                cx.fillStyle = pipeColor;
                cx.fillRect(px - 3, bottomY, PIPE_W + 6, capH);
                // Rim Details
                cx.fillStyle = pipeShadow;
                cx.fillRect(px + PIPE_W - 9, bottomY, 12, capH);
                cx.fillStyle = pipeHighlight;
                cx.fillRect(px + 8, bottomY, 8, capH);
                cx.strokeRect(px - 3, bottomY, PIPE_W + 6, capH);
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

            // Cache colors (Mix once)
            // Border: Mix skin.c2 with black (0.25)
            this._cachedOutlineColor = this._mixColor(this._cachedSkin.c2, '#000000', 0.25);
            // Text: Mix skin.c2 with black (0.5)
            this._cachedTextColor = this._mixColor(this._cachedSkin.c2, '#000000', 0.5);

            // Update decor items for this skin
            this._updateSkinDecor(skinId);
        }
        const skin = this._cachedSkin;

        cx.save();
        cx.translate(Math.round(x), Math.round(y));
        cx.rotate(rot);

        // Border/Outline (Adaptive: Darker version of skin color)
        cx.strokeStyle = this._cachedOutlineColor;
        cx.lineWidth = 1.5;
        this._roundRect(-w / 2, -h / 2, w, h, 10, false, true);

        // Body with cached gradient
        cx.fillStyle = this._cachedGradient;
        this._roundRect(-w / 2, -h / 2, w, h, 10, true);

        // Top highlight (wet/glossy look) - smaller
        cx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        this._roundRect(-w / 2 + 6, -h / 2 + 4, w - 12, h * 0.22, 4, true);


        // Text with slight shadow
        cx.font = '800 7px Spinnaker, sans-serif'; // Bolder and slightly larger
        cx.textAlign = 'center';
        cx.textBaseline = 'middle';
        // Shadow/Engraved effect (lighter for depth)
        cx.fillStyle = 'rgba(255,255,255,0.3)';
        cx.fillText('SAVON YVARD', 0.5, 2);

        // Main Text (Cached adaptive color)
        cx.fillStyle = this._cachedTextColor;
        cx.fillText('SAVON YVARD', 0, 1.5);

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
    },

    // ========================================
    // SKIN DECOR SYSTEM (Optimized)
    // ========================================

    _updateSkinDecor(skinId) {
        const skin = CONFIG.skins.find(s => s.id === skinId);
        if (!skin || !skin.decor) {
            // Disable all if no decor
            if (this._skinDecorItems) {
                this._skinDecorItems.forEach(i => i.active = false);
            }
            return;
        }

        // Initialize pool if needed
        if (!this._skinDecorItems) {
            this._skinDecorItems = [];
            // Create fixed pool of 12 items (max expected)
            for (let i = 0; i < 12; i++) {
                this._skinDecorItems.push({
                    x: 0, y: 0, rot: 0, speed: 0, rotSpeed: 0,
                    type: '', active: false
                });
            }
        }

        const count = skin.decor.count || 5;
        const type = skin.decor.type;

        // Activate and randomize
        let activeCount = 0;
        for (const item of this._skinDecorItems) {
            if (activeCount >= count) {
                item.active = false;
                continue;
            }

            item.active = true;

            // Handle Mixed Types
            if (type === 'citron_mix') {
                item.type = Math.random() < 0.6 ? 'lemon' : 'ginger';
            } else {
                item.type = type;
            }

            item.x = Math.random() * CONFIG.canvas.width;
            item.y = Math.random() * CONFIG.canvas.height;
            item.rot = Math.random() * Math.PI * 2;
            item.speed = 0.5 + Math.random() * 1.5; // Slow float
            item.rotSpeed = (Math.random() - 0.5) * 0.02;
            activeCount++;
        }
    },

    _drawSkinDecor(cx, W, H) {
        if (!this._skinDecorItems || !this._skinDecorItems.length) return;

        for (const item of this._skinDecorItems) {
            if (!item.active) continue;

            cx.save();
            cx.translate(item.x, item.y);
            cx.rotate(item.rot);
            cx.globalAlpha = 0.6; // Subtle transparency

            if (item.type === 'flower') {
                // Draw Tiare Flower (Monoi) - Simplified
                cx.fillStyle = '#ffffff';
                // 5 petals
                for (let i = 0; i < 5; i++) {
                    cx.beginPath();
                    cx.ellipse(0, -8, 4, 8, 0, 0, Math.PI * 2);
                    cx.fill();
                    cx.rotate((Math.PI * 2) / 5);
                }
                // Center
                cx.fillStyle = '#ffeb3b';
                cx.beginPath();
                cx.arc(0, 0, 3, 0, Math.PI * 2);
                cx.fill();
            } else if (item.type === 'lemon') {
                // Lemon Slice
                cx.fillStyle = '#ffeb3b'; // Rind
                cx.beginPath();
                cx.arc(0, 0, 10, 0, Math.PI * 2);
                cx.fill();

                cx.fillStyle = '#fff9c4'; // Pith/Flesh
                cx.beginPath();
                cx.arc(0, 0, 8, 0, Math.PI * 2);
                cx.fill();

                // Segments
                cx.strokeStyle = '#fbc02d';
                cx.lineWidth = 0.5;
                cx.beginPath();
                for (let i = 0; i < 8; i++) {
                    cx.moveTo(0, 0);
                    cx.lineTo(Math.cos(i * Math.PI / 4) * 8, Math.sin(i * Math.PI / 4) * 8);
                }
                cx.stroke();

            } else if (item.type === 'ginger') {
                // Ginger Root (Irregular beige shape)
                cx.fillStyle = '#e6cea3';
                cx.beginPath();
                cx.moveTo(-5, -5);
                cx.quadraticCurveTo(0, -10, 5, -5);
                cx.quadraticCurveTo(10, 0, 5, 8);
                cx.quadraticCurveTo(0, 10, -5, 5);
                cx.quadraticCurveTo(-10, 0, -5, -5);
                cx.fill();

                // Texture marks
                cx.strokeStyle = '#d4b483';
                cx.lineWidth = 1;
                cx.beginPath();
                cx.moveTo(-2, -2); cx.lineTo(2, -1);
                cx.moveTo(-1, 2); cx.lineTo(3, 4);
                cx.stroke();
            } else if (item.type === 'safran') {
                // Saffron Crocus Flower
                // Purple petals
                cx.fillStyle = '#b39ddb';
                for (let i = 0; i < 5; i++) {
                    cx.beginPath();
                    cx.ellipse(0, -6, 3, 8, 0, 0, Math.PI * 2);
                    cx.fill();
                    cx.rotate(Math.PI * 2 / 5);
                }

                // Red Stigmas (The spice!)
                cx.strokeStyle = '#d32f2f';
                cx.lineWidth = 1.5;
                cx.beginPath();
                cx.moveTo(0, 0); cx.lineTo(-3, -6);
                cx.moveTo(0, 0); cx.lineTo(3, -6);
                cx.moveTo(0, 0); cx.lineTo(0, -8);
                cx.stroke();

                // Yellow Center
                cx.fillStyle = '#ffeb3b';
                cx.beginPath();
                cx.arc(0, 0, 2, 0, Math.PI * 2);
                cx.fill();
            }

            cx.restore();
        }
        cx.globalAlpha = 1;
    },

    _animateSkinDecor(dt) {
        if (!this._skinDecorItems) return;

        for (const item of this._skinDecorItems) {
            if (!item.active) continue;

            // Float upwards/sideways
            item.y -= item.speed * dt;
            item.rot += item.rotSpeed * dt;

            // Wrap around
            if (item.y < -30) {
                item.y = CONFIG.canvas.height + 30;
                item.x = Math.random() * CONFIG.canvas.width;
            }
        }
    }
};
