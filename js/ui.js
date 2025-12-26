// ========================================
// Flappy Savon - UI Module
// ========================================

const UI = {
    // DOM elements cache
    el: {},

    // Initialize UI
    init() {
        // Cache all DOM elements
        this.el = {
            score: document.getElementById('score'),
            best: document.getElementById('best'),
            points: document.getElementById('points'),
            countdown: document.getElementById('countdown'),
            contest: document.getElementById('contest'),
            rankBubble: document.getElementById('rank'),
            rankLive: document.getElementById('rankLive'),
            toast: document.getElementById('toast'),
            prizeBox: document.getElementById('prize'),
            prizeImg: document.getElementById('prizeImg'),
            prizeTxt: document.getElementById('prizeTxt'),
            reminder: document.getElementById('reminder'),
            leader: document.getElementById('leader'),
            leaderRows: document.getElementById('leaderRows'),
            leaderMeta: document.getElementById('leaderMeta'),
            // Modals
            idModal: document.getElementById('idModal'),
            pseudoInput: document.getElementById('pseudo'),
            emailInput: document.getElementById('email'),
            optinInput: document.getElementById('optin'),
            skinModal: document.getElementById('skinModal'),
            skinsEl: document.getElementById('skins')
        };

        // Start countdown timer
        this._startCountdown();

        // Initialize tabs
        this.initTabs();
    },

    // Update score display
    updateScore(score) {
        this.el.score.textContent = score;
    },

    // Update best score display
    updateBest(best) {
        this.el.best.textContent = best;
    },

    // Update points display (optional element)
    updatePoints(points) {
        if (this.el.points) {
            this.el.points.textContent = points;
        }
    },

    // Show toast notification
    showToast(msg) {
        this.el.toast.textContent = msg;
        this.el.toast.classList.add('show');

        clearTimeout(this._toastTimeout);
        this._toastTimeout = setTimeout(() => {
            this.el.toast.classList.remove('show');
        }, CONFIG.ui.toastDuration);
    },

    // Show rank bubble
    showRank(rank) {
        if (!rank) return;

        this.el.rankBubble.textContent = 'Rang ' + rank + (rank <= 3 ? ' – bravo!' : '');
        this.el.rankBubble.classList.toggle('good', rank <= 3);
        this.el.rankBubble.style.display = 'block';

        clearTimeout(this._rankTimeout);
        this._rankTimeout = setTimeout(() => {
            this.el.rankBubble.style.display = 'none';
        }, CONFIG.ui.rankDisplayDuration);
    },

    // Set live rank display
    setLiveRank(rank, isGuest) {
        if (!rank) return;

        this.el.rankLive.textContent = 'Rang ' + rank;
        this.el.rankLive.classList.toggle('guest', !!isGuest);
        this.el.rankLive.style.display = 'block';
    },

    // Show/hide contest banner
    showContest(show) {
        // Disabled by user request
        if (this.el.contest) {
            this.el.contest.style.display = 'none';
        }
    },

    // Show/hide reminder popup
    showReminder(show) {
        this.el.reminder.style.display = show ? 'flex' : 'none';
    },

    // Show prize popup
    showPrize(rank) {
        if (rank > 3 || !CONFIG.images.prizes[rank]) return;

        this.el.prizeImg.src = CONFIG.images.prizes[rank];
        this.el.prizeTxt.textContent = rank === 1 ? '🥇 1ère place !' :
            rank === 2 ? '🥈 2ème place !' :
                '🥉 3ème place !';
        this.el.prizeBox.style.display = 'flex';

        setTimeout(() => {
            this.el.prizeBox.style.display = 'none';
        }, 4000);
    },

    // === TABS LOGIC ===
    initTabs() {
        const tabs = this.el.idModal.querySelectorAll('.tab-btn');
        tabs.forEach(btn => {
            btn.addEventListener('click', () => {
                // Deactivate all
                tabs.forEach(b => b.classList.remove('active'));
                this.el.idModal.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

                // Activate clicked
                btn.classList.add('active');
                const targetId = `tab-${btn.dataset.tab}`;
                const targetContent = document.getElementById(targetId);
                if (targetContent) targetContent.classList.add('active');

                // Special handling
                if (btn.dataset.tab === 'ranking') {
                    // Trigger leaderboard fetch
                    document.getElementById('modalLeaderboard').innerHTML = '<div class="muted">Chargement...</div>';
                    window.dispatchEvent(new CustomEvent('refresh-leaderboard'));
                }
            });
        });
    },

    updatePromoTab() {
        // Fix: Use correct localStorage key (matches main.js)
        const bestScore = parseInt(localStorage.getItem('flappySavonBest') || '0', 10);
        const promos = document.querySelectorAll('.promo-item');

        promos.forEach(item => {
            const threshold = parseInt(item.dataset.threshold, 10);
            const codeDisplay = item.querySelector('.code-display');

            if (bestScore >= threshold) {
                item.classList.add('unlocked');
                // User requested: codes are sent by email, not displayed
                codeDisplay.innerHTML = 'Envoyé par email ✉️';
                codeDisplay.title = "Vérifie ta boîte mail !";
                codeDisplay.style.cursor = "default";
                codeDisplay.onclick = null;
            } else {
                item.classList.remove('unlocked');
                codeDisplay.textContent = `Bloqué 🔒`;
                codeDisplay.style.cursor = "default";
                codeDisplay.onclick = null;
            }
        });
    },

    // === IDENTITY MODAL ===

    openIdentityModal(defaultTab = 'register') {
        this.el.pseudoInput.value = localStorage.getItem('pseudo') || '';
        this.el.emailInput.value = localStorage.getItem('email') || '';
        this.el.optinInput.checked = localStorage.getItem('optin_email') === '1';

        // Switch to default tab
        const tabs = this.el.idModal.querySelectorAll('.tab-btn');
        const targetBtn = Array.from(tabs).find(b => b.dataset.tab === defaultTab);
        if (targetBtn) targetBtn.click();

        this.updatePromoTab();

        this.el.idModal.classList.add('open');
        this.el.idModal.setAttribute('aria-hidden', 'false');
    },

    closeIdentityModal() {
        this.el.idModal.classList.remove('open');
        this.el.idModal.setAttribute('aria-hidden', 'true');
    },

    getIdentityData() {
        return {
            pseudo: (this.el.pseudoInput.value || '').trim(),
            email: (this.el.emailInput.value || '').trim(),
            optin: !!this.el.optinInput.checked
        };
    },

    saveIdentity() {
        const { pseudo, email, optin } = this.getIdentityData();

        // Auto-complete pseudo from email
        if (email && !pseudo) {
            const sug = email.split('@')[0].slice(0, 24);
            this.el.pseudoInput.value = sug;
        }

        // Require all fields for account creation
        if (!(pseudo && email && optin)) {
            this.showToast('Pour créer un compte, renseigne pseudo + e‑mail et coche la case.');
            return false;
        }

        localStorage.setItem('pseudo', pseudo);
        localStorage.setItem('email', email);
        localStorage.setItem('optin_email', optin ? '1' : '0');
        this.showToast('Compte enregistré ✓');
        return true;
    },

    startAsGuest() {
        localStorage.setItem('pseudo', 'Invité');
        localStorage.removeItem('email');
        localStorage.setItem('optin_email', '0');
        localStorage.setItem('flappySavonOnboarded', '1');
    },

    // === SKINS MODAL ===

    openSkinsModal(currentSkinId, onSelect) {
        this.el.skinsEl.innerHTML = '';

        for (const s of CONFIG.skins) {
            const el = document.createElement('div');
            el.className = 'swatch' + (s.id === currentSkinId ? ' active' : '');
            el.innerHTML = `
        <div class="dot" style="background:linear-gradient(45deg,${s.c1},${s.c2})"></div>
        <div>${s.name}</div>
      `;
            el.onclick = () => {
                onSelect(s.id, s.name);
                this.closeSkinsModal();
            };
            this.el.skinsEl.appendChild(el);
        }

        this.el.skinModal.classList.add('open');
    },

    closeSkinsModal() {
        this.el.skinModal.classList.remove('open');
    },

    // === LEADERBOARD ===

    showLeaderboard(show) {
        // Legacy method, now we use the modal tab
        if (show) this.openIdentityModal('ranking');
    },

    toggleLeaderboard() {
        // Legacy toggle
        this.openIdentityModal('ranking');
    },

    renderLeaderboard(rows, currentEmail) {
        // Render to the modal container
        const container = document.getElementById('modalLeaderboard');
        if (!container) return;

        container.innerHTML = '';

        if (!rows || !rows.length) {
            container.innerHTML = '<div class="muted">Aucun score pour le moment.</div>';
            return;
        }

        const emailLower = (currentEmail || '').toLowerCase();

        rows.slice(0, 50).forEach((r, i) => {
            const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '';
            const isMe = emailLower && (String(r.email || '')).toLowerCase() === emailLower;

            const div = document.createElement('div');
            div.className = 'lb-row' + (i === 0 ? ' top1' : '') + (isMe ? ' me' : '');
            div.innerHTML = `
        <div class="medal">${medal || (i + 1)}</div>
        <div class="lb-name">${this._escapeHtml(r.pseudo || 'Anonyme')}${isMe ? ' <span class="you-badge">Toi</span>' : ''}</div>
        <div class="lb-score">${r.best ?? r.score ?? 0}</div>
      `;
            // Need to style lb-row if not already
            container.appendChild(div);
        });
    },

    setLeaderboardLoading() {
        const container = document.getElementById('modalLeaderboard');
        if (container) container.innerHTML = '<div class="muted">Chargement…</div>';
    },

    setLeaderboardError() {
        const container = document.getElementById('modalLeaderboard');
        if (container) container.innerHTML = '<div class="muted">Impossible de charger le classement.</div>';
    },

    // === COUNTDOWN ===

    _startCountdown() {
        // Removed as banner is gone
    },

    _tickCountdown() {
        // Removed
    },

    // === MUTE BUTTON ===

    updateMuteButton(isMuted) {
        const btn = document.getElementById('muteBtn');
        if (btn) {
            const icon = btn.querySelector('.item-icon');
            if (icon) {
                icon.innerHTML = isMuted
                    ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>'
                    : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>';
            }
        }
    },

    // === HELPERS ===

    _escapeHtml(s) {
        return String(s).replace(/[&<>"']/g, m => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[m]));
    }
};
