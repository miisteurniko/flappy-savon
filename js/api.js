// ========================================
// Flappy Savon - API Module
// ========================================

const API = {
    _lastLeaderboard: null,

    // Post score to server
    async postScore(gameData) {
        // Rate limit check
        if (!Security.canPostScore()) {
            console.warn('[API] Rate limited');
            return false;
        }

        // Validate score
        if (!Security.validateScore(gameData.score)) {
            console.warn('[API] Score validation failed');
            return false;
        }

        const sessionData = Security.getSessionData();
        const hash = await Security.generateHash(gameData);

        const payload = {
            pseudo: gameData.pseudo || 'Invité',
            email: gameData.email || '',
            optin_email: gameData.optin || false,
            score: gameData.score,
            points: gameData.points,
            best: gameData.best,
            elapsed: sessionData.elapsed,
            seed: sessionData.seed,
            flaps: sessionData.flaps,
            checks: sessionData.checks,
            hash: hash,
            badges: gameData.badges || [],
            ts: new Date().toISOString(),
            ua: navigator.userAgent,
            v: '0.013' // Version for server-side validation updates
        };

        try {
            const response = await fetch(CONFIG.api.score, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            return response.ok;
        } catch (e) {
            console.error('[API] Post score failed:', e);
            return false;
        }
    },

    // Load leaderboard
    async loadLeaderboard() {
        try {
            const response = await fetch(CONFIG.api.leaderboard, { cache: 'no-store' });

            if (!response.ok) {
                throw new Error('HTTP ' + response.status);
            }

            const data = await response.json();
            this._lastLeaderboard = data;
            return data;
        } catch (e) {
            console.error('[API] Load leaderboard failed:', e);
            return null;
        }
    },

    // Get cached leaderboard
    getLastLeaderboard() {
        return this._lastLeaderboard;
    },

    // Compute player's rank
    computeRank(rows, email, localBest) {
        try {
            if (!rows || !rows.length) return null;

            // If email matches, return exact position
            if (email) {
                const emailLower = email.toLowerCase();
                const idx = rows.findIndex(r =>
                    (String(r.email || '')).toLowerCase() === emailLower
                );
                if (idx >= 0) return idx + 1;
            }

            // Otherwise estimate based on local best
            let rank = 1;
            for (const r of rows) {
                const b = Number(r.best ?? r.score ?? 0);
                if (b > localBest) rank++;
            }
            return rank;
        } catch (e) {
            return null;
        }
    }
};
