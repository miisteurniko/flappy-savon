// ========================================
// Flappy Savon - Audio Module
// ========================================

const Audio = {
    _ctx: null,
    _muted: false,

    // Initialize audio context
    init() {
        this._muted = localStorage.getItem('flappySavonMuted') === '1';
    },

    // Ensure audio context exists (must be called after user interaction)
    ensureContext() {
        if (!this._ctx) {
            try {
                this._ctx = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) {
                console.warn('Audio not supported');
            }
        }
    },

    // Play a tone
    _tone(freq, dur = 0.08, type = 'sine', gain = 0.03) {
        if (this._muted || !this._ctx) return;

        try {
            const osc = this._ctx.createOscillator();
            const gainNode = this._ctx.createGain();

            osc.type = type;
            osc.frequency.value = freq;
            gainNode.gain.value = gain;

            osc.connect(gainNode);
            gainNode.connect(this._ctx.destination);

            const now = this._ctx.currentTime;
            osc.start(now);
            osc.stop(now + dur);
        } catch (e) {
            // Ignore audio errors
        }
    },

    // Sound effects
    flap() {
        this._tone(880, 0.05, 'square', 0.035);
    },

    score() {
        this._tone(660, 0.06, 'sine', 0.045);
        setTimeout(() => this._tone(990, 0.06, 'sine', 0.04), 60);
    },

    hit() {
        this._tone(120, 0.15, 'sawtooth', 0.05);
    },

    // Toggle mute
    toggle() {
        this._muted = !this._muted;
        localStorage.setItem('flappySavonMuted', this._muted ? '1' : '0');
        return this._muted;
    },

    // Get mute state
    isMuted() {
        return this._muted;
    }
};

// Initialize on load
Audio.init();
