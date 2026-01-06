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
            // Try to get existing user
            const existing = await this.getByEmail(payload.email);

            if (existing) {
                // Update only if best score improved
                if (payload.best > (existing.best || 0)) {
                    return await this._update(existing.id, {
                        pseudo: payload.pseudo,
                        score: payload.score,
                        best: payload.best,
                        points: payload.points,
                        badges: payload.badges,
                        optin: payload.optin
                    });
                } else {
                    // Update points and last score even if not best
                    return await this._update(existing.id, {
                        score: payload.score,
                        points: payload.points,
                        badges: payload.badges
                    });
                }
            } else {
                // Insert new user
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

    // Get leaderboard (top 10 by best score)
    async getLeaderboard(limit = 10, minDate = null) {
        try {
            let url = `${this._url}/rest/v1/scores?select=pseudo,email,best&order=best.desc&limit=${limit}`;
            if (minDate) {
                // Filter for new players (created after minDate)
                url += `&created_at=gt.${minDate}`;
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
