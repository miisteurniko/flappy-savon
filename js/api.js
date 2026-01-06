// ========================================
// Flappy Savon - API Module (Supabase)
// ========================================

const API = {
    _lastLeaderboard: null,

    // Post score to Supabase
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

        try {
            // Use Supabase for score storage
            await Supabase.upsertScore({
                pseudo: gameData.pseudo || '',
                email: gameData.email || '',
                optin: gameData.optin || false,
                score: gameData.score,
                points: gameData.points,
                best: gameData.best,
                badges: gameData.badges || []
            });
            return true;
        } catch (e) {
            console.error('[API] Post score failed:', e);
            return false;
        }
    },

    // Load leaderboard from Supabase
    async loadLeaderboard(type = 'general') {
        try {
            // Pass the type ('contest' or 'general') to Supabase
            const data = await Supabase.getLeaderboard(10, type);
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
