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
            // Connected View Elements
            formInputs: document.getElementById('formInputs'),
            connectedView: document.getElementById('connectedView'),
            connectedName: document.getElementById('connectedName'),
            connectedEmail: document.getElementById('connectedEmail'),
            idEditBtn: document.getElementById('idEditBtn'),
            guestOptions: document.getElementById('guestOptions'), // Cache guest options
            skinModal: document.getElementById('skinModal'),
            skinsEl: document.getElementById('skins'),
            // Unlock Modal
            unlockModal: document.getElementById('unlockModal'),
            unlockIcon: document.getElementById('unlockIcon'),
            unlockName: document.getElementById('unlockName'),
            equipBtn: document.getElementById('equipBtn'),
            unlockClose: document.getElementById('unlockClose')
        };

        // Start countdown timer
        this._startCountdown();

        // Initialize tabs
        this.initTabs();
        this.initLeaderboardTabs();

        // Re-render leaderboard when config is loaded (for prizes)
        window.addEventListener('flappy-config-loaded', () => {
            const container = document.getElementById('modalLeaderboard');
            // Only re-render if leaderboard is visible and has content
            if (container && container.children.length > 0) {
                const activeTab = document.querySelector('.lb-tab.active');
                const type = activeTab?.dataset?.type || 'contest';
                API.loadLeaderboard(type).then(rows => {
                    const email = localStorage.getItem('email');
                    this.renderLeaderboard(rows, email, type);
                });
            }
        });

        // Connected logic
        if (this.el.idEditBtn) {
            this.el.idEditBtn.addEventListener('click', () => {
                this.el.connectedView.style.display = 'none';
                this.el.formInputs.style.display = 'block';
                if (this.el.guestOptions) this.el.guestOptions.style.display = 'block'; // Show guest link when editing
            });
        }
    },

    // === UNLOCK MODAL ===

    showUnlock(skin, onEquip) {
        // Set content
        this.el.unlockName.textContent = skin.name;

        // Draw the actual soap in the canvas
        const canvas = this.el.unlockIcon;
        const cx = canvas.getContext('2d');
        const w = 80, h = 50;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        // Clear canvas
        cx.clearRect(0, 0, canvas.width, canvas.height);

        // Create gradient like the real soap
        const grad = cx.createLinearGradient(centerX - w / 2, centerY - h / 2, centerX + w / 2, centerY + h / 2);
        grad.addColorStop(0, skin.c1);
        grad.addColorStop(1, skin.c2);

        // Draw rounded rectangle (soap body)
        cx.fillStyle = grad;
        cx.beginPath();
        const r = 12;
        cx.moveTo(centerX - w / 2 + r, centerY - h / 2);
        cx.arcTo(centerX + w / 2, centerY - h / 2, centerX + w / 2, centerY + h / 2, r);
        cx.arcTo(centerX + w / 2, centerY + h / 2, centerX - w / 2, centerY + h / 2, r);
        cx.arcTo(centerX - w / 2, centerY + h / 2, centerX - w / 2, centerY - h / 2, r);
        cx.arcTo(centerX - w / 2, centerY - h / 2, centerX + w / 2, centerY - h / 2, r);
        cx.closePath();
        cx.fill();

        // Border
        cx.strokeStyle = skin.c2;
        cx.lineWidth = 2;
        cx.stroke();

        // Top highlight (glossy effect)
        cx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        cx.beginPath();
        cx.roundRect(centerX - w / 2 + 8, centerY - h / 2 + 5, w - 16, h * 0.25, 4);
        cx.fill();

        // Text "SAVON YVARD"
        cx.font = '700 8px Spinnaker, sans-serif';
        cx.textAlign = 'center';
        cx.textBaseline = 'middle';
        cx.fillStyle = 'rgba(0,0,0,0.15)';
        cx.fillText('SAVON YVARD', centerX + 0.5, centerY + 1.5);
        cx.fillStyle = skin.c2;
        cx.fillText('SAVON YVARD', centerX, centerY + 1);

        // Handlers
        this.el.equipBtn.onclick = () => {
            if (onEquip) onEquip();
            this.closeUnlockModal();
        };

        this.el.unlockClose.onclick = () => {
            this.closeUnlockModal();
        };

        // Restart confetti animation by cloning nodes
        const confettiContainer = document.getElementById('unlockConfetti');
        if (confettiContainer) {
            const spans = confettiContainer.querySelectorAll('span');
            spans.forEach(span => {
                const newSpan = span.cloneNode(true);
                span.parentNode.replaceChild(newSpan, span);
            });
        }

        // Show
        this.el.unlockModal.classList.add('open', 'unlocking');
        this.el.unlockModal.setAttribute('aria-hidden', 'false');

        // Keep animation class longer for better effect
        setTimeout(() => {
            this.el.unlockModal.classList.remove('unlocking');
        }, 3000);
    },

    closeUnlockModal() {
        this.el.unlockModal.classList.remove('open');
        this.el.unlockModal.setAttribute('aria-hidden', 'true');
    },

    // === TABS LOGIC ===

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

    // Show rank bubble (Removed)
    showRank(rank) {
        // Feature disabled
    },

    // Set live rank display (Removed)
    setLiveRank(rank, isGuest) {
        // Feature disabled
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

    // Programmatically switch tab
    switchToTab(tabName) {
        const tabs = this.el.idModal.querySelectorAll('.tab-btn');
        tabs.forEach(b => {
            if (b.dataset.tab === tabName) {
                b.click();
            }
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

        // Toggle View based on existing data
        const pseudo = this.el.pseudoInput.value;
        const email = this.el.emailInput.value;

        if (pseudo && email && this.el.connectedView) {
            // SHOW CONNECTED VIEW
            this.el.formInputs.style.display = 'none';
            this.el.connectedView.style.display = 'block';
            if (this.el.guestOptions) this.el.guestOptions.style.display = 'none'; // Hide guest link

            // Fill info
            if (this.el.connectedName) this.el.connectedName.textContent = pseudo;
            if (this.el.connectedEmail) this.el.connectedEmail.textContent = email;

        } else if (this.el.formInputs) {
            // SHOW FORM
            this.el.formInputs.style.display = 'block';
            if (this.el.connectedView) this.el.connectedView.style.display = 'none';
            if (this.el.guestOptions) this.el.guestOptions.style.display = 'block'; // Show guest link
        }

        // Switch to default tab
        const tabs = this.el.idModal.querySelectorAll('.tab-btn');
        const targetBtn = Array.from(tabs).find(b => b.dataset.tab === defaultTab);
        if (targetBtn) targetBtn.click();

        this.updatePromoTab();

        this.el.idModal.classList.add('open');
        this.el.idModal.setAttribute('aria-hidden', 'false');

        // Track modal open
        if (typeof Analytics !== 'undefined') {
            Analytics.track('modal_open', { name: 'identity', tab: defaultTab });
        }
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

    async saveIdentity() {
        const { pseudo, email, optin } = this.getIdentityData();

        // Auto-complete pseudo from email
        if (email && !pseudo) {
            const sug = email.split('@')[0].slice(0, 24);
            this.el.pseudoInput.value = sug;
        }

        // Validate fields with specific error messages
        if (!pseudo || !email) {
            this.showToast('Renseigne ton pseudo et ton e-mail pour participer.');
            return false;
        }

        if (!optin) {
            this.showToast('⚠️ Coche la case pour accepter les e-mails et valider ton inscription.');
            // Highlight the checkbox visually
            const optinRow = this.el.optinInput.closest('.row');
            if (optinRow) {
                optinRow.classList.add('shake');
                setTimeout(() => optinRow.classList.remove('shake'), 600);
            }
            // Track failed attempt
            if (typeof Analytics !== 'undefined') {
                Analytics.track('registration_attempt', { success: false, error: 'optin_missing' });
            }
            return false;
        }

        localStorage.setItem('pseudo', pseudo);
        localStorage.setItem('email', email);
        localStorage.setItem('optin_email', optin ? '1' : '0');

        this.showToast('Sauvegarde en cours...');

        try {
            // Sync with Supabase (Background)
            if (typeof Supabase !== 'undefined') {
                const remoteUser = await Supabase.getByEmail(email);

                if (remoteUser) {
                    // Update local best if remote is better
                    const localBest = Number(localStorage.getItem('flappySavonBest') || 0);
                    const localPoints = Number(localStorage.getItem('flappySavonPoints') || 0);

                    const newBest = Math.max(localBest, remoteUser.best || 0);
                    const newPoints = Math.max(localPoints, remoteUser.points || 0);

                    localStorage.setItem('flappySavonBest', newBest);
                    localStorage.setItem('flappySavonPoints', newPoints);

                    // Unlock badges if exist
                    if (remoteUser.badges) {
                        const badges = remoteUser.badges.split(',');
                        const localBadges = JSON.parse(localStorage.getItem('flappyBadges') || '{}');
                        badges.forEach(b => localBadges[b] = true);
                        localStorage.setItem('flappyBadges', JSON.stringify(localBadges));
                    }

                    // Dispatch update for Main.js
                    window.dispatchEvent(new CustomEvent('flappy-identity-updated', {
                        detail: { best: newBest, points: newPoints }
                    }));

                    this.showToast(`Compte synchronisé ! Meilleur score : ${newBest}`);
                } else {
                    this.showToast('Compte enregistré ✓');
                }
            }
        } catch (e) {
            console.error('Sync error:', e);
            this.showToast('Compte enregistré (Mode hors ligne)');
        }

        // Track successful registration
        if (typeof Analytics !== 'undefined') {
            Analytics.track('registration_complete', { has_optin: optin });
        }
        return true;
    },

    startAsGuest() {
        localStorage.setItem('pseudo', '');
        localStorage.removeItem('email');
        localStorage.setItem('optin_email', '0');
        localStorage.setItem('flappySavonOnboarded', '1');
    },

    // === SKINS MODAL ===

    // === SKINS MODAL ===

    openSkinsModal(currentSkinId, onSelect) {
        this.el.skinsEl.innerHTML = '';

        // Get best score for unlocking
        const bestScore = parseInt(localStorage.getItem('flappySavonBest') || '0', 10);

        for (const s of CONFIG.skins) {
            const isLocked = (s.unlockAt || 0) > bestScore;

            const el = document.createElement('div');
            // Add 'locked' class if locked
            el.className = 'swatch' + (s.id === currentSkinId ? ' active' : '') + (isLocked ? ' locked' : '');

            // Content
            if (isLocked) {
                el.innerHTML = `
                    <div class="dot" style="background:#ddd">🔒</div>
                    <div><small>Score ${s.unlockAt}</small></div>
                `;
                // No click handler
                el.style.opacity = '0.5';
                el.style.cursor = 'not-allowed';
            } else {
                el.innerHTML = `
                    <div class="dot" style="background:linear-gradient(45deg,${s.c1},${s.c2})"></div>
                    <div>${s.name}</div>
                `;
                el.onclick = () => {
                    onSelect(s.id, s.name);
                    this.closeSkinsModal();
                };
            }

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

    renderLeaderboard(rows, currentEmail, type = 'general') {
        // Render to the modal container
        const container = document.getElementById('modalLeaderboard');
        if (!container) return;

        container.innerHTML = '';

        if (!rows || !rows.length) {
            container.innerHTML = '<div class="muted">Aucun score pour le moment.</div>';
            return;
        }

        // Show prizes if contest mode
        if (type === 'contest' && CONFIG.contest.prizes && CONFIG.contest.prizes.length > 0) {
            const prizesDiv = document.createElement('div');
            prizesDiv.className = 'prizes-container';
            prizesDiv.innerHTML = `
                <h3>🎁 Lots à gagner</h3>
                <div class="prizes-list">
                    ${CONFIG.contest.prizes.map((p, i) => `
                        <div class="prize-item">
                            <span class="prize-rank">${i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</span>
                            <span class="prize-name">${this._escapeHtml(p)}</span>
                        </div>
                    `).join('')}
                </div>
            `;
            container.appendChild(prizesDiv);
        }

        const emailLower = (currentEmail || '').toLowerCase();

        rows.slice(0, 50).forEach((r, i) => {
            const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '';
            const isMe = emailLower && (String(r.email || '')).toLowerCase() === emailLower;

            const score = type === 'contest' ? (r.contest_best || 0) : (r.best || r.score || 0);

            const div = document.createElement('div');
            div.className = 'lb-row' + (i === 0 ? ' top1' : '') + (isMe ? ' me' : '');
            div.innerHTML = `
        <div class="medal">${medal || (i + 1)}</div>
        <div class="lb-name">${this._escapeHtml(r.pseudo || 'Anonyme')}${isMe ? ' <span class="you-badge">Toi</span>' : ''}</div>
        <div class="lb-score">${score}</div>
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

    // === DYNAMIC LEADERBOARD TABS ===
    initLeaderboardTabs() {
        const tabs = document.querySelectorAll('.lb-tab');
        tabs.forEach(btn => {
            btn.addEventListener('click', async () => {
                // Toggle active state
                tabs.forEach(t => t.classList.remove('active'));
                btn.classList.add('active');

                // Update title
                const type = btn.dataset.type;
                const title = document.getElementById('lbTitle');
                if (title) {
                    title.textContent = type === 'contest' ?
                        'Top Joueurs (Concours)' :
                        'Top Joueurs (Général)';
                }

                // Toggle subtitle (User request: hide for General)
                const subtitle = document.getElementById('lbSubtitle');
                if (subtitle) {
                    subtitle.style.display = type === 'contest' ? 'block' : 'none';
                }

                // Show loading
                this.setLeaderboardLoading();

                // Fetch data
                const rows = await API.loadLeaderboard(type);
                const email = localStorage.getItem('email');
                this.renderLeaderboard(rows, email, type);
            });
        });
    },

    // === STATS MODAL ===

    openStatsModal() {
        const modal = document.getElementById('statsModal');
        if (!modal) return;

        // Populate stats from localStorage
        document.getElementById('statGames').textContent = localStorage.getItem('flappySavonGames') || '0';
        document.getElementById('statBest').textContent = localStorage.getItem('flappySavonBest') || '0';
        document.getElementById('statPoints').textContent = localStorage.getItem('flappySavonPoints') || '0';

        // Count badges
        const unlockedBadges = JSON.parse(localStorage.getItem('flappyBadges') || '{}');
        const badgeScores = Object.keys(unlockedBadges);
        document.getElementById('statBadges').textContent = badgeScores.length;

        // Show badge names from CONFIG
        const badgesList = document.getElementById('statsBadgesList');
        if (badgesList) {
            if (badgeScores.length === 0) {
                badgesList.innerHTML = '<span style="color: #999;">🔒 Aucun badge encore</span>';
            } else {
                const names = badgeScores.map(score => {
                    const badge = CONFIG.badges.find(b => b.score === Number(score));
                    return badge ? `<span class="badge-chip">🏆 ${badge.name}</span>` : '';
                }).filter(Boolean).join(' ');
                badgesList.innerHTML = names;
            }
        }

        modal.classList.add('open');
        modal.setAttribute('aria-hidden', 'false');
    },

    closeStatsModal() {
        const modal = document.getElementById('statsModal');
        if (modal) {
            modal.classList.remove('open');
            modal.setAttribute('aria-hidden', 'true');
        }
    },

    // === SOCIAL SHARE ===

    async shareScore(score, best) {
        // Track share click
        if (typeof Analytics !== 'undefined') {
            Analytics.track('share_click', { score: score, best: best });
        }

        const text = `🎮 J'ai fait ${score} points sur Flappy Savon ! Mon record : ${best} pts. Tu peux faire mieux ? 🧼`;
        const url = 'https://flappy-savon.vercel.app/';

        // Try Web Share API first (mobile)
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Flappy Savon',
                    text: text,
                    url: url
                });
                return;
            } catch (e) {
                // User cancelled or error, fall through to fallback
            }
        }

        // Fallback: copy to clipboard and show options
        const fullText = `${text}\n${url}`;
        if (navigator.clipboard) {
            await navigator.clipboard.writeText(fullText);
            this.showToast('📋 Copié ! Partage sur tes réseaux');
        }

        // Open WhatsApp as fallback
        const waUrl = `https://wa.me/?text=${encodeURIComponent(fullText)}`;
        window.open(waUrl, '_blank');
    },

    // === COUNTDOWN ===

    _startCountdown() {
        // Run immediately
        setTimeout(() => this._tickCountdown(), 0);
        // Then every minute
        setInterval(() => this._tickCountdown(), 60000);
    },

    _tickCountdown() {
        const els = document.querySelectorAll('.countdown-timer');
        if (els.length === 0) return;

        const endDate = new Date(CONFIG.contest.endDate);
        const now = new Date();

        // If config not loaded yet (invalid date or default), show placeholder
        if (isNaN(endDate.getTime())) {
            els.forEach(el => { el.textContent = '-- jours'; });
            return;
        }

        const diff = endDate - now;

        let text = '';
        if (diff <= 0) {
            text = 'Terminé !';
        } else {
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

            if (days > 0) {
                text = `Fin dans ${days}j ${hours}h`;
            } else {
                const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                text = `Fin dans ${hours}h ${mins}m`;
            }
        }

        els.forEach(el => {
            el.textContent = text;
        });
    },

    // === PRIZES ===

    renderPrizes() {
        const list = document.getElementById('prizesList');
        const title = document.getElementById('prizesTitle');

        if (CONFIG.contest.endDate && title) {
            const date = new Date(CONFIG.contest.endDate);
            if (!isNaN(date.getTime())) {
                const month = date.toLocaleString('fr-FR', { month: 'long' });
                title.textContent = `🏆 3 Gagnants le ${date.getDate()} ${month.charAt(0).toUpperCase() + month.slice(1)}`;
            }
        }

        if (!list) return;

        if (CONFIG.contest.prizes && CONFIG.contest.prizes.length > 0) {
            list.innerHTML = CONFIG.contest.prizes.map((p, i) => `
                <li>
                    <span class="medal">${i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</span> 
                    <strong>Top ${i + 1} :</strong> ${this._escapeHtml(p)}
                </li>
            `).join('');
        } else {
            list.innerHTML = '<li class="muted">Aucun lot défini pour le moment.</li>';
        }
    },

    // Public method to force refresh (after config load)
    refreshTimer() {
        // Update Prizes Tab
        this.renderPrizes();
        // Update all countdown timers
        this._tickCountdown();
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
