// ========================================
// Flappy Savon - Canvas Resize Handler
// ========================================

const CanvasResize = {
    _canvas: null,
    _baseWidth: 420,
    _baseHeight: 700,
    _scale: 1,
    _resizeTimeout: null,

    // Initialize resize handler
    init(canvas) {
        this._canvas = canvas;

        // Initial resize
        this.resize();

        // Debounced resize handler
        const debouncedResize = () => {
            clearTimeout(this._resizeTimeout);
            this._resizeTimeout = setTimeout(() => this.resize(), 100);
        };

        // Listen for resize and orientation change with debounce
        window.addEventListener('resize', debouncedResize, { passive: true });
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.resize(), 150);
        }, { passive: true });

        // Handle visual viewport changes (for iOS keyboard, etc.)
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', debouncedResize, { passive: true });
        }
    },

    // Resize canvas to fill entire screen (cover mode)
    resize() {
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        // Calculate scale to COVER screen (fill entirely, may crop)
        const scaleX = vw / this._baseWidth;
        const scaleY = vh / this._baseHeight;
        this._scale = Math.max(scaleX, scaleY); // Changed from min to max for cover

        // Set canvas display size to fill viewport
        this._canvas.style.width = vw + 'px';
        this._canvas.style.height = vh + 'px';

        // Keep internal resolution for crisp rendering
        // (The canvas element's width/height attributes stay the same)

        // Update CONFIG if needed for game logic
        // Note: We don't change CONFIG.canvas as game logic uses fixed coordinates
    },

    // Get current scale factor for input handling
    getScale() {
        return this._scale;
    },

    // Convert screen coordinates to canvas coordinates
    screenToCanvas(screenX, screenY) {
        const rect = this._canvas.getBoundingClientRect();
        return {
            x: (screenX - rect.left) / this._scale,
            y: (screenY - rect.top) / this._scale
        };
    }
};
