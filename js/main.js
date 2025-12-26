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
    let lastFrameTime = 0;

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

    // Restart button
    document.getElementById('restart').addEventListener('click', () => {
        Game.reset();
        UI.showContest(true);
        UI.showLeaderboard(false);
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
        const url = location.href;
        const txt = `Je viens de faire ${Game.getScore()} sur Flappy Savon Yvard ! ${url}`;

        if (navigator.share) {
            try {
                await navigator.share({ title: 'Flappy Savon', text: txt, url });
            } catch (e) { }
        } else {
            try {
                await navigator.clipboard.writeText(txt);
                UI.showToast('Lien copié');
            } catch (e) {
                UI.showToast('Impossible de copier');
            }
        }
    });

    // Identity modal - Save button (saves and closes)
    document.getElementById('idSave').addEventListener('click', () => {
        const ok = UI.saveIdentity();
        if (ok) {
            localStorage.setItem('flappySavonOnboarded', '1');
            UI.closeIdentityModal();
        }
    });

    // Identity modal - Close button (X)
    document.getElementById('idClose').addEventListener('click', () => {
        UI.closeIdentityModal();
    });

    // Identity modal - Skip link (play as guest)
    document.getElementById('idSkip').addEventListener('click', () => {
        UI.startAsGuest();
        localStorage.setItem('flappySavonOnboarded', '1');
        UI.closeIdentityModal();
        UI.showToast('Mode invité');
    });

    // Reminder button
    document.getElementById('reminderBtn').addEventListener('click', () => {
        UI.showReminder(false);
        UI.openIdentityModal();
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

    function loop(ms) {
        const dt = Math.min(32, ms - lastFrameTime || 16);
        lastFrameTime = ms;

        // Update
        const normalizedDt = dt / 16;
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
        Renderer.drawLeaves(Particles.leaves, theme.current.id);
        Renderer.drawBubbles(Particles.bubbles);
        Renderer.drawSteam(Particles.steam, theme.current.fog);
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

    async function handleDeath() {
        Game.die();

        // Update bests
        const score = Game.getScore();
        best = Math.max(best, score);
        localStorage.setItem('flappySavonBest', String(best));
        localStorage.setItem('flappySavonPoints', String(totalPoints));
        UI.updateBest(best);
        UI.updatePoints(totalPoints);

        // Track games played
        gamesPlayed++;
        localStorage.setItem('flappySavonGames', String(gamesPlayed));

        // Show reminder for guests after X games
        const hasEmail = !!localStorage.getItem('email');
        if (!hasEmail && gamesPlayed >= CONFIG.ui.reminderAfterGames) {
            UI.showReminder(true);
        }

        // Show contest banner
        UI.showContest(true);
        UI.showLeaderboard(false);

        // Post score and update leaderboard
        try {
            await API.postScore({
                pseudo: localStorage.getItem('pseudo') || 'Invité',
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
