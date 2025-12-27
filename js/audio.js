// ========================================
// Flappy Savon - Audio Module
// ========================================

const Audio = {
    _gainNode: null,

    // Initialize audio context
    init() {
        this._muted = localStorage.getItem('flappySavonMuted') === '1';
    },

    // Ensure audio context exists (must be called after user interaction)
    ensureContext() {
        if (!this._ctx) {
            try {
                this._ctx = new (window.AudioContext || window.webkitAudioContext)();

                // Create shared master gain node for performance
                this._gainNode = this._ctx.createGain();
                this._gainNode.gain.value = 0.04;
                this._gainNode.connect(this._ctx.destination);
            } catch (e) {
                console.warn('Audio not supported');
            }
        }
        // Resume if suspended (browser policy)
        if (this._ctx && this._ctx.state === 'suspended') {
            this._ctx.resume();
        }
    },

    // Play a tone (optimized)
    _tone(freq, dur = 0.08, type = 'sine') {
        if (this._muted || !this._ctx || !this._gainNode) return;

        try {
            const osc = this._ctx.createOscillator();
            osc.type = type;
            osc.frequency.value = freq;

            // Connect directly to master gain (no per-sound gain node)
            osc.connect(this._gainNode);

            const now = this._ctx.currentTime;
            osc.start(now);
            osc.stop(now + dur);

            // Cleanup on end (garbage collection of oscillator is handled by browser audio thread mostly)
            osc.onended = () => osc.disconnect();
        } catch (e) {
            // Ignore audio errors
        }
    },

    // Sound effects
    flap() {
        this._tone(880, 0.05, 'square');
    },

    score() {
        this._tone(660, 0.06, 'sine');
        setTimeout(() => this._tone(990, 0.06, 'sine'), 60);
    },

    hit() {
        this._tone(120, 0.15, 'sawtooth');
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
