// ========================================
// Flappy Savon - Security Module
// ========================================

const Security = {
    // Session data for anti-cheat
    _session: {
        seed: null,
        startTime: 0,
        flapCount: 0,
        pipesPassed: 0,
        lastPostTime: 0,
        integrityChecks: []
    },

    // Initialize new session
    initSession() {
        this._session.seed = this._generateSeed();
        this._session.startTime = performance.now();
        this._session.flapCount = 0;
        this._session.pipesPassed = 0;
        this._session.integrityChecks = [];
        return this._session.seed;
    },

    // Generate cryptographic session seed
    _generateSeed() {
        const arr = new Uint8Array(16);
        crypto.getRandomValues(arr);
        return Array.from(arr, b => b.toString(16).padStart(2, '0')).join('');
    },

    // Record a flap action
    recordFlap() {
        this._session.flapCount++;
    },

    // Record pipe passed
    recordPipe(score) {
        this._session.pipesPassed = score;
        // Store timestamp for verification
        this._session.integrityChecks.push({
            score,
            time: performance.now() - this._session.startTime
        });
    },

    // Validate score is plausible
    validateScore(score) {
        const elapsed = (performance.now() - this._session.startTime) / 1000;

        // Check 1: Minimum game duration
        if (elapsed < CONFIG.security.minGameDuration && score > 0) {
            console.warn('[Security] Game too short for score');
            return false;
        }

        // Check 2: Maximum theoretical score rate
        const maxPossibleScore = Math.ceil(elapsed * CONFIG.security.maxScorePerSecond);
        if (score > maxPossibleScore + 2) { // +2 tolerance
            console.warn('[Security] Score rate too high');
            return false;
        }

        // Check 3: Flaps vs score ratio (need to flap to pass pipes)
        if (this._session.flapCount < score * 0.5) {
            console.warn('[Security] Insufficient flaps for score');
            return false;
        }

        // Check 4: Score matches recorded pipes
        if (this._session.pipesPassed !== score) {
            console.warn('[Security] Score mismatch');
            return false;
        }

        return true;
    },

    // Check rate limiting
    canPostScore() {
        const now = Date.now();
        if (now - this._session.lastPostTime < CONFIG.security.postCooldown) {
            return false;
        }
        this._session.lastPostTime = now;
        return true;
    },

    // Generate secure hash for score submission
    async generateHash(data) {
        const payload = [
            data.pseudo,
            data.email,
            data.score,
            data.elapsed,
            this._session.seed,
            this._session.flapCount,
            CONFIG.security.hashSalt
        ].join('|');

        const encoder = new TextEncoder();
        const buffer = await crypto.subtle.digest('SHA-256', encoder.encode(payload));
        return Array.from(new Uint8Array(buffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    },

    // Get session data for submission
    getSessionData() {
        return {
            seed: this._session.seed,
            flaps: this._session.flapCount,
            elapsed: Math.round((performance.now() - this._session.startTime) / 1000),
            checks: this._session.integrityChecks.length
        };
    },

    // Detect suspicious behavior (disabled for performance)
    detectTampering() {
        return false;
    }
};
