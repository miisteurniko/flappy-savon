// ========================================
// Flappy Savon - Analytics Module
// ========================================

const Analytics = {
    _sessionId: null,
    _sessionStart: null,
    _gameStart: null,
    _queue: [],
    _sending: false,

    // Supabase config (reuse from Supabase module)
    _url: 'https://zbrjpvtzmdmkacsffsni.supabase.co',
    _key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpicmpwdnR6bWRta2Fjc2Zmc25pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3Njg1NzQsImV4cCI6MjA4MjM0NDU3NH0.xOPdO47EoRIE_e1t60nbRR3QH4XXtPOZ9zmy4O7_ZFw',

    // Initialize analytics
    init() {
        // Generate or retrieve session ID
        this._sessionId = this._getSessionId();
        this._sessionStart = Date.now();

        // Track session start
        this.track('session_start', {
            referrer: document.referrer || 'direct',
            device: this._getDeviceType(),
            returning: !!localStorage.getItem('flappySavonSkin'),
            screen: `${window.innerWidth}x${window.innerHeight}`,
            email: localStorage.getItem('email') || null,
            pseudo: localStorage.getItem('pseudo') || null
        });

        console.log('[Analytics] Session started:', this._sessionId);

        // Flush queue on page unload
        window.addEventListener('beforeunload', () => {
            this._flushSync();
        });

        // Flush queue periodically
        setInterval(() => this._flush(), 10000);
    },

    // Generate unique session ID
    _getSessionId() {
        // Use sessionStorage for per-visit ID
        let id = sessionStorage.getItem('flappySessionId');
        if (!id) {
            id = 'sess_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
            sessionStorage.setItem('flappySessionId', id);
        }
        return id;
    },

    // Detect device type
    _getDeviceType() {
        const ua = navigator.userAgent;
        if (/iPad|iPhone|iPod/.test(ua)) return 'ios';
        if (/Android/.test(ua)) return 'android';
        if (/Mobile/.test(ua)) return 'mobile';
        return 'desktop';
    },

    // Track an event
    track(event, data = {}) {
        const payload = {
            session_id: this._sessionId,
            event: event,
            data: JSON.stringify(data),
            created_at: new Date().toISOString()
        };

        this._queue.push(payload);

        // Log for debugging
        console.log('[Analytics]', event, data);

        // Flush if queue is getting large
        if (this._queue.length >= 5) {
            this._flush();
        }
    },

    // Track game start
    trackGameStart() {
        if (this._gameStart) return; // Already tracked
        this._gameStart = Date.now();

        this.track('game_start', {
            is_registered: !!localStorage.getItem('email'),
            best_score: parseInt(localStorage.getItem('flappySavonBest') || '0', 10)
        });
    },

    // Track game end
    trackGameEnd(score) {
        if (!this._gameStart) return;

        const duration = Date.now() - this._gameStart;
        this._gameStart = null; // Reset for next game

        const email = localStorage.getItem('email');
        const pseudo = localStorage.getItem('pseudo');

        this.track('game_end', {
            score: score,
            duration_ms: duration,
            is_registered: !!email,
            email: email || null,
            pseudo: pseudo || null
        });
    },

    // Flush queue to Supabase
    async _flush() {
        if (this._sending || this._queue.length === 0) return;

        this._sending = true;
        const toSend = [...this._queue];
        this._queue = [];

        try {
            const response = await fetch(`${this._url}/rest/v1/analytics_events`, {
                method: 'POST',
                headers: {
                    'apikey': this._key,
                    'Authorization': `Bearer ${this._key}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify(toSend)
            });

            if (!response.ok) {
                // Put back in queue on failure
                this._queue = [...toSend, ...this._queue];
                console.warn('[Analytics] Send failed:', response.status);
            }
        } catch (e) {
            // Put back in queue on error
            this._queue = [...toSend, ...this._queue];
            console.warn('[Analytics] Send error:', e);
        }

        this._sending = false;
    },

    // Synchronous flush for beforeunload (uses sendBeacon)
    _flushSync() {
        if (this._queue.length === 0) return;

        const data = JSON.stringify(this._queue);

        // Use sendBeacon for reliable delivery on page close
        if (navigator.sendBeacon) {
            const blob = new Blob([data], { type: 'application/json' });
            navigator.sendBeacon(
                `${this._url}/rest/v1/analytics_events?apikey=${this._key}`,
                blob
            );
        }

        this._queue = [];
    }
};
