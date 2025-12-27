// ========================================
// Flappy Savon - Main Entry Point
// ========================================

(function () {
    'use strict';

    // ===== State =====
    let skinId = localStorage.getItem('flappySavonSkin') || 'ortie';
    let totalPoints = Number(localStorage.getItem('flappySavonPoints') || 0);
    let best = Number(localStorage.getItem('flappySavonBest') || 0);
    let gamesPlayed = Number(localStorage.getItem('flappySavonGames') || 0);
    let unlockedBadges = JSON.parse(localStorage.getItem('flappyBadges') || '{}');

    // ===== Canvas Setup =====
    const canvas = document.getElementById('game');
    Renderer.init(canvas);
    CanvasResize.init(canvas);

    // ===== Initialize Modules =====
    UI.init();
    Game.init();

    // Update UI with stored values
    UI.updateBest(best);
    UI.updatePoints(totalPoints);
    UI.updateMuteButton(Audio.isMuted());

    // ===== Event Handlers =====

    // Flap on keyboard
    window.addEventListener('keydown', (e) => {
        if (e.code === 'Space' || e.key === 'ArrowUp') {
            e.preventDefault();
            Game.flap();
        } else if (e.code === 'KeyP') {
            e.preventDefault();
            Game.togglePause();
        }
    });

    // Flap on pointer
    canvas.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        Game.flap();
    });



    // Menu drawer toggle
    const menuDrawer = document.getElementById('menuDrawer');
    const menuOverlay = document.getElementById('menuOverlay');

    const openMenu = () => {
        menuDrawer.classList.add('open');
        menuOverlay.classList.add('open');
    };

    const closeMenu = () => {
        menuDrawer.classList.remove('open');
        menuOverlay.classList.remove('open');
    };

    document.getElementById('menuBtn').addEventListener('click', openMenu);
    document.getElementById('menuClose').addEventListener('click', closeMenu);
    menuOverlay.addEventListener('click', closeMenu);

    // Identity button
    document.getElementById('idBtn').addEventListener('click', () => {
        closeMenu();
        UI.openIdentityModal();
    });

    // Leaderboard button
    document.getElementById('leaderBtn').addEventListener('click', async () => {
        closeMenu();
        const shown = UI.toggleLeaderboard();
        if (shown) {
            UI.setLeaderboardLoading();
            const rows = await API.loadLeaderboard();
            if (rows) {
                const email = localStorage.getItem('email');
                UI.renderLeaderboard(rows, email);
            } else {
                UI.setLeaderboardError();
            }
        }
    });

    // Leaderboard close button
    document.getElementById('leaderClose').addEventListener('click', () => {
        UI.showLeaderboard(false);
    });

    // Skins button
    document.getElementById('skinBtn').addEventListener('click', () => {
        closeMenu();
        UI.openSkinsModal(skinId, (id, name) => {
            skinId = id;
            localStorage.setItem('flappySavonSkin', id);
            UI.showToast('Skin: ' + name);
        });
    });

    // Skin close button
    document.getElementById('skinClose').addEventListener('click', () => {
        UI.closeSkinsModal();
    });

    // Mute button
    document.getElementById('muteBtn').addEventListener('click', () => {
        closeMenu();
        const muted = Audio.toggle();
        UI.updateMuteButton(muted);
        UI.showToast(muted ? 'Son coupé' : 'Son activé');
    });

    // Share button
    document.getElementById('shareBtn').addEventListener('click', async () => {
        closeMenu();
        await UI.shareScore(Game.getScore(), best);
    });

    // Identity modal - Save button (saves and closes)
    const saveBtn = document.getElementById('idSaveBtn');
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            const ok = UI.saveIdentity();
            if (ok) {
                localStorage.setItem('flappySavonOnboarded', '1');
                UI.closeIdentityModal();
            }
        });
    }

    // Identity modal - Close button (X)
    document.getElementById('idClose').addEventListener('click', () => {
        UI.closeIdentityModal();
    });

    // Identity modal - Skip link (play as guest)
    const guestBtn = document.getElementById('idGuestBtn');
    if (guestBtn) {
        guestBtn.addEventListener('click', () => {
            UI.startAsGuest();
            localStorage.setItem('flappySavonOnboarded', '1');
            UI.closeIdentityModal();
            UI.showToast('Mode invité');
        });
    }

    // Reminder button
    document.getElementById('reminderBtn').addEventListener('click', () => {
        UI.showReminder(false);
        UI.openIdentityModal();
    });

    // Reminder close button
    document.getElementById('reminderClose').addEventListener('click', () => {
        UI.showReminder(false);
    });

    // Auto-fill pseudo from email
    document.getElementById('email').addEventListener('input', () => {
        const pseudoInput = document.getElementById('pseudo');
        const emailInput = document.getElementById('email');
        if (!pseudoInput.value) {
            const v = emailInput.value;
            const sug = v.includes('@') ? v.split('@')[0] : v;
            pseudoInput.value = sug.slice(0, 24);
        }
    });

    // ===== Game Loop =====

    let lastTime = 0;
    const TARGET_FPS = 60;
    const FRAME_TIME = 1000 / TARGET_FPS;

    function loop(timestamp) {
        // Calculate delta time with stability
        if (!lastTime) lastTime = timestamp;
        const rawDt = timestamp - lastTime;
        lastTime = timestamp;

        // Clamp dt to prevent huge jumps (tab switching, etc.)
        const dt = Math.min(rawDt, 50);
        const normalizedDt = dt / FRAME_TIME;

        // Update game logic
        const result = Game.update(normalizedDt);

        // Handle game events
        if (result === 'score') {
            const score = Game.getScore();
            totalPoints += CONFIG.scoring.pointsPerPipe;
            UI.updateScore(score);
            UI.updatePoints(totalPoints);
            checkBadges(score);
            updateLiveRank();
        } else if (result === 'dead') {
            handleDeath();
        }

        // Render
        Renderer.tick(normalizedDt);
        draw();

        requestAnimationFrame(loop);
    }

    function draw() {
        const theme = Game.getTheme();
        const soap = Game.getSoap();

        Renderer.clear();
        Renderer.drawBackground(theme.previous, theme.current, theme.transition);
        Renderer.drawPipes(Game.getPipes());
        Renderer.drawFoamGround(theme.current.id);
        // Minimal particles: bubbles (occasional) and confetti (on record)
        Renderer.drawBubbles(Particles.bubbles);
        Renderer.drawConfetti(Particles.confetti);
        Renderer.drawSoap(soap.x, soap.y, soap.w, soap.h, soap.rot, skinId);

        if (!Game.isAlive() && !Game.isGameOver()) {
            Renderer.drawTapToStart();
        }
        if (Game.isGameOver()) {
            Renderer.drawGameOver();
        }
        if (Game.isPaused()) {
            Renderer.drawPaused();
        }
    }

    // ===== Score Handling =====

    function checkBadges(score) {
        for (const b of CONFIG.badges) {
            if (score === b.score && !unlockedBadges[b.score]) {
                unlockedBadges[b.score] = true;
                localStorage.setItem('flappyBadges', JSON.stringify(unlockedBadges));
                UI.showToast('Badge débloqué: ' + b.name);
                Particles.spawnConfetti();
            }
        }
    }

    function updateLiveRank() {
        const leaderboard = API.getLastLeaderboard();
        if (leaderboard) {
            const email = localStorage.getItem('email');
            const rank = API.computeRank(leaderboard, email, best);
            if (rank) {
                UI.setLiveRank(rank, !email);
            }
        }
    }

    function handleDeath() {
        Game.die();

        // Update bests
        const score = Game.getScore();
        const previousBest = best;
        best = Math.max(best, score);
        localStorage.setItem('flappySavonBest', String(best));
        localStorage.setItem('flappySavonPoints', String(totalPoints));
        UI.updateBest(best);
        UI.updatePoints(totalPoints);

        // 🎉 Confetti on new record!
        if (score > previousBest && score > 0) {
            Particles.spawnConfetti();
            UI.showToast('🎉 Nouveau record !');
        }

        // Track games played
        gamesPlayed++;
        localStorage.setItem('flappySavonGames', String(gamesPlayed));

        // Show reminder for guests after X games
        const hasEmail = !!localStorage.getItem('email');
        if (!hasEmail && gamesPlayed >= CONFIG.ui.reminderAfterGames) {
            UI.showReminder(true);
        }

        // Show contest banner (Removed)
        // UI.showContest(true);
        UI.showLeaderboard(false);

        // Post score and update leaderboard (non-blocking)
        // Use setTimeout to ensure UI updates first
        setTimeout(async () => {
            try {
                await API.postScore({
                    pseudo: localStorage.getItem('pseudo') || '',
                    email: localStorage.getItem('email') || '',
                    optin: localStorage.getItem('optin_email') === '1',
                    score: score,
                    points: totalPoints,
                    best: best,
                    badges: Object.keys(unlockedBadges).map(k => Number(k))
                });

                const rows = await API.loadLeaderboard();
                if (rows) {
                    const email = localStorage.getItem('email');
                    const rank = API.computeRank(rows, email, best);
                    if (rank) {
                        UI.setLiveRank(rank, !email);
                        UI.showRank(rank);
                        UI.showPrize(rank);
                    }
                }
            } catch (e) {
                console.error('[Main] Score submission failed:', e);
            }
        }, 50); // Small delay to let UI update first
    }

    // ===== Onboarding =====

    function maybeShowOnboarding() {
        const hasId = !!(
            localStorage.getItem('pseudo') &&
            localStorage.getItem('email') &&
            localStorage.getItem('optin_email') === '1'
        );
        const done = localStorage.getItem('flappySavonOnboarded') === '1';

        if (!hasId && !done) {
            UI.openIdentityModal();
        }
    }

    // ===== Leaderboard Auto-refresh =====

    async function refreshLeaderboard() {
        const rows = await API.loadLeaderboard();
        if (rows) {
            const email = localStorage.getItem('email');
            const rank = API.computeRank(rows, email, best);
            if (rank) {
                UI.setLiveRank(rank, !email);
            }
        }
    }

    // ===== Initialize =====

    maybeShowOnboarding();
    refreshLeaderboard();
    setInterval(refreshLeaderboard, CONFIG.ui.leaderboardRefresh);

    // Handle Leaderboard Refresh Event from UI tabs
    window.addEventListener('refresh-leaderboard', async () => {
        try {
            const rows = await API.loadLeaderboard();
            if (rows) {
                const myEmail = localStorage.getItem('email');
                UI.renderLeaderboard(rows, myEmail);
            } else {
                UI.setLeaderboardError();
            }
        } catch (e) {
            console.error('Leaderboard fetch error:', e);
            UI.setLeaderboardError();
        }
    });

    // Start game loop
    requestAnimationFrame(loop);

    // ===== Dev Tests =====
    if (/test=1/.test(location.search)) {
        const assert = (name, cond) => console.log((cond ? '✅ ' : '❌ ') + name);
        assert('AABB overlap', Game._intersectAABB(0, 0, 10, 10, 5, 5, 15, 15) === true);
        assert('AABB disjoint', Game._intersectAABB(0, 0, 10, 10, 11, 11, 20, 20) === false);
        console.log('Tests terminés.');
    }

})();
