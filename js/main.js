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
    Analytics.init();

    // Update UI with stored values
    // Update UI with stored values
    UI.updateBest(best);
    UI.updatePoints(totalPoints);
    UI.updateMuteButton(Audio.isMuted());

    // Load remote config (Admin settings)
    if (typeof Supabase !== 'undefined') {
        Supabase.fetchConfig().then(config => {
            if (config) {
                if (config.contest_start) CONFIG.contest.startDate = config.contest_start;
                if (config.contest_end) CONFIG.contest.endDate = config.contest_end;
                if (config.contest_goal) CONFIG.contest.top3Goal = parseInt(config.contest_goal);

                // Load prizes
                CONFIG.contest.prizes = [
                    config.contest_prize_1,
                    config.contest_prize_2,
                    config.contest_prize_3
                ].filter(Boolean);

                console.log('[Main] Config updated from admin:', CONFIG.contest);

                // Refresh UI with new dates and prizes
                UI.refreshTimer();

                // Dispatch event so leaderboard can re-render if open
                window.dispatchEvent(new CustomEvent('flappy-config-loaded'));
            }
        });
    }

    // Listen for identity updates (sync from Supabase)
    window.addEventListener('flappy-identity-updated', (e) => {
        if (e.detail) {
            best = e.detail.best || 0;
            totalPoints = e.detail.points || 0;
            UI.updateBest(best);
            UI.updatePoints(totalPoints);
            // Reload badges
            unlockedBadges = JSON.parse(localStorage.getItem('flappyBadges') || '{}');
            console.log('[Main] State synced:', { best, totalPoints });
        }
    });

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
    // Flap on pointer (optimized)
    canvas.addEventListener('pointerdown', (e) => {
        // Prevent default browser actions (zoom/scroll) immediately
        if (e.cancelable) e.preventDefault();

        // Use setPointerCapture if available to handle "drag out" issues
        if (canvas.setPointerCapture) {
            try { canvas.setPointerCapture(e.pointerId); } catch (e) { }
        }

        // Track game start on first flap
        if (!Game.isAlive() && !Game.isGameOver()) {
            Analytics.trackGameStart();
        }

        Game.flap();
    }, { passive: false });

    // Block ALL touch movement on canvas to prevent iOS rubber-banding
    canvas.addEventListener('touchstart', (e) => {
        if (e.cancelable) e.preventDefault();
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
        if (e.cancelable) e.preventDefault();
    }, { passive: false });

    // Also block on document level to prevent any scroll/bounce
    document.addEventListener('touchmove', (e) => {
        // Only prevent if touching the game area
        if (e.target === canvas || e.target.closest('.wrap')) {
            if (e.cancelable) e.preventDefault();
        }
    }, { passive: false });



    // Menu drawer toggle
    const menuDrawer = document.getElementById('menuDrawer');
    const menuOverlay = document.getElementById('menuOverlay');

    const openMenu = () => {
        menuDrawer.classList.add('open');
        menuOverlay.classList.add('open');
        Game.setPaused(true);
    };

    const closeMenu = () => {
        menuDrawer.classList.remove('open');
        menuOverlay.classList.remove('open');
        Game.setPaused(false);
    };

    document.getElementById('menuBtn').addEventListener('click', openMenu);
    document.getElementById('menuClose').addEventListener('click', closeMenu);
    menuOverlay.addEventListener('click', closeMenu);

    // Stats modal - click on score to open
    document.querySelector('.score-display').addEventListener('click', (e) => {
        e.stopPropagation();
        UI.openStatsModal();
    });

    // Stats modal - close button
    document.getElementById('statsClose').addEventListener('click', () => {
        UI.closeStatsModal();
    });

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
            const rows = await API.loadLeaderboard('contest');
            if (rows) {
                const email = localStorage.getItem('email');
                UI.renderLeaderboard(rows, email, 'contest');
            } else {
                UI.setLeaderboardError();
            }
        }
    });

    // Countdown bar (opens Prizes tab)
    const countdownBar = document.getElementById('countdownBar');
    if (countdownBar) {
        countdownBar.addEventListener('click', () => {
            closeMenu();
            UI.openIdentityModal('prizes');
        });
    }

    // Go to Ranking Button (in Prizes tab)
    const goToRankingBtn = document.getElementById('goToRankingBtn');
    if (goToRankingBtn) {
        goToRankingBtn.addEventListener('click', () => {
            UI.switchToTab('ranking');
            // Ensure leaderboard loads if it hasn't already or refresh it
            UI.setLeaderboardLoading();
            API.loadLeaderboard('contest').then(rows => {
                if (rows) UI.renderLeaderboard(rows, localStorage.getItem('email'), 'contest');
            });
        });
    }

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

    // Fixed Time Step Logic
    const TARGET_FPS = 60;
    const TIME_STEP = 1000 / TARGET_FPS; // ~16.66ms
    let lastTime = 0;
    let accumulator = 0;

    function loop(timestamp) {
        if (!lastTime) lastTime = timestamp;
        let dt = timestamp - lastTime;
        lastTime = timestamp;

        // Clamp dt to avoid spiral of death (max 100ms)
        if (dt > 100) dt = 100;

        accumulator += dt;

        // Fixed Update (Physics)
        while (accumulator >= TIME_STEP) {
            // Update logic with fixed delta (1.0 normalized)
            const result = Game.update(1.0);

            // Handle game events synchronized with physics
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

            accumulator -= TIME_STEP;
        }

        // Render (Visuals)
        // Pass normalized dt for smooth animations (clouds etc)
        // We use dt / TIME_STEP to match the previous scale
        Renderer.tick(dt / TIME_STEP);
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
        // Disabled by user request
    }

    function handleDeath() {
        Game.die();

        // Track analytics
        Analytics.trackGameEnd(Game.getScore());

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

        // Check for skin unlocks
        for (const s of CONFIG.skins) {
            if (s.unlockAt > 0 && previousBest < s.unlockAt && best >= s.unlockAt) {
                setTimeout(() => {
                    UI.showUnlock(s, () => {
                        // User clicked 'Equip'
                        skinId = s.id;
                        localStorage.setItem('flappySavonSkin', s.id);
                        UI.showToast(`✨ ${s.name} équipé !`);
                        Particles.spawnConfetti();
                    });
                    Particles.spawnConfetti();
                }, 1000); // reduced delay for better impact
            }
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

                const rows = await API.loadLeaderboard('contest');
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
        const hasSkin = !!localStorage.getItem('flappySavonSkin');
        if (!hasSkin) {
            // First run: Force skin selection
            setTimeout(() => {
                UI.openSkinsModal('ortie', (id, name) => {
                    skinId = id;
                    localStorage.setItem('flappySavonSkin', id);
                    UI.showToast('Skin choisi : ' + name);
                    checkIdentityOnboarding();
                });
            }, 100);
            return;
        }
        checkIdentityOnboarding();
    }

    function checkIdentityOnboarding() {
        const hasId = !!(
            localStorage.getItem('pseudo') &&
            localStorage.getItem('email') &&
            localStorage.getItem('optin_email') === '1'
        );
        const done = localStorage.getItem('flappySavonOnboarded') === '1';

        if (!hasId && !done) {
            // Small delay to ensure layout is stable
            setTimeout(() => UI.openIdentityModal(), 100);
        }
    }

    // ===== Leaderboard Auto-refresh =====

    async function refreshLeaderboard() {
        const rows = await API.loadLeaderboard('contest');
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
            const rows = await API.loadLeaderboard('contest');
            if (rows) {
                const myEmail = localStorage.getItem('email');
                UI.renderLeaderboard(rows, myEmail, 'contest');
            } else {
                UI.setLeaderboardError();
            }
        } catch (e) {
            console.error('Leaderboard fetch error:', e);
            UI.setLeaderboardError();
        }
    });

    // Start game loop
    // ===== Splash Screen & Game Loop Start =====
    const startLoop = () => {
        draw();
        requestAnimationFrame(loop);
    };

    window.addEventListener('load', () => {
        const splash = document.getElementById('splashScreen');
        if (splash) {
            setTimeout(() => {
                startLoop();
                splash.classList.add('fade-out');
                setTimeout(() => { splash.style.display = 'none'; }, 500);
            }, 2500);
        } else {
            startLoop();
        }
    });

    if (/test=1/.test(location.search)) {
        const assert = (name, cond) => console.log((cond ? '✅ ' : '❌ ') + name);
        assert('AABB overlap', Game._intersectAABB(0, 0, 10, 10, 5, 5, 15, 15) === true);
        assert('AABB disjoint', Game._intersectAABB(0, 0, 10, 10, 11, 11, 20, 20) === false);
        console.log('Tests terminés.');
    }

})();
