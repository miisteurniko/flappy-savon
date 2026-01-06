// ========================================
// Flappy Savon - Supabase Client
// ========================================

const Supabase = {
    _url: 'https://zbrjpvtzmdmkacsffsni.supabase.co',
    _key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpicmpwdnR6bWRta2Fjc2Zmc25pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3Njg1NzQsImV4cCI6MjA4MjM0NDU3NH0.xOPdO47EoRIE_e1t60nbRR3QH4XXtPOZ9zmy4O7_ZFw',

    // Headers for all requests
    _headers() {
        return {
            'apikey': this._key,
            'Authorization': `Bearer ${this._key}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        };
    },

    // Upsert score (insert or update if email exists)
    async upsertScore(data) {
        const payload = {
            email: data.email?.toLowerCase().trim() || '',
            pseudo: data.pseudo?.trim() || '',
            score: data.score || 0,
            best: data.best || 0,
            points: data.points || 0,
            optin: data.optin || false,
            badges: Array.isArray(data.badges) ? data.badges.join(',') : ''
        };

        // Skip if no email
        if (!payload.email) {
            console.log('[Supabase] No email, skipping save');
            return null;
        }

        try {
            // Check if within contest period
            let isContest = false;
            // Access CONFIG directly if available globally, otherwise might need validation
            if (typeof CONFIG !== 'undefined' && CONFIG.contest) {
                const now = new Date();
                const start = new Date(CONFIG.contest.startDate);
                const end = new Date(CONFIG.contest.endDate);
                if (now >= start && now <= end) {
                    isContest = true;
                }
            }

            // Try to get existing user
            const existing = await this.getByEmail(payload.email);

            if (existing) {
                const updates = {
                    score: payload.score,
                    points: payload.points,
                    badges: payload.badges,
                    optin: payload.optin
                };

                // Update all-time best
                if (payload.best > (existing.best || 0)) {
                    updates.best = payload.best;
                    updates.pseudo = payload.pseudo; // Update pseudo only on best score
                }

                // Update contest best if active and better
                if (isContest) {
                    const currentContestBest = existing.contest_best || 0;
                    if (payload.score > currentContestBest) {
                        updates.contest_best = payload.score;
                        // Determine if this is the generic best too
                        // If it's a new contest record, updates.contest_best is set.
                    }
                }

                return await this._update(existing.id, updates);
            } else {
                // Insert new user
                if (isContest) {
                    payload.contest_best = payload.score;
                }
                return await this._insert(payload);
            }
        } catch (e) {
            console.error('[Supabase] Upsert error:', e);
            return null;
        }
    },

    // Get user by email
    async getByEmail(email) {
        try {
            const response = await fetch(
                `${this._url}/rest/v1/scores?email=eq.${encodeURIComponent(email.toLowerCase())}&limit=1`,
                { headers: this._headers() }
            );
            const data = await response.json();
            return data?.[0] || null;
        } catch (e) {
            console.error('[Supabase] Get error:', e);
            return null;
        }
    },

    // Insert new record
    async _insert(payload) {
        const response = await fetch(`${this._url}/rest/v1/scores`, {
            method: 'POST',
            headers: this._headers(),
            body: JSON.stringify(payload)
        });
        return await response.json();
    },

    // Update existing record
    async _update(id, payload) {
        const response = await fetch(`${this._url}/rest/v1/scores?id=eq.${id}`, {
            method: 'PATCH',
            headers: this._headers(),
            body: JSON.stringify(payload)
        });
        return await response.json();
    },

    // Get leaderboard
    async getLeaderboard(limit = 10, type = 'general') {
        try {
            let url = `${this._url}/rest/v1/scores?select=pseudo,email,contest_best,best&limit=${limit}`;

            if (type === 'contest') {
                // Sort by contest_best, filter out 0
                url += '&order=contest_best.desc,best.desc&contest_best=gt.0';
            } else {
                // General leaderboard (all time best)
                url += '&order=best.desc';
            }

            const response = await fetch(url, { headers: this._headers() });
            const data = await response.json();
            return data || [];
        } catch (e) {
            console.error('[Supabase] Leaderboard error:', e);
            return [];
        }
    },

    // Get user rank
    async getRank(email, best) {
        if (!email) return null;

        try {
            // Count how many have better score
            const response = await fetch(
                `${this._url}/rest/v1/scores?select=id&best=gt.${best}`,
                { headers: this._headers() }
            );
            const data = await response.json();
            return (data?.length || 0) + 1;
        } catch (e) {
            return null;
        }
    },

    // Fetch remote config (Contest dates etc)
    async fetchConfig() {
        try {
            // Expects a table 'app_config' with columns: key (text), value (text)
            const response = await fetch(
                `${this._url}/rest/v1/app_config?select=key,value`,
                { headers: this._headers() }
            );

            if (!response.ok) return null;

            const rows = await response.json();
            if (!rows || !Array.isArray(rows)) return null;

            // Convert array to object
            return rows.reduce((acc, row) => {
                acc[row.key] = row.value;
                return acc;
            }, {});
        } catch (e) {
            console.warn('[Supabase] No remote config found, using defaults.');
            return null;
        }
    }
};
